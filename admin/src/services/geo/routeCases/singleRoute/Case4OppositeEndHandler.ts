import { LatLng } from '@/types/GeoTypes';
import { query } from '@/lib/db/db';
import { BaseRouteHandler, RouteCalculationResult } from '../BaseHandler';

/**
 * Case 4: Opposite End
 * - Start: Correct side (<20m away)
 * - End: Opposite side (>20m away)
 * - Solution: Travel to nearest point on route near destination
 * 
 * Example: Destination is on opposite side, passenger gets off at nearest point
 */
export class Case4OppositeEndHandler extends BaseRouteHandler {
    getCaseName(): string {
        return 'CASE_4_OPPOSITE_END';
    }

    async canHandle(from: LatLng, to: LatLng): Promise<boolean> {
        console.log('🔍 Case 4: Checking if Opposite End can handle this route...');
        
        // Check for routes where start is close (correct side) but end is far (opposite side)
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
                -- Start is close (correct side)
                start_dist < 20
                -- End is far (opposite side)
                AND end_dist > 20
                -- Can travel forward
                AND start_pos < end_pos
            ORDER BY start_dist + end_dist
            LIMIT 1;
        `;
        
        const results = await query(checkQuery, [
            from.longitude, from.latitude,
            to.longitude, to.latitude
        ]);
        
        const canHandle = results.length > 0;
        console.log(`🔍 Case 4: ${canHandle ? '✅ Can handle' : '❌ Cannot handle'}`);
        
        if (canHandle && results[0]) {
            const r = results[0];
            console.log(`  Route ${r.route_code}: Start ${r.start_dist.toFixed(1)}m (correct), End ${r.end_dist.toFixed(1)}m (opposite)`);
            console.log(`    Start pos: ${(r.start_pos * 100).toFixed(1)}%, End pos: ${(r.end_pos * 100).toFixed(1)}%`);
        }
        
        return canHandle;
    }

    async calculate(from: LatLng, to: LatLng): Promise<RouteCalculationResult | null> {
        console.log('🚗 Case 4: Calculating Opposite End route...');
        
        // Query to find routes and calculate to nearest alighting point
        const routeQuery = `
            WITH route_analysis AS (
                SELECT 
                    r.id,
                    r.route_code,
                    CONCAT(r.start_point_name, ' - ', r.end_point_name) as route_name,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as start_pos,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as original_end_pos,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as start_dist,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography) as end_dist,
                    r.geom_forward,
                    -- Find the nearest point on the route to the destination
                    ST_ClosestPoint(
                        r.geom_forward,
                        ST_SetSRID(ST_MakePoint($3, $4), 4326)
                    ) as alighting_point
                FROM jeepney_routes r
                WHERE 
                    ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 500)
                    AND ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 500)
                    -- Start must be close (correct side)
                    AND ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) < 20
                    -- End must be far (opposite side)
                    AND ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography) > 20
            ),
            -- Try different search radii to find alternative alighting points
            alighting_options AS (
                SELECT 
                    ra.id,
                    ra.route_code,
                    ra.route_name,
                    ra.start_pos,
                    ra.original_end_pos,
                    ra.start_dist,
                    ra.end_dist,
                    ra.geom_forward,
                    ra.alighting_point,
                    -- Get the position of the alighting point
                    ST_LineLocatePoint(ra.geom_forward, ra.alighting_point) as corrected_end_pos,
                    -- Calculate walking distance from alighting point to destination
                    ST_Distance(
                        ra.alighting_point::geography,
                        ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
                    ) as walking_distance
                FROM route_analysis ra
            )
            SELECT 
                id,
                route_code,
                route_name,
                start_pos,
                corrected_end_pos as end_pos,
                original_end_pos,
                start_dist,
                end_dist,
                walking_distance,
                -- Get the route segment
                ST_AsGeoJSON(
                    ST_LineSubstring(
                        geom_forward,
                        start_pos,
                        corrected_end_pos
                    )
                ) as segment_geojson,
                -- Calculate jeepney distance
                ST_Length(
                    ST_LineSubstring(
                        geom_forward,
                        start_pos,
                        corrected_end_pos
                    )::geography
                ) as distance_meters
            FROM alighting_options
            WHERE 
                -- Make sure we can travel forward
                start_pos < corrected_end_pos
            ORDER BY distance_meters;
        `;

        const results = await query(routeQuery, [
            from.longitude, from.latitude,
            to.longitude, to.latitude
        ]);

        if (results.length === 0) {
            console.log('🚗 Case 4: No valid opposite end routes found');
            return null;
        }

        console.log(`🚗 Case 4: Found ${results.length} opposite end route(s)`);
        
        // Process all matching routes
        const segments = results.map(route => {
            const coordinates = this.parseGeoJson(route.segment_geojson);
            const fare = this.calculateFare(route.distance_meters);
            
            console.log(`  Route ${route.route_code}: ${(route.distance_meters / 1000).toFixed(2)}km, ₱${fare}`);
            console.log(`    End correction: Walk ${route.walking_distance.toFixed(0)}m from alighting point`);
            console.log(`    Travel: ${(route.start_pos * 100).toFixed(1)}% → ${(route.end_pos * 100).toFixed(1)}%`);
            console.log(`    Original end would have been: ${(route.original_end_pos * 100).toFixed(1)}%`);
            console.log(`    Coordinates: ${coordinates.length} points`);
            
            return {
                routeId: route.id,
                routeCode: route.route_code,
                routeName: route.route_name,
                coordinates,
                distance: route.distance_meters,
                fare,
                startPosition: route.start_pos,
                endPosition: route.end_pos,
                walkingDistance: route.walking_distance
            };
        });

        // Use the first route for overall stats
        const firstRoute = results[0];
        
        return {
            caseName: this.getCaseName(),
            segments,
            totalDistance: firstRoute.distance_meters,
            totalFare: this.calculateFare(firstRoute.distance_meters),
            confidence: 0.9,  // Slightly lower confidence due to end correction
            debugInfo: {
                endCorrected: true,
                walkingDistance: firstRoute.walking_distance,
                originalEndPosition: firstRoute.original_end_pos,
                correctedEndPosition: firstRoute.end_pos,
                startDistance: firstRoute.start_dist,
                endDistance: firstRoute.end_dist,
                routeCount: results.length
            }
        };
    }
}