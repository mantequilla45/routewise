import { LatLng } from '@/types/GeoTypes';

export enum RouteCase {
    // Single route cases
    SINGLE_SAME_DIRECTION = 'SINGLE_SAME_DIRECTION',        // Both points on correct side
    SINGLE_OPPOSITE_START = 'SINGLE_OPPOSITE_START',        // Start on opposite side
    SINGLE_OPPOSITE_END = 'SINGLE_OPPOSITE_END',            // End on opposite side  
    SINGLE_BOTH_OPPOSITE = 'SINGLE_BOTH_OPPOSITE',          // Both on opposite side
    SINGLE_LOOP_AROUND = 'SINGLE_LOOP_AROUND',              // Requires loop wraparound
    
    // Multi-route cases
    MULTI_DIRECT_TRANSFER = 'MULTI_DIRECT_TRANSFER',        // Simple A->B transfer
    MULTI_OPPOSITE_START = 'MULTI_OPPOSITE_START',          // Start opposite, transfer needed
    MULTI_OPPOSITE_END = 'MULTI_OPPOSITE_END',              // End opposite, transfer needed
    MULTI_COMPLEX_TRANSFER = 'MULTI_COMPLEX_TRANSFER',      // Complex multi-route scenario
}

export interface RouteSegment {
    routeId: string;
    routeCode: string;
    routeName: string;
    coordinates: LatLng[];
    distance: number;
    fare: number;
    startPosition: number;  // Position on route (0-1)
    endPosition: number;    // Position on route (0-1)
    requiresLoop?: boolean; // If route wraps around
}

export interface RouteCalculationResult {
    case: RouteCase;
    segments: RouteSegment[];
    totalDistance: number;
    totalFare: number;
    transferPoints?: LatLng[];
    confidence: number;  // 0-1, how confident we are in this route
    debugInfo?: {
        startSideDetection?: string;
        endSideDetection?: string;
        intersectionPoints?: unknown[];
    };
}

export interface RouteData {
    id: string;
    route_code: string;
    route_name?: string;
    start_pos?: number;
    end_pos?: number;
    start_dist?: number;
    end_dist?: number;
}

export interface RouteCaseHandler {
    canHandle(from: LatLng, to: LatLng, routeData: RouteData): Promise<boolean>;
    calculate(from: LatLng, to: LatLng, routeData: RouteData): Promise<RouteCalculationResult | null>;
    getCaseName(): RouteCase;
}

// Database result types
export interface RouteQueryResult {
    id: string;
    route_code: string;
    route_name: string;
    start_pos: number;
    end_pos: number;
    route_distance: number;
    distance_meters?: number;  // Alternative distance field
    segment_geojson: string;
    walking_distance?: number;
    walking_to_start?: number;
    walking_from_end?: number;
    original_start_pos?: number;
    corrected_start_pos?: number;
    original_end_pos?: number;
    [key: string]: unknown;
}

export interface TransferRouteResult {
    route_a_id: string;
    route_a_code: string;
    route_a_name: string;
    route_b_id: string;
    route_b_code: string;
    route_b_name: string;
    route_a_distance: number;
    route_b_distance: number;
    total_distance: number;
    boarding_pos: number;
    boarding_distance: number;
    transfer_pos_a: number;
    transfer_pos_b: number;
    alighting_pos: number;
    alighting_distance: number;
    segment_a_geojson: string;
    segment_b_geojson: string;
    start_dist?: number;
    original_dest_pos?: number;
    [key: string]: unknown;
}