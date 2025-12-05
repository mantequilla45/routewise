import { LatLng } from '@/types/GeoTypes';
import { query } from '@/lib/db/db';

export interface RouteSegment {
    routeId: string;
    routeCode: string;
    routeName: string;
    coordinates: LatLng[];
    distance: number;
    fare: number;
    startPosition: number;
    endPosition: number;
    requiresLoop?: boolean;
}

export interface RouteCalculationResult {
    caseName: string;
    segments: RouteSegment[];
    totalDistance: number;
    totalFare: number;
    transferPoints?: LatLng[];
    confidence: number;
    debugInfo?: any;
}

export interface SideDetectionResult {
    routeId: string;
    routeCode: string;
    startPos: number;
    endPos: number;
    startDist: number;
    endDist: number;
    startSide: 'correct' | 'opposite';
    endSide: 'correct' | 'opposite';
}

export abstract class BaseRouteHandler {
    protected FARE_PER_KM = 2.20;
    protected MINIMUM_FARE = 13;

    abstract getCaseName(): string;
    abstract canHandle(from: LatLng, to: LatLng): Promise<boolean>;
    abstract calculate(from: LatLng, to: LatLng): Promise<RouteCalculationResult | null>;

    protected calculateFare(distanceInMeters: number): number {
        const distanceInKm = distanceInMeters / 1000;
        const calculatedFare = distanceInKm * this.FARE_PER_KM;
        return Math.max(this.MINIMUM_FARE, Math.ceil(calculatedFare));
    }

    protected parseGeoJson(geoJson: string): LatLng[] {
        try {
            const parsed = JSON.parse(geoJson);
            if (parsed.type === 'LineString' && parsed.coordinates) {
                return parsed.coordinates.map((coord: number[]) => ({
                    latitude: coord[1],
                    longitude: coord[0]
                }));
            }
            return [];
        } catch (error) {
            console.error('Error parsing GeoJSON:', error);
            return [];
        }
    }

    /**
     * Detects which side of the road each pin is on for all routes
     * For routes that pass the same location multiple times, picks the best pass
     * Returns routes with side detection for both start and end points
     */
    protected async detectSidesForRoutes(from: LatLng, to: LatLng, maxDistance: number = 100): Promise<SideDetectionResult[]> {
        const sideDetectionQuery = `
            WITH route_check AS (
                SELECT 
                    r.id,
                    r.route_code,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as start_pos,
                    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as end_pos,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as start_dist,
                    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography) as end_dist,
                    
                    -- Calculate route direction at start point
                    ST_Azimuth(
                        ST_LineInterpolatePoint(r.geom_forward, LEAST(ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)), 0.99)),
                        ST_LineInterpolatePoint(r.geom_forward, LEAST(ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) + 0.01, 1.0))
                    ) as route_bearing_at_start,
                    
                    -- Calculate bearing from route to each pin
                    ST_Azimuth(
                        ST_LineInterpolatePoint(r.geom_forward, ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326))),
                        ST_SetSRID(ST_MakePoint($1, $2), 4326)
                    ) as start_point_bearing,
                    ST_Azimuth(
                        ST_LineInterpolatePoint(r.geom_forward, ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326))),
                        ST_SetSRID(ST_MakePoint($3, $4), 4326)
                    ) as end_point_bearing
                FROM jeepney_routes r
                WHERE ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $5)
                    AND ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5)
            )
            SELECT 
                id as route_id,
                route_code,
                start_pos,
                end_pos,
                start_dist,
                end_dist,
                -- Determine side for start point
                CASE 
                    WHEN start_dist < 15 THEN 'correct'  -- Very close, definitely correct
                    WHEN start_dist < 30 AND 
                         SIN(start_point_bearing - route_bearing_at_start) > 0 THEN 'correct'  -- Right side
                    WHEN start_dist < 30 AND 
                         SIN(start_point_bearing - route_bearing_at_start) <= 0 THEN 'opposite'  -- Left side
                    ELSE 'opposite'  -- Too far, probably opposite
                END as start_side,
                -- Determine side for end point
                CASE 
                    WHEN end_dist < 15 THEN 'correct'
                    WHEN end_dist < 30 AND 
                         SIN(end_point_bearing - route_bearing_at_start) > 0 THEN 'correct'
                    WHEN end_dist < 30 AND 
                         SIN(end_point_bearing - route_bearing_at_start) <= 0 THEN 'opposite'
                    ELSE 'opposite'
                END as end_side
            FROM route_check;
        `;
        
        const results = await query(sideDetectionQuery, [
            from.longitude, from.latitude,
            to.longitude, to.latitude,
            maxDistance
        ]);
        
        return results.map(r => ({
            routeId: r.route_id,
            routeCode: r.route_code,
            startPos: r.start_pos,
            endPos: r.end_pos,
            startDist: r.start_dist,
            endDist: r.end_dist,
            startSide: r.start_side,
            endSide: r.end_side
        }));
    }

    /**
     * Detects if a route passes near a location multiple times
     * Returns all passes with their positions and distances
     */
    protected async detectMultiplePasses(point: LatLng, routeId: string): Promise<Array<{
        position: number;
        distance: number;
        passNumber: number;
    }>> {
        const query = `
            WITH route_samples AS (
                SELECT 
                    generate_series(0.0, 1.0, 0.01) as position,
                    ST_Distance(
                        ST_LineInterpolatePoint(geom_forward, generate_series(0.0, 1.0, 0.01))::geography,
                        ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography
                    ) as distance
                FROM jeepney_routes
                WHERE id = $1
            ),
            close_points AS (
                SELECT 
                    position,
                    distance,
                    -- Mark when we enter/exit proximity to the point
                    CASE 
                        WHEN distance < 100 AND LAG(distance) OVER (ORDER BY position) >= 100 THEN 1
                        WHEN position = 0 AND distance < 100 THEN 1
                        ELSE 0
                    END as new_pass_marker
                FROM route_samples
            ),
            passes AS (
                SELECT 
                    position,
                    distance,
                    SUM(new_pass_marker) OVER (ORDER BY position) as pass_number
                FROM close_points
                WHERE distance < 100
            )
            SELECT 
                MIN(position) as position,
                MIN(distance) as distance,
                pass_number
            FROM passes
            GROUP BY pass_number
            ORDER BY distance;
        `;
        
        const results = await query(query, [routeId, point.longitude, point.latitude]);
        return results;
    }

    protected async findNearestRoutes(point: LatLng, maxDistance: number = 50) {
        const routesQuery = `
            SELECT 
                r.id,
                r.route_code,
                r.start_point_name,
                r.end_point_name,
                ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as position_on_route,
                ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance_to_route
            FROM jeepney_routes r
            WHERE ST_DWithin(
                r.geom_forward::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                $3
            )
            ORDER BY distance_to_route;
        `;
        
        return await query(routesQuery, [point.longitude, point.latitude, maxDistance]);
    }
}