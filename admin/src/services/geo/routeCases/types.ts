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
        intersectionPoints?: any[];
    };
}

export interface RouteCaseHandler {
    canHandle(from: LatLng, to: LatLng, routeData: any): Promise<boolean>;
    calculate(from: LatLng, to: LatLng, routeData: any): Promise<RouteCalculationResult | null>;
    getCaseName(): RouteCase;
}