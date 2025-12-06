import { LatLng } from '@/types/GeoTypes';
import { query } from '@/lib/db/db';
import { BaseRouteHandler, RouteCalculationResult, RouteSegment } from '../BaseHandler';
import { RouteQueryResult } from '../types';

/**
 * Case 1: Normal Handler
 * - Handles ALL routes within 500m of both pins
 * - Uses the direct positions where pins are placed
 * - Works for any distance from the route
 */
export class Case1NormalHandler extends BaseRouteHandler {
    getCaseName(): string {
        return 'CASE_1_NORMAL';
    }

    async canHandle(): Promise<boolean> {
        return true;
    }

    async calculate(from: LatLng, to: LatLng): Promise<RouteCalculationResult | null> {
        console.log('🚗 Case 1 Normal: Finding routes with close starting points...');
        
        // Simple approach - just use the pinned locations
        const routeQuery = `
            WITH routes_analysis AS (
                SELECT 
                    r.id,
                    r.route_code,
                    CONCAT(r.start_point_name, ' - ', r.end_point_name) as route_name,
                    r.geom_forward,
                    -- Get positions on the route
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as start_pos,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as end_pos,
                    -- Get distances
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
                route_name,
                start_pos,
                end_pos,
                start_dist,
                end_dist as walking_distance,
                ST_Length(
                    ST_LineSubstring(geom_forward, start_pos, end_pos)::geography
                ) as route_distance,
                ST_AsGeoJSON(
                    ST_LineSubstring(geom_forward, start_pos, end_pos)
                ) as segment_geojson
            FROM routes_analysis
            WHERE 
                start_pos < end_pos  -- Can travel forward
            ORDER BY route_distance;
        `;

        const results = await query(routeQuery, [
            from.longitude, from.latitude,
            to.longitude, to.latitude
        ]);

        if (results.length === 0) {
            console.log('🚗 Case 1 Normal: No routes found');
            return null;
        }

        console.log(`🚗 Case 1 Normal: Found ${results.length} route(s)`);
        
        // Process all matching routes
        const segments: RouteSegment[] = results.map((route: RouteQueryResult) => {
            const coordinates = this.parseGeoJson(route.segment_geojson);
            const fare = this.calculateFare(route.route_distance);
            
            // Reduced logging
            
            return {
                routeId: route.id,
                routeCode: route.route_code,
                routeName: route.route_name,
                coordinates,
                distance: route.route_distance,
                fare,
                startPosition: route.start_pos,
                endPosition: route.end_pos,
                walkingDistance: route.walking_distance,
                optimized: (route.walking_distance ?? 0) > 20
            };
        });
        
        return {
            caseName: this.getCaseName(),
            segments,
            totalDistance: segments[0]?.distance || 0,
            totalFare: segments[0]?.fare || 13,
            confidence: 0.95,
            debugInfo: {
                routeCount: segments.length
            }
        };
    }
}