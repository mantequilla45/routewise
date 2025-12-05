import { LatLng } from '@/types/GeoTypes';
import { query } from '@/lib/db/db';
import { BaseRouteHandler, RouteCalculationResult } from '../BaseHandler';

/**
 * Case 7: Transfer with Start Opposite
 * - Start: Opposite side on Route A (find alternative boarding point)
 * - Transfer: Normal intersection
 * - End: Correct side on Route B
 */
export class Case7TransferStartOppositeHandler extends BaseRouteHandler {
    getCaseName(): string {
        return 'CASE_7_TRANSFER_START_OPPOSITE';
    }

    async canHandle(from: LatLng, to: LatLng): Promise<boolean> {
        console.log('🔍 Case 7: Checking if Transfer with Start Opposite can handle this route...');
        
        // Check if there are routes near start that are on opposite side but can transfer
        const checkQuery = `
            WITH start_routes AS (
                -- Routes near start but potentially on opposite side
                SELECT DISTINCT r.id, r.route_code, r.geom_forward,
                       ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as start_dist
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 200)
                    -- Look for routes that are somewhat far (opposite side)
                    AND ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) > 15
            ),
            end_routes AS (
                -- Routes near end point
                SELECT DISTINCT r.id, r.route_code, r.geom_forward
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 100)
            )
            -- Check if any start routes (opposite side) intersect with end routes
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
        console.log(`🔍 Case 7: ${canHandle ? '✅ Can handle' : '❌ Cannot handle'}`);
        
        return canHandle;
    }

    async calculate(from: LatLng, to: LatLng): Promise<RouteCalculationResult | null> {
        console.log('🚗 Case 7: Calculating Transfer with Start Opposite route...');
        
        // First check which routes need adjustment
        const checkQuery = `
            WITH routes_check AS (
                SELECT 
                    r.route_code,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as original_pos
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 200)
            ),
            route_intersections AS (
                SELECT 
                    rc.route_code,
                    rc.original_pos,
                    ST_LineLocatePoint(r1.geom_forward, 
                        CASE 
                            WHEN ST_GeometryType(ST_Intersection(r1.geom_forward, r2.geom_forward)) = 'ST_Point'
                            THEN ST_Intersection(r1.geom_forward, r2.geom_forward)
                            ELSE ST_GeometryN(ST_Intersection(r1.geom_forward, r2.geom_forward), 1)
                        END
                    ) as transfer_pos
                FROM routes_check rc
                JOIN jeepney_routes r1 ON rc.route_code = r1.route_code
                JOIN jeepney_routes r2 ON r2.route_code = '01K'
                WHERE ST_Intersects(r1.geom_forward, r2.geom_forward)
            )
            SELECT 
                route_code,
                original_pos,
                MIN(transfer_pos) as earliest_transfer,
                CASE WHEN original_pos > MIN(transfer_pos) THEN 'needs_adjustment' ELSE 'ok' END as status
            FROM route_intersections
            GROUP BY route_code, original_pos
            ORDER BY route_code;
        `;
        
        const checkResults = await query(checkQuery, [from.longitude, from.latitude]);
        const needingAdjustment = checkResults.filter((r: any) => r.status === 'needs_adjustment').length;
        console.log(`  ${needingAdjustment} routes need start point adjustment`);
        
        const routeQuery = `
            WITH start_routes_base AS (
                -- All routes within 200m of start
                SELECT 
                    r.id,
                    r.route_code,
                    CONCAT(r.start_point_name, ' - ', r.end_point_name) as route_name,
                    r.geom_forward,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as original_pos,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as start_dist
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 200)
            ),
            -- Find all valid transfer points first
            transfer_points AS (
                SELECT 
                    sr.id as route_id,
                    sr.route_code,
                    MIN(ST_LineLocatePoint(sr.geom_forward, 
                        CASE 
                            WHEN ST_GeometryType(ST_Intersection(sr.geom_forward, r2.geom_forward)) = 'ST_Point'
                            THEN ST_Intersection(sr.geom_forward, r2.geom_forward)
                            ELSE ST_GeometryN(ST_Intersection(sr.geom_forward, r2.geom_forward), 1)
                        END
                    )) as earliest_transfer_pos
                FROM start_routes_base sr
                JOIN jeepney_routes r2 ON ST_Intersects(sr.geom_forward, r2.geom_forward)
                WHERE ST_DWithin(r2.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 100)
                GROUP BY sr.id, sr.route_code
            ),
            -- Find all possible boarding points within 100m
            boarding_points AS (
                SELECT 
                    sr.*,
                    tp.earliest_transfer_pos,
                    s.pos as boarding_pos,
                    ST_Distance(
                        ST_LineInterpolatePoint(sr.geom_forward, s.pos)::geography,
                        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                    ) as boarding_distance
                FROM start_routes_base sr
                JOIN transfer_points tp ON sr.id = tp.route_id
                CROSS JOIN LATERAL (
                    SELECT generate_series(0.0, 1.0, 0.001) as pos
                ) s
                WHERE ST_DWithin(
                    ST_LineInterpolatePoint(sr.geom_forward, s.pos)::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                    100
                )
                -- Only keep boarding points that are before the earliest transfer point
                AND s.pos < tp.earliest_transfer_pos
            ),
            -- Group and pick best boarding point for each route
            start_routes AS (
                SELECT DISTINCT ON (id)
                    id,
                    route_code,
                    route_name,
                    geom_forward,
                    boarding_pos,
                    boarding_distance,
                    start_dist,
                    original_pos,
                    earliest_transfer_pos
                FROM boarding_points
                ORDER BY id, boarding_distance  -- Pick closest boarding point for each route
            ),
            end_routes AS (
                -- Routes near destination
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
            -- Find ALL intersection points
            all_intersections AS (
                SELECT 
                    s.id as route_a_id,
                    s.route_code as route_a_code,
                    s.route_name as route_a_name,
                    s.geom_forward as route_a_geom,
                    s.boarding_pos,
                    s.boarding_distance,
                    s.start_dist,
                    s.original_pos,
                    e.id as route_b_id,
                    e.route_code as route_b_code,
                    e.route_name as route_b_name,
                    e.geom_forward as route_b_geom,
                    e.alighting_pos,
                    e.alighting_distance,
                    ST_Intersection(s.geom_forward, e.geom_forward) as intersection_geom
                FROM start_routes s
                CROSS JOIN end_routes e
                WHERE s.id != e.id
                    AND ST_Intersects(s.geom_forward, e.geom_forward)
            ),
            -- Extract individual intersection points
            intersection_points AS (
                -- Single point intersections
                SELECT 
                    route_a_id, route_a_code, route_a_name, route_a_geom,
                    boarding_pos, boarding_distance, start_dist, original_pos,
                    route_b_id, route_b_code, route_b_name, route_b_geom,
                    alighting_pos, alighting_distance,
                    intersection_geom as intersection_point
                FROM all_intersections
                WHERE ST_GeometryType(intersection_geom) = 'ST_Point'
                
                UNION ALL
                
                -- Multi-point intersections
                SELECT 
                    route_a_id, route_a_code, route_a_name, route_a_geom,
                    boarding_pos, boarding_distance, start_dist, original_pos,
                    route_b_id, route_b_code, route_b_name, route_b_geom,
                    alighting_pos, alighting_distance,
                    ST_GeometryN(intersection_geom, gs.n) as intersection_point
                FROM all_intersections
                CROSS JOIN LATERAL generate_series(1, ST_NumGeometries(intersection_geom)) as gs(n)
                WHERE ST_GeometryType(intersection_geom) IN ('ST_MultiPoint', 'ST_GeometryCollection')
            ),
            -- Calculate positions for each intersection
            intersections AS (
                SELECT 
                    *,
                    ST_LineLocatePoint(route_a_geom, intersection_point) as transfer_pos_a,
                    ST_LineLocatePoint(route_b_geom, intersection_point) as transfer_pos_b
                FROM intersection_points
            ),
            -- Check which routes COULD NOT work without boarding adjustment
            routes_needing_adjustment AS (
                SELECT 
                    route_a_id,
                    route_a_code,
                    -- Count how many valid transfer points exist from original position
                    SUM(CASE 
                        WHEN original_pos < transfer_pos_a AND transfer_pos_b < alighting_pos 
                        THEN 1 
                        ELSE 0 
                    END) as valid_from_original
                FROM intersections
                GROUP BY route_a_id, route_a_code
                -- Only routes with NO valid transfers from original position need adjustment
                HAVING SUM(CASE 
                    WHEN original_pos < transfer_pos_a AND transfer_pos_b < alighting_pos 
                    THEN 1 
                    ELSE 0 
                END) = 0
            ),
            -- Filter for valid transfers (forward travel)
            valid_transfers AS (
                SELECT 
                    i.*,
                    ST_Length(ST_LineSubstring(i.route_a_geom, i.boarding_pos, i.transfer_pos_a)::geography) as route_a_distance,
                    ST_Length(ST_LineSubstring(i.route_b_geom, i.transfer_pos_b, i.alighting_pos)::geography) as route_b_distance
                FROM intersections i
                JOIN routes_needing_adjustment rna ON i.route_a_id = rna.route_a_id
                WHERE i.boarding_pos < i.transfer_pos_a  -- Can travel forward on route A
                    AND i.transfer_pos_b < i.alighting_pos  -- Can travel forward on route B
                    -- Case 7: Only routes that NEEDED adjustment (couldn't work from original position)
            ),
            -- Get best transfers
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
                start_dist,
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
            console.log('🚗 Case 7: No valid transfer routes with opposite start found');
            return null;
        }

        console.log(`🚗 Case 7: Found ${results.length} transfer route(s) with opposite start`);
        
        const segments = results.map((route: any) => {
            const coords_a = this.parseGeoJson(route.segment_a_geojson);
            const coords_b = this.parseGeoJson(route.segment_b_geojson);
            const fare_a = this.calculateFare(route.route_a_distance);
            const fare_b = this.calculateFare(route.route_b_distance);
            
            // Reduced logging
            
            return {
                isTransfer: true,
                routeId: `${route.route_a_id}-${route.route_b_id}`,
                routeCode: `${route.route_a_code} → ${route.route_b_code}`,
                routeName: `Transfer (Start Opposite): ${route.route_a_name} to ${route.route_b_name}`,
                distance: route.total_distance,
                fare: fare_a + fare_b,
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
                coordinates: [...coords_a, ...coords_b],
                startOpposite: true  // Mark this as opposite side start
            };
        });
        
        return {
            caseName: this.getCaseName(),
            segments,
            totalDistance: segments[0]?.totalDistance || 0,
            totalFare: segments[0]?.totalFare || 26,
            confidence: 0.65,
            debugInfo: {
                isTransfer: true,
                startOpposite: true,
                routeCount: segments.length
            }
        };
    }
}