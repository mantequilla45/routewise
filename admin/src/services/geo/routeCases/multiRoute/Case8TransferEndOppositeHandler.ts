import { LatLng } from '@/types/GeoTypes';
import { query } from '@/lib/db/db';
import { BaseRouteHandler, RouteCalculationResult } from '../BaseHandler';

/**
 * Case 8: Transfer with End Opposite
 * - Start: Correct side on Route A (normal boarding)
 * - Transfer: Normal intersection
 * - End: Opposite side on Route B (find alternative alighting point)
 * 
 * This handles cases where the transfer point is AFTER the destination on Route B,
 * requiring us to find an alternative alighting point before the transfer.
 */
export class Case8TransferEndOppositeHandler extends BaseRouteHandler {
    getCaseName(): string {
        return 'CASE_8_TRANSFER_END_OPPOSITE';
    }

    async canHandle(from: LatLng, to: LatLng): Promise<boolean> {
        console.log('🔍 Case 8: Checking if Transfer with End Opposite can handle this route...');
        
        // Simple check: can we find transfer routes?
        const checkQuery = `
            WITH start_routes AS (
                SELECT DISTINCT r.id, r.geom_forward
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 100)
            ),
            end_routes AS (
                SELECT DISTINCT r.id, r.geom_forward
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 500)
            )
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
        console.log(`🔍 Case 8: ${canHandle ? '✅ Can handle' : '❌ Cannot handle'}`);
        
        return canHandle;
    }

    async calculate(from: LatLng, to: LatLng): Promise<RouteCalculationResult | null> {
        console.log('🚗 Case 8: Calculating Transfer with End Opposite route...');
        
        const routeQuery = `
            WITH start_routes AS (
                -- Routes near start (normal boarding)
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
            end_routes_base AS (
                -- Routes that pass within 500m of destination
                SELECT 
                    r.id,
                    r.route_code,
                    CONCAT(r.start_point_name, ' - ', r.end_point_name) as route_name,
                    r.geom_forward,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as original_dest_pos,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography) as dest_dist
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 500)  -- Wide search like Case 5
            ),
            -- Find all route combinations that intersect
            route_pairs AS (
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
                    e.original_dest_pos,
                    e.dest_dist,
                    ST_Intersection(s.geom_forward, e.geom_forward) as intersection_geom
                FROM start_routes s
                CROSS JOIN end_routes_base e
                WHERE s.id != e.id
                    AND ST_Intersects(s.geom_forward, e.geom_forward)
            ),
            -- Extract all intersection points
            all_intersections AS (
                -- Single points
                SELECT *,
                    intersection_geom as intersection_point
                FROM route_pairs
                WHERE ST_GeometryType(intersection_geom) = 'ST_Point'
                
                UNION ALL
                
                -- Multiple points
                SELECT 
                    route_a_id, route_a_code, route_a_name, route_a_geom,
                    boarding_pos, boarding_distance,
                    route_b_id, route_b_code, route_b_name, route_b_geom,
                    original_dest_pos, dest_dist, intersection_geom,
                    ST_GeometryN(intersection_geom, gs.n) as intersection_point
                FROM route_pairs
                CROSS JOIN LATERAL generate_series(1, ST_NumGeometries(intersection_geom)) as gs(n)
                WHERE ST_GeometryType(intersection_geom) IN ('ST_MultiPoint', 'ST_GeometryCollection')
            ),
            -- For each valid transfer, find alighting points using Case 5 logic
            -- (treating transfer point as the "start" for route B)
            alighting_points AS (
                SELECT 
                    ai.*,
                    ST_LineLocatePoint(ai.route_a_geom, ai.intersection_point) as transfer_pos_a,
                    ST_LineLocatePoint(ai.route_b_geom, ai.intersection_point) as transfer_pos_b,
                    s.pos as alighting_pos,
                    ST_Distance(
                        ST_LineInterpolatePoint(ai.route_b_geom, s.pos)::geography,
                        ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
                    ) as alighting_distance
                FROM all_intersections ai,
                LATERAL (
                    SELECT generate_series(0.0, 1.0, 0.001) as pos
                ) s
                WHERE 
                    -- Find points within 100m of destination
                    ST_DWithin(
                        ST_LineInterpolatePoint(ai.route_b_geom, s.pos)::geography,
                        ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
                        100
                    )
                    -- Must be after transfer point for forward travel
                    AND s.pos > ST_LineLocatePoint(ai.route_b_geom, ai.intersection_point)
                    -- Boarding must be before transfer on route A
                    AND ai.boarding_pos < ST_LineLocatePoint(ai.route_a_geom, ai.intersection_point)
            ),
            -- Pick best alighting point for each route pair (EARLIEST point within 100m)
            best_combos AS (
                SELECT DISTINCT ON (route_a_id, route_b_id)
                    *,
                    ST_Length(ST_LineSubstring(route_a_geom, boarding_pos, transfer_pos_a)::geography) as route_a_distance,
                    ST_Length(ST_LineSubstring(route_b_geom, transfer_pos_b, alighting_pos)::geography) as route_b_distance
                FROM alighting_points
                ORDER BY route_a_id, route_b_id,
                    -- Pick the EARLIEST alighting point (smallest position value)
                    alighting_pos
            ),
            -- Get best transfers (simplified like Case 5)
            best_transfers AS (
                SELECT *
                FROM best_combos
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
                (route_a_distance + route_b_distance) as total_distance,
                original_dest_pos,
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
            console.log('🚗 Case 8: No valid transfer routes with end opposite found');
            return null;
        }

        console.log(`🚗 Case 8: Found ${results.length} transfer route(s) with end opposite`);
        if (results.length > 0) {
            const topRoute = results[0];
            console.log(`  Best Case 8: ${topRoute.route_a_code} → ${topRoute.route_b_code}`);
            console.log(`    Destination originally at ${(topRoute.original_dest_pos * 100).toFixed(1)}% of ${topRoute.route_b_code}`);
            console.log(`    Found alighting at ${(topRoute.alighting_pos * 100).toFixed(1)}% (${topRoute.alighting_distance.toFixed(0)}m walk)`);
            console.log(`    Total distance: ${(topRoute.total_distance / 1000).toFixed(2)}km`);
        }
        
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
                routeName: `Transfer (End Opposite): ${route.route_a_name} to ${route.route_b_name}`,
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
                endOpposite: true  // Mark this as opposite side end
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
                endOpposite: true,
                routeCount: segments.length
            }
        };
    }
}