import { LatLng } from '@/types/GeoTypes';
import { RouteCase, RouteCaseHandler, RouteCalculationResult } from '../types';
import { query } from '@/lib/db/db';

/**
 * Handles the simplest case: both start and end are on the correct side of the road
 * and the route travels directly from start to end
 */
export class SameDirectionHandler implements RouteCaseHandler {
    getCaseName(): RouteCase {
        return RouteCase.SINGLE_SAME_DIRECTION;
    }

    async canHandle(from: LatLng, to: LatLng, routeData: any): Promise<boolean> {
        // Check if a single route can handle this directly
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
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 50)
                    AND ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 50)
            )
            SELECT * FROM route_check
            WHERE start_pos < end_pos  -- Direct forward travel
                AND start_dist < 30    -- Close to route
                AND end_dist < 30      -- Close to route
            LIMIT 1;
        `;

        const result = await query(checkQuery, [
            from.longitude, from.latitude,
            to.longitude, to.latitude
        ]);

        return result.length > 0;
    }

    async calculate(from: LatLng, to: LatLng, routeData: any): Promise<RouteCalculationResult | null> {
        const routeQuery = `
            WITH route_segment AS (
                SELECT 
                    r.id,
                    r.route_code,
                    r.route_code,
                    r.start_point_name,
                    r.end_point_name,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as start_pos,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as end_pos,
                    r.geom_forward
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 50)
                    AND ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 50)
            )
            SELECT 
                id,
                route_code,
                CONCAT(start_point_name, ' - ', end_point_name) as route_code,
                start_pos,
                end_pos,
                ST_AsGeoJSON(ST_LineSubstring(geom_forward, start_pos, end_pos)) as segment_geojson,
                ST_Length(ST_LineSubstring(geom_forward, start_pos, end_pos)::geography) as distance_meters
            FROM route_segment
            WHERE start_pos < end_pos  -- Direct forward travel
            ORDER BY distance_meters
            LIMIT 1;
        `;

        const results = await query(routeQuery, [
            from.longitude, from.latitude,
            to.longitude, to.latitude
        ]);

        if (results.length === 0) {
            return null;
        }

        const route = results[0];
        const coordinates = JSON.parse(route.segment_geojson).coordinates.map((coord: number[]) => ({
            latitude: coord[1],
            longitude: coord[0]
        }));

        const FARE_PER_KM = 2.20;
        const MINIMUM_FARE = 13;
        const fare = Math.max(MINIMUM_FARE, Math.ceil((route.distance_meters / 1000) * FARE_PER_KM));

        return {
            case: RouteCase.SINGLE_SAME_DIRECTION,
            segments: [{
                routeId: route.id,
                routeCode: route.route_code,
                routeName: route.route_code,
                coordinates,
                distance: route.distance_meters,
                fare,
                startPosition: route.start_pos,
                endPosition: route.end_pos
            }],
            totalDistance: route.distance_meters,
            totalFare: fare,
            confidence: 1.0,  // High confidence for direct routes
            debugInfo: {
                startSideDetection: 'correct',
                endSideDetection: 'correct'
            }
        };
    }
}