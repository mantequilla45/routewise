import { LatLng } from '@/types/GeoTypes';
import { query } from '@/lib/db/db';
import { BaseRouteHandler, RouteCalculationResult } from '../BaseHandler';

/**
 * Case 1: Normal Forward Travel
 * - Start: Correct side of road
 * - End: Correct side of road
 * - Direction: Start position < End position (forward travel)
 */
export class NormalForwardHandler extends BaseRouteHandler {
    getCaseName(): string {
        return 'CASE_1_NORMAL_FORWARD';
    }

    async canHandle(from: LatLng, to: LatLng): Promise<boolean> {
        console.log('🔍 Case 1: Checking if Normal Forward can handle this route...');

        // Check if there's a single route where:
        // 1. Both points are on the CORRECT SIDE (using distance + geometry)
        // 2. Start position < End position (forward travel)
        const checkQuery = `
            WITH route_check AS (
                SELECT 
                    r.id,
                    r.route_code,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as start_pos,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as end_pos,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as start_dist,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography) as end_dist,
                    
                    -- Calculate which side of the road each point is on
                    -- Get a point slightly ahead on the route to determine direction
                    ST_Azimuth(
                        ST_LineInterpolatePoint(r.geom_forward, LEAST(ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)), 0.99)),
                        ST_LineInterpolatePoint(r.geom_forward, LEAST(ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) + 0.01, 1.0))
                    ) as route_bearing_at_start,
                    ST_Azimuth(
                        ST_LineInterpolatePoint(r.geom_forward, ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326))),
                        ST_SetSRID(ST_MakePoint($1, $2), 4326)
                    ) as start_point_bearing,
                    ST_Azimuth(
                        ST_LineInterpolatePoint(r.geom_forward, ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326))),
                        ST_SetSRID(ST_MakePoint($3, $4), 4326)
                    ) as end_point_bearing
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 100)
                    AND ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 100)
            ),
            side_detection AS (
                SELECT *,
                    -- Determine if start point is on right side (correct for right-hand traffic)
                    CASE 
                        WHEN start_dist < 15 THEN 'correct'  -- Very close, definitely correct
                        WHEN start_dist < 30 AND 
                             SIN(start_point_bearing - route_bearing_at_start) > 0 THEN 'correct'  -- Right side
                        WHEN start_dist < 30 AND 
                             SIN(start_point_bearing - route_bearing_at_start) <= 0 THEN 'opposite'  -- Left side
                        ELSE 'opposite'  -- Too far, probably opposite
                    END as start_side,
                    -- Same for end point
                    CASE 
                        WHEN end_dist < 15 THEN 'correct'
                        WHEN end_dist < 30 AND 
                             SIN(end_point_bearing - route_bearing_at_start) > 0 THEN 'correct'
                        WHEN end_dist < 30 AND 
                             SIN(end_point_bearing - route_bearing_at_start) <= 0 THEN 'opposite'
                        ELSE 'opposite'
                    END as end_side
                FROM route_check
            )
            SELECT * FROM side_detection
            WHERE start_pos < end_pos  -- Forward travel
                AND start_side = 'correct'  -- Start on correct side
                AND end_side = 'correct'    -- End on correct side
            LIMIT 1;
        `;

        const result = await query(checkQuery, [
            from.longitude, from.latitude,
            to.longitude, to.latitude
        ]);

        const canHandle = result.length > 0;
        console.log(`🔍 Case 1: ${canHandle ? '✅ Can handle' : '❌ Cannot handle'}`);

        if (result.length > 0 && result[0]) {
            const r = result[0];
            console.log(`  Route: ${r.route_code}, Start: ${(r.start_pos * 100).toFixed(1)}%, End: ${(r.end_pos * 100).toFixed(1)}%`);
            console.log(`  Start: ${r.start_dist.toFixed(1)}m away (${r.start_side} side)`);
            console.log(`  End: ${r.end_dist.toFixed(1)}m away (${r.end_side} side)`);
        }

        return canHandle;
    }

    async calculate(from: LatLng, to: LatLng): Promise<RouteCalculationResult | null> {
        console.log('🚗 Case 1: Calculating Normal Forward route...');

        const routeQuery = `
            WITH route_segment AS (
                SELECT 
                    r.id,
                    r.route_code,
                    r.start_point_name,
                    r.end_point_name,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as start_pos,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as end_pos,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as start_dist,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography) as end_dist,
                    r.geom_forward
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 100)
                    AND ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 100)
            )
            SELECT 
                id,
                route_code,
                CONCAT(start_point_name, ' - ', end_point_name) as route_name,
                start_pos,
                end_pos,
                start_dist,
                end_dist,
                ST_AsGeoJSON(ST_LineSubstring(geom_forward, start_pos, end_pos)) as segment_geojson,
                ST_Length(ST_LineSubstring(geom_forward, start_pos, end_pos)::geography) as distance_meters
            FROM route_segment
            WHERE start_pos < end_pos  -- Forward travel only
                AND start_dist < 50     -- Start is on correct side
                AND end_dist < 50       -- End is on correct side
            ORDER BY distance_meters;
        `;

        const results = await query(routeQuery, [
            from.longitude, from.latitude,
            to.longitude, to.latitude
        ]);

        if (results.length === 0) {
            console.log('🚗 Case 1: No valid route found');
            return null;
        }

        console.log(`🚗 Case 1: Found ${results.length} route(s)`);

        // Process all matching routes
        const segments = results.map(route => {
            const coordinates = this.parseGeoJson(route.segment_geojson);
            const fare = this.calculateFare(route.distance_meters);

            console.log(`  Route ${route.route_code}: ${(route.distance_meters / 1000).toFixed(2)}km, ₱${fare}`);
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
                requiresLoop: false
            };
        });

        // Use the first route for overall stats
        const firstRoute = results[0];

        return {
            caseName: this.getCaseName(),
            segments,
            totalDistance: firstRoute.distance_meters,
            totalFare: this.calculateFare(firstRoute.distance_meters),
            confidence: 1.0,  // High confidence for simple forward routes
            debugInfo: {
                startDistance: firstRoute.start_dist,
                endDistance: firstRoute.end_dist,
                startPosition: firstRoute.start_pos,
                endPosition: firstRoute.end_pos,
                routeCount: results.length
            }
        };
    }
}