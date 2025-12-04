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

    protected async findNearestRoutes(point: LatLng, maxDistance: number = 50) {
        const routesQuery = `
            SELECT 
                r.id,
                r.route_code,
                r.route_name,
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