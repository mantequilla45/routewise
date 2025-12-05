import { LatLng } from '@/types/GeoTypes';
import { query } from '@/lib/db/db';
import { BaseRouteHandler, RouteCalculationResult, RouteSegment } from '../BaseHandler';
import { RouteQueryResult } from '../types';

/**
 * Case 3: Opposite Start
 * - Start: Opposite side of road (>20m away)
 * - End: Correct side (<20m away)
 * - Solution: Find nearest correct boarding point from start, then travel forward to end
 * 
 * Example: User is on wrong side of divided highway, needs to cross to catch jeepney
 */
export class Case3OppositeStartHandler extends BaseRouteHandler {
    getCaseName(): string {
        return 'CASE_3_OPPOSITE_START';
    }

    async canHandle(from: LatLng, to: LatLng): Promise<boolean> {
        console.log('🔍 Case 3: Checking if Opposite Start can handle this route...');
        
        // Check for routes where start is far enough to be considered opposite side
        // Find ALL routes that pass near both points
        const checkQuery = `
            WITH route_check AS (
                SELECT 
                    r.id,
                    r.route_code,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as start_pos,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as end_pos,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as start_dist,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography) as end_dist
                FROM jeepney_routes r
                WHERE 
                    -- Search within 500m for both points
                    ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 500)
                    AND ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 500)
            )
            SELECT 
                id,
                route_code,
                start_pos,
                end_pos,
                start_dist,
                end_dist
            FROM route_check
            WHERE 
                -- Start is far enough to be opposite side (>20m)
                start_dist > 20
                -- End can be any distance
            ORDER BY start_dist;
        `;
        
        const results = await query(checkQuery, [
            from.longitude, from.latitude,
            to.longitude, to.latitude
        ]);
        
        const validRoutes = results.filter(r => {
            console.log(`  Route ${r.route_code}: Start ${r.start_dist.toFixed(1)}m (opposite), End ${r.end_dist.toFixed(1)}m (correct)`);
            console.log(`    Start pos: ${(r.start_pos * 100).toFixed(1)}%, End pos: ${(r.end_pos * 100).toFixed(1)}%`);
            return true;
        });

        const canHandle = validRoutes.length > 0;
        console.log(`🔍 Case 3: ${canHandle ? '✅ Can handle' : '❌ Cannot handle'}`);
        
        if (canHandle && validRoutes[0]) {
            const r = validRoutes[0];
            console.log(`  Will find nearest boarding point for route ${r.route_code}`);
        }
        
        return canHandle;
    }

    async calculate(from: LatLng, to: LatLng): Promise<RouteCalculationResult | null> {
        console.log('🚗 Case 3: Calculating Opposite Start route...');
        
        // Query to find alternative boarding points for routes with opposite start
        const routeQuery = `
            WITH route_analysis AS (
                SELECT 
                    r.id,
                    r.route_code,
                    CONCAT(r.start_point_name, ' - ', r.end_point_name) as route_name,
                    r.geom_forward,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as original_start_pos,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as end_pos,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as start_dist,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography) as end_dist
                FROM jeepney_routes r
                WHERE 
                    ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 500)
                    AND ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 500)
                    -- Start must be far (opposite side)
                    AND ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) > 20
            ),
            -- Find alternative boarding points within 200m
            alternative_boarding AS (
                SELECT 
                    ra.*,
                    -- Search for a point within 200m that allows forward travel
                    (SELECT s.position
                     FROM generate_series(0.0, 1.0, 0.001) s(position)
                     WHERE 
                        -- Point must be within 200m of start
                        ST_DWithin(
                            ST_LineInterpolatePoint(ra.geom_forward, s.position)::geography,
                            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                            200
                        )
                        -- Must be before the end point (forward travel)
                        AND s.position < ra.end_pos
                        -- Not the same as original position
                        AND ABS(s.position - ra.original_start_pos) > 0.01
                     ORDER BY 
                        ST_Distance(
                            ST_LineInterpolatePoint(ra.geom_forward, s.position)::geography,
                            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                        )
                     LIMIT 1
                    ) as alt_start_pos
                FROM route_analysis ra
            ),
            -- Use the found alternative start and original end position
            destination_points AS (
                SELECT 
                    ab.*,
                    -- Use alternative start if found, otherwise skip
                    COALESCE(ab.alt_start_pos, 
                        -- Fallback: if no alternative found but original works, use it
                        CASE WHEN ab.original_start_pos < ab.end_pos THEN ab.original_start_pos ELSE NULL END
                    ) as final_start_pos,
                    -- Just use the original end position where user pinned
                    ab.end_pos as final_end_pos
                FROM alternative_boarding ab
            )
            SELECT 
                id,
                route_code,
                route_name,
                final_start_pos as corrected_start_pos,
                final_end_pos as end_pos,
                start_dist,
                end_dist,
                original_start_pos,
                -- Calculate walking distance to boarding point
                ST_Distance(
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                    ST_LineInterpolatePoint(geom_forward, final_start_pos)::geography
                ) as walking_distance,
                ST_AsGeoJSON(
                    ST_LineSubstring(
                        geom_forward,
                        final_start_pos,
                        final_end_pos
                    )
                ) as segment_geojson,
                ST_Length(
                    ST_LineSubstring(
                        geom_forward,
                        final_start_pos,
                        final_end_pos
                    )::geography
                ) as distance_meters
            FROM destination_points
            WHERE 
                final_start_pos IS NOT NULL 
                AND final_end_pos IS NOT NULL
                AND final_start_pos < final_end_pos
            ORDER BY distance_meters;
        `;

        const results = await query(routeQuery, [
            from.longitude, from.latitude,
            to.longitude, to.latitude
        ]);

        if (results.length === 0) {
            console.log('🚗 Case 3: No valid opposite start routes found');
            return null;
        }

        console.log(`🚗 Case 3: Found ${results.length} opposite start route(s)`);
        
        // Process all matching routes
        const segments: RouteSegment[] = results.map((route: RouteQueryResult) => {
            const coordinates = this.parseGeoJson(route.segment_geojson);
            const distance = route.distance_meters || route.route_distance || 0;
            const fare = this.calculateFare(distance);
            
            console.log(`  Route ${route.route_code}: ${(distance / 1000).toFixed(2)}km, ₱${fare}`);
            console.log(`    Start correction: Walk ${(route.walking_distance ?? 0).toFixed(0)}m to correct side`);
            console.log(`    Original position: ${((route.original_start_pos ?? 0) * 100).toFixed(1)}%, Corrected: ${((route.corrected_start_pos ?? route.start_pos) * 100).toFixed(1)}%`);
            console.log(`    Travel: ${((route.corrected_start_pos ?? route.start_pos) * 100).toFixed(1)}% → ${(route.end_pos * 100).toFixed(1)}%`);
            console.log(`    Coordinates: ${coordinates.length} points`);
            
            return {
                routeId: route.id,
                routeCode: route.route_code,
                routeName: route.route_name,
                coordinates,
                distance: distance,
                fare,
                startPosition: route.corrected_start_pos,
                endPosition: route.end_pos,
                walkingDistance: route.walking_distance
            };
        });

        // Use the first route for overall stats
        const firstRoute = results[0];
        
        return {
            caseName: this.getCaseName(),
            segments,
            totalDistance: firstRoute?.distance_meters || firstRoute?.route_distance || 0,
            totalFare: this.calculateFare(firstRoute?.distance_meters || firstRoute?.route_distance || 0),
            confidence: 0.85,  // Lower confidence due to start correction
            debugInfo: {
                startCorrected: true,
                walkingDistance: firstRoute.walking_distance,
                originalStartPosition: firstRoute.original_start_pos,
                correctedStartPosition: firstRoute.corrected_start_pos,
                startDistance: firstRoute.start_dist,
                endDistance: firstRoute.end_dist,
                routeCount: results.length
            }
        };
    }
}