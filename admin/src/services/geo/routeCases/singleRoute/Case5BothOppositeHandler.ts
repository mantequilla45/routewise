import { LatLng } from '@/types/GeoTypes';
import { query } from '@/lib/db/db';
import { BaseRouteHandler, RouteCalculationResult } from '../BaseHandler';

/**
 * Case 5: Both Opposite
 * - Start: Opposite side of road
 * - End: Opposite side of road  
 * - Solution: Use closest points on route that allow forward travel
 */
export class Case5BothOppositeHandler extends BaseRouteHandler {
    getCaseName(): string {
        return 'CASE_5_BOTH_OPPOSITE';
    }

    async canHandle(from: LatLng, to: LatLng): Promise<boolean> {
        console.log('🔍 Case 5: Checking if Both Opposite can handle this route...');
        
        // Check for routes where at least one pin is far enough (opposite side)
        const checkQuery = `
            SELECT 
                r.id,
                r.route_code,
                ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as start_dist,
                ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography) as end_dist
            FROM jeepney_routes r
            WHERE 
                ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 500)
                AND ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 500)
                -- At least one should be on opposite side (>8m)
                AND (
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) > 8
                    OR ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography) > 8
                )
            LIMIT 1;
        `;
        
        const results = await query(checkQuery, [
            from.longitude, from.latitude,
            to.longitude, to.latitude
        ]);
        
        const canHandle = results.length > 0;
        console.log(`🔍 Case 5: ${canHandle ? '✅ Can handle' : '❌ Cannot handle'}`);
        
        return canHandle;
    }

    async calculate(from: LatLng, to: LatLng): Promise<RouteCalculationResult | null> {
        console.log('🚗 Case 5: Calculating Both Opposite route...');
        
        // Simpler approach: Find all points within range of start/end, pick best forward path
        const routeQuery = `
            WITH route_analysis AS (
                SELECT 
                    r.id,
                    r.route_code,
                    CONCAT(r.start_point_name, ' - ', r.end_point_name) as route_name,
                    r.geom_forward,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as original_start_pos,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as original_end_pos,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as start_dist,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography) as end_dist
                FROM jeepney_routes r
                WHERE 
                    ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 500)
                    AND ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 500)
                    -- At least one should be on opposite side (>8m)
                    AND (
                        ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) > 8
                        OR ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography) > 8
                    )
            ),
            -- Find all possible boarding and alighting points within 100m
            boarding_points AS (
                SELECT 
                    ra.*,
                    s.pos as boarding_pos,
                    ST_Distance(
                        ST_LineInterpolatePoint(ra.geom_forward, s.pos)::geography,
                        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                    ) as boarding_distance
                FROM route_analysis ra,
                LATERAL (
                    SELECT generate_series(0.0, 1.0, 0.001) as pos
                ) s
                WHERE ST_DWithin(
                    ST_LineInterpolatePoint(ra.geom_forward, s.pos)::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                    100
                )
            ),
            alighting_points AS (
                SELECT 
                    bp.*,
                    s.pos as alighting_pos,
                    ST_Distance(
                        ST_LineInterpolatePoint(bp.geom_forward, s.pos)::geography,
                        ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
                    ) as alighting_distance
                FROM boarding_points bp,
                LATERAL (
                    SELECT generate_series(0.0, 1.0, 0.001) as pos
                ) s
                WHERE 
                    ST_DWithin(
                        ST_LineInterpolatePoint(bp.geom_forward, s.pos)::geography,
                        ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
                        100
                    )
                    -- Must be after boarding point for forward travel
                    AND s.pos > bp.boarding_pos
            ),
            -- Pick best combination (shortest route distance)
            best_routes AS (
                SELECT DISTINCT ON (id)
                    id,
                    route_code,
                    route_name,
                    geom_forward,
                    boarding_pos as start_pos,
                    alighting_pos as end_pos,
                    boarding_distance as walking_to_start,
                    alighting_distance as walking_from_end,
                    ST_Length(
                        ST_LineSubstring(geom_forward, boarding_pos, alighting_pos)::geography
                    ) as route_distance
                FROM alighting_points
                ORDER BY id, route_distance  -- Pick shortest path for each route
            )
            SELECT 
                id,
                route_code,
                route_name,
                start_pos,
                end_pos,
                walking_to_start,
                walking_from_end,
                route_distance,
                ST_AsGeoJSON(
                    ST_LineSubstring(
                        geom_forward, 
                        GREATEST(start_pos - 0.005, 0),  -- Extend start by ~50m
                        LEAST(end_pos + 0.005, 1.0)      -- Extend end by ~50m
                    )
                ) as segment_geojson
            FROM best_routes
            ORDER BY route_distance;
        `;

        const results = await query(routeQuery, [
            from.longitude, from.latitude,
            to.longitude, to.latitude
        ]);

        if (results.length === 0) {
            console.log('🚗 Case 5: No valid both opposite routes found');
            return null;
        }

        console.log(`🚗 Case 5: Found ${results.length} both opposite route(s)`);
        
        const segments = results.map((route: any) => {
            const coordinates = this.parseGeoJson(route.segment_geojson);
            const fare = this.calculateFare(route.route_distance);
            
            console.log(`  Route ${route.route_code}: ${(route.route_distance / 1000).toFixed(2)}km, ₱${fare}`);
            console.log(`    📍 Walk ${route.walking_to_start.toFixed(0)}m to boarding point`);
            console.log(`    📍 Walk ${route.walking_from_end.toFixed(0)}m from alighting point`);
            
            return {
                routeId: route.id,
                routeCode: route.route_code,
                routeName: route.route_name,
                coordinates,
                distance: route.route_distance,
                fare,
                startPosition: route.start_pos,
                endPosition: route.end_pos,
                walkingToStart: route.walking_to_start,
                walkingFromEnd: route.walking_from_end,
                optimized: true
            };
        });
        
        return {
            caseName: this.getCaseName(),
            segments,
            totalDistance: segments[0]?.distance || 0,
            totalFare: segments[0]?.fare || 13,
            confidence: 0.75,
            debugInfo: {
                bothOpposite: true,
                routeCount: segments.length
            }
        };
    }
}