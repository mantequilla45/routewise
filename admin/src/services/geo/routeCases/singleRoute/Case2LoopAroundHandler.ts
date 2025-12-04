import { LatLng } from '@/types/GeoTypes';
import { query } from '@/lib/db/db';
import { BaseRouteHandler, RouteCalculationResult } from '../BaseHandler';

/**
 * Case 2: Loop Around
 * - Start: Correct side, position > End position (e.g., 80%)
 * - End: Correct side, position < Start position (e.g., 20%)
 * - Solution: Travel from start → 100% → 0% → end (wraps around)
 */
export class Case2LoopAroundHandler extends BaseRouteHandler {
    getCaseName(): string {
        return 'CASE_2_LOOP_AROUND';
    }

    async canHandle(from: LatLng, to: LatLng): Promise<boolean> {
        console.log('🔍 Case 2: Checking if Loop Around can handle this route...');
        
        // Use the reusable side detection
        const routes = await this.detectSidesForRoutes(from, to);
        
        // Filter for routes where:
        // 1. Both points are on correct side
        // 2. Start position > End position (requires loop)
        const validRoutes = routes.filter(r => 
            r.startSide === 'correct' && 
            r.endSide === 'correct' &&
            r.startPos > r.endPos  // Loop required
        );

        const canHandle = validRoutes.length > 0;
        console.log(`🔍 Case 2: ${canHandle ? '✅ Can handle' : '❌ Cannot handle'}`);
        
        if (canHandle && validRoutes[0]) {
            const r = validRoutes[0];
            console.log(`  Route: ${r.routeCode}, Start: ${(r.startPos * 100).toFixed(1)}%, End: ${(r.endPos * 100).toFixed(1)}% (loop required)`);
            console.log(`  Start: ${r.startDist.toFixed(1)}m away (${r.startSide} side)`);
            console.log(`  End: ${r.endDist.toFixed(1)}m away (${r.endSide} side)`);
        }
        
        return canHandle;
    }

    async calculate(from: LatLng, to: LatLng): Promise<RouteCalculationResult | null> {
        console.log('🚗 Case 2: Calculating Loop Around route...');
        
        // Get routes with side detection
        const routes = await this.detectSidesForRoutes(from, to);
        
        // Filter for valid loop routes
        const validRoutes = routes.filter(r => 
            r.startSide === 'correct' && 
            r.endSide === 'correct' &&
            r.startPos > r.endPos
        );

        if (validRoutes.length === 0) {
            console.log('🚗 Case 2: No valid loop routes found');
            return null;
        }

        // Query to get the actual route segments with loop
        const routeQuery = `
            WITH valid_routes AS (
                SELECT * FROM (VALUES
                    ${validRoutes.map((_, i) => `($${i*6+1}::text, $${i*6+2}::float, $${i*6+3}::float, $${i*6+4}::float, $${i*6+5}::float, $${i*6+6}::text)`).join(', ')}
                ) AS t(route_id, start_pos, end_pos, start_dist, end_dist, route_code)
            )
            SELECT 
                r.id,
                r.route_code,
                CONCAT(r.start_point_name, ' - ', r.end_point_name) as route_name,
                vr.start_pos,
                vr.end_pos,
                vr.start_dist,
                vr.end_dist,
                -- Combine two segments: start->end of route + beginning->destination
                ST_AsGeoJSON(
                    ST_Union(
                        ST_LineSubstring(r.geom_forward, vr.start_pos, 1.0),  -- From start to end of route
                        ST_LineSubstring(r.geom_forward, 0.0, vr.end_pos)     -- From beginning to destination
                    )
                ) as segment_geojson,
                -- Calculate total distance for the loop
                ST_Length(ST_LineSubstring(r.geom_forward, vr.start_pos, 1.0)::geography) +
                ST_Length(ST_LineSubstring(r.geom_forward, 0.0, vr.end_pos)::geography) as distance_meters
            FROM jeepney_routes r
            INNER JOIN valid_routes vr ON r.id = vr.route_id
            ORDER BY distance_meters;
        `;

        // Flatten parameters for the query
        const params: any[] = [];
        validRoutes.forEach(r => {
            params.push(r.routeId, r.startPos, r.endPos, r.startDist, r.endDist, r.routeCode);
        });

        const results = await query(routeQuery, params);

        if (results.length === 0) {
            return null;
        }

        console.log(`🚗 Case 2: Found ${results.length} loop route(s)`);
        
        // Process all matching routes
        const segments = results.map(route => {
            const coordinates = this.parseGeoJson(route.segment_geojson);
            const fare = this.calculateFare(route.distance_meters);
            
            console.log(`  Route ${route.route_code}: ${(route.distance_meters / 1000).toFixed(2)}km, ₱${fare}`);
            console.log(`    Loop: ${(route.start_pos * 100).toFixed(1)}% → 100% → 0% → ${(route.end_pos * 100).toFixed(1)}%`);
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
                requiresLoop: true
            };
        });

        // Use the first route for overall stats
        const firstRoute = results[0];
        
        return {
            caseName: this.getCaseName(),
            segments,
            totalDistance: firstRoute.distance_meters,
            totalFare: this.calculateFare(firstRoute.distance_meters),
            confidence: 0.95,  // Slightly lower confidence for loop routes
            debugInfo: {
                loopRequired: true,
                startDistance: firstRoute.start_dist,
                endDistance: firstRoute.end_dist,
                startPosition: firstRoute.start_pos,
                endPosition: firstRoute.end_pos,
                routeCount: results.length
            }
        };
    }
}