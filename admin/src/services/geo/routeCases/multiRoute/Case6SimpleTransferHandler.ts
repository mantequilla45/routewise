import { LatLng } from '@/types/GeoTypes';
import { query } from '@/lib/db/db';
import { BaseRouteHandler, RouteCalculationResult, RouteSegment } from '../BaseHandler';
import { TransferRouteResult } from '../types';

/**
 * Case 6: Simple Transfer (2 Jeeps)
 * - Find all jeeps that can be boarded from start
 * - Find all jeeps that can reach destination
 * - Check if any of their routes intersect
 */
export class Case6SimpleTransferHandler extends BaseRouteHandler {
    getCaseName(): string {
        return 'CASE_6_SIMPLE_TRANSFER';
    }

    async canHandle(from: LatLng, to: LatLng): Promise<boolean> {
        console.log('🔍 Case 6: Checking if Simple Transfer can handle this route...');
        
        // Quick check if there's a potential transfer solution
        const checkQuery = `
            WITH start_routes AS (
                -- Routes accessible from start point
                SELECT DISTINCT r.id, r.route_code, r.geom_forward
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 100)
            ),
            end_routes AS (
                -- Routes accessible from end point
                SELECT DISTINCT r.id, r.route_code, r.geom_forward
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 100)
            )
            -- Check if any start routes intersect with any end routes
            SELECT 1
            FROM start_routes s, end_routes e
            WHERE s.id != e.id
                AND ST_Intersects(s.geom_forward, e.geom_forward)
            LIMIT 1;
        `;
        
        const results = await query(checkQuery, [
            from.longitude, from.latitude,
            to.longitude, to.latitude
        ]);
        
        const canHandle = results.length > 0;
        console.log(`🔍 Case 6: ${canHandle ? '✅ Can handle' : '❌ Cannot handle'}`);
        
        return canHandle;
    }

    async calculate(from: LatLng, to: LatLng): Promise<RouteCalculationResult | null> {
        console.log('🚗 Case 6: Calculating Simple Transfer route...');
        
        // First, log all routes near start and end points
        const startRoutesQuery = `
            SELECT DISTINCT r.route_code, 
                   ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
            FROM jeepney_routes r
            WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 100)
            ORDER BY distance;
        `;
        
        const endRoutesQuery = `
            SELECT DISTINCT r.route_code,
                   ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
            FROM jeepney_routes r
            WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 100)
            ORDER BY distance;
        `;
        
        const startRoutes = await query(startRoutesQuery, [from.longitude, from.latitude]);
        const endRoutes = await query(endRoutesQuery, [to.longitude, to.latitude]);
        
        // Reduced logging - just summary
        console.log(`  Found ${startRoutes.length} start routes, ${endRoutes.length} end routes`);
        
        // Check which routes intersect
        const intersectionCheckQuery = `
            WITH start_routes AS (
                SELECT DISTINCT r.route_code as start_code, r.geom_forward as start_geom
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 100)
            ),
            end_routes AS (
                SELECT DISTINCT r.route_code as end_code, r.geom_forward as end_geom
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 100)
            )
            SELECT s.start_code, e.end_code,
                   ST_Intersects(s.start_geom, e.end_geom) as intersects
            FROM start_routes s
            CROSS JOIN end_routes e
            WHERE s.start_code != e.end_code;
        `;
        
        const intersections = await query(intersectionCheckQuery, [
            from.longitude, from.latitude,
            to.longitude, to.latitude
        ]);
        
        const intersectCount = intersections.filter((i: Record<string, unknown>) => i.intersects).length;
        console.log(`  ${intersectCount} route pairs intersect`);
        
        // Check which transfers are valid (including ALL intersection points)
        const validityCheckQuery = `
            WITH start_routes AS (
                SELECT 
                    r.id,
                    r.route_code,
                    r.geom_forward,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as boarding_pos
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 100)
            ),
            end_routes AS (
                SELECT 
                    r.id,
                    r.route_code,
                    r.geom_forward,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as alighting_pos
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 100)
            ),
            all_intersections AS (
                SELECT 
                    s.route_code as route_a_code,
                    e.route_code as route_b_code,
                    s.boarding_pos,
                    e.alighting_pos,
                    ST_Intersection(s.geom_forward, e.geom_forward) as intersection_geom
                FROM start_routes s
                CROSS JOIN end_routes e
                WHERE s.id != e.id
                    AND ST_Intersects(s.geom_forward, e.geom_forward)
            ),
            intersection_points AS (
                -- Handle single point intersections
                SELECT 
                    route_a_code,
                    route_b_code,
                    boarding_pos,
                    alighting_pos,
                    1 as num_intersections,
                    1 as point_num,
                    intersection_geom as intersection_point
                FROM all_intersections
                WHERE ST_GeometryType(intersection_geom) = 'ST_Point'
                
                UNION ALL
                
                -- Handle multi-point intersections
                SELECT 
                    route_a_code,
                    route_b_code,
                    boarding_pos,
                    alighting_pos,
                    ST_NumGeometries(intersection_geom) as num_intersections,
                    gs.n as point_num,
                    ST_GeometryN(intersection_geom, gs.n) as intersection_point
                FROM all_intersections
                CROSS JOIN LATERAL generate_series(1, ST_NumGeometries(intersection_geom)) as gs(n)
                WHERE ST_GeometryType(intersection_geom) IN ('ST_MultiPoint', 'ST_GeometryCollection')
            ),
            intersections AS (
                SELECT 
                    route_a_code,
                    route_b_code,
                    boarding_pos,
                    alighting_pos,
                    num_intersections,
                    point_num,
                    ST_LineLocatePoint(
                        (SELECT geom_forward FROM start_routes WHERE route_code = ip.route_a_code LIMIT 1), 
                        intersection_point
                    ) as transfer_pos_a,
                    ST_LineLocatePoint(
                        (SELECT geom_forward FROM end_routes WHERE route_code = ip.route_b_code LIMIT 1), 
                        intersection_point
                    ) as transfer_pos_b
                FROM intersection_points ip
            )
            SELECT 
                route_a_code,
                route_b_code,
                boarding_pos,
                transfer_pos_a,
                transfer_pos_b,
                alighting_pos,
                num_intersections,
                point_num,
                boarding_pos < transfer_pos_a as can_forward_a,
                transfer_pos_b < alighting_pos as can_forward_b
            FROM intersections
            ORDER BY route_a_code, route_b_code, point_num;
        `;
        
        const validityChecks = await query(validityCheckQuery, [
            from.longitude, from.latitude,
            to.longitude, to.latitude
        ]);
        
        const validTransfers = validityChecks.filter((v: Record<string, unknown>) => v.can_forward_a && v.can_forward_b).length;
        console.log(`  ${validTransfers} valid transfer points found`);
        
        const routeQuery = `
            WITH start_routes AS (
                -- All routes that pass near the starting point
                SELECT 
                    r.id,
                    r.route_code,
                    CONCAT(r.start_point_name, ' - ', r.end_point_name) as route_name,
                    r.geom_forward,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as boarding_pos,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as boarding_distance
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 100)
            ),
            end_routes AS (
                -- All routes that pass near the destination
                SELECT 
                    r.id,
                    r.route_code,
                    CONCAT(r.start_point_name, ' - ', r.end_point_name) as route_name,
                    r.geom_forward,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as alighting_pos,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography) as alighting_distance
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 100)
            ),
            -- Find ALL intersection points between routes
            all_intersections AS (
                SELECT 
                    s.id as route_a_id,
                    s.route_code as route_a_code,
                    s.route_name as route_a_name,
                    s.geom_forward as route_a_geom,
                    s.boarding_pos,
                    s.boarding_distance,
                    e.id as route_b_id,
                    e.route_code as route_b_code,
                    e.route_name as route_b_name,
                    e.geom_forward as route_b_geom,
                    e.alighting_pos,
                    e.alighting_distance,
                    ST_Intersection(s.geom_forward, e.geom_forward) as intersection_geom
                FROM start_routes s
                CROSS JOIN end_routes e
                WHERE s.id != e.id  -- Different routes
                    AND ST_Intersects(s.geom_forward, e.geom_forward)  -- Routes must intersect
            ),
            -- Extract individual intersection points (handle single and multi-point intersections)
            intersection_points AS (
                -- Handle single point intersections
                SELECT 
                    route_a_id, route_a_code, route_a_name, route_a_geom,
                    boarding_pos, boarding_distance,
                    route_b_id, route_b_code, route_b_name, route_b_geom,
                    alighting_pos, alighting_distance,
                    intersection_geom as intersection_point
                FROM all_intersections
                WHERE ST_GeometryType(intersection_geom) = 'ST_Point'
                
                UNION ALL
                
                -- Handle multi-point intersections
                SELECT 
                    route_a_id, route_a_code, route_a_name, route_a_geom,
                    boarding_pos, boarding_distance,
                    route_b_id, route_b_code, route_b_name, route_b_geom,
                    alighting_pos, alighting_distance,
                    ST_GeometryN(intersection_geom, gs.n) as intersection_point
                FROM all_intersections
                CROSS JOIN LATERAL generate_series(1, ST_NumGeometries(intersection_geom)) as gs(n)
                WHERE ST_GeometryType(intersection_geom) IN ('ST_MultiPoint', 'ST_GeometryCollection')
            ),
            -- Calculate positions for each intersection point
            intersections AS (
                SELECT 
                    *,
                    ST_LineLocatePoint(route_a_geom, intersection_point) as transfer_pos_a,
                    ST_LineLocatePoint(route_b_geom, intersection_point) as transfer_pos_b
                FROM intersection_points
            ),
            -- Calculate valid transfers (must allow forward travel)
            valid_transfers AS (
                SELECT 
                    *,
                    ST_Length(ST_LineSubstring(route_a_geom, boarding_pos, transfer_pos_a)::geography) as route_a_distance,
                    ST_Length(ST_LineSubstring(route_b_geom, transfer_pos_b, alighting_pos)::geography) as route_b_distance
                FROM intersections
                WHERE 
                    boarding_pos < transfer_pos_a  -- Can travel forward on route A
                    AND transfer_pos_b < alighting_pos  -- Can travel forward on route B
            ),
            -- Get the best transfers
            best_transfers AS (
                SELECT 
                    *,
                    (route_a_distance + route_b_distance) as total_distance
                FROM valid_transfers
                ORDER BY (route_a_distance + route_b_distance)
                LIMIT 5
            )
            SELECT 
                route_a_id,
                route_a_code,
                route_a_name,
                route_b_id,
                route_b_code,
                route_b_name,
                boarding_pos,
                transfer_pos_a,
                transfer_pos_b,
                alighting_pos,
                boarding_distance,
                alighting_distance,
                route_a_distance,
                route_b_distance,
                total_distance,
                -- Get polylines for both segments
                ST_AsGeoJSON(
                    ST_LineSubstring(
                        route_a_geom, 
                        GREATEST(boarding_pos - 0.000, 0),
                        LEAST(transfer_pos_a + 0.000, 1.0)
                    )
                ) as segment_a_geojson,
                ST_AsGeoJSON(
                    ST_LineSubstring(
                        route_b_geom,
                        GREATEST(transfer_pos_b - 0.000, 0),
                        LEAST(alighting_pos + 0.000, 1.0)
                    )
                ) as segment_b_geojson
            FROM best_transfers;
        `;

        const results = await query(routeQuery, [
            from.longitude, from.latitude,
            to.longitude, to.latitude
        ]);

        if (results.length === 0) {
            console.log('🚗 Case 6: No valid transfer routes found');
            return null;
        }

        console.log(`🚗 Case 6: Found ${results.length} transfer route(s)`);
        
        const segments: RouteSegment[] = results.map((route: TransferRouteResult) => {
            const coords_a = this.parseGeoJson(route.segment_a_geojson);
            const coords_b = this.parseGeoJson(route.segment_b_geojson);
            const fare_a = this.calculateFare(route.route_a_distance);
            const fare_b = this.calculateFare(route.route_b_distance);
            
            console.log(`  Transfer: ${route.route_a_code} → ${route.route_b_code}`);
            console.log(`    Route A: ${(route.route_a_distance / 1000).toFixed(2)}km, ₱${fare_a}`);
            console.log(`    Route B: ${(route.route_b_distance / 1000).toFixed(2)}km, ₱${fare_b}`);
            console.log(`    Total: ${(route.total_distance / 1000).toFixed(2)}km, ₱${fare_a + fare_b}`);
            
            return {
                isTransfer: true,
                routeId: `${route.route_a_id}-${route.route_b_id}`,
                routeCode: `${route.route_a_code} → ${route.route_b_code}`,
                routeName: `Transfer: ${route.route_a_name} to ${route.route_b_name}`,
                distance: route.total_distance,  // Required property
                fare: fare_a + fare_b,           // Required property
                firstRoute: {
                    routeId: route.route_a_id,
                    routeCode: route.route_a_code,
                    routeName: route.route_a_name,
                    coordinates: coords_a,
                    distance: route.route_a_distance,
                    fare: fare_a,
                    startPosition: route.boarding_pos,
                    endPosition: route.transfer_pos_a
                },
                secondRoute: {
                    routeId: route.route_b_id,
                    routeCode: route.route_b_code,
                    routeName: route.route_b_name,
                    coordinates: coords_b,
                    distance: route.route_b_distance,
                    fare: fare_b,
                    startPosition: route.transfer_pos_b,
                    endPosition: route.alighting_pos
                },
                totalDistance: route.total_distance,
                totalFare: fare_a + fare_b,
                boardingWalk: route.boarding_distance,
                alightingWalk: route.alighting_distance,
                coordinates: [...coords_a, ...coords_b]  // Combined coordinates for display
            };
        });
        
        return {
            caseName: this.getCaseName(),
            segments,
            totalDistance: segments[0]?.totalDistance || 0,
            totalFare: segments[0]?.totalFare || 26,
            confidence: 0.7,
            debugInfo: {
                isTransfer: true,
                routeCount: segments.length
            }
        };
    }
}