import { query } from "@/lib/db/db";
import { LatLng, RouteSnap, CalculatedRoutes } from "@/types/GeoTypes";

interface RouteSegmentInfo {
    routeId: string;
    routeCode: string;
    forwardDistance: number;
    reverseDistance: number;
    directDistance: number;
    shouldCrossRoad: boolean;
    segmentGeoJSON: string;
    direction: 'forward' | 'reverse';
}

/**
 * Calculate the straight-line distance between two points in meters
 */
function calculateDirectDistance(pointA: LatLng, pointB: LatLng): number {
    const R = 6371000; // Earth's radius in meters
    const lat1 = pointA.latitude * Math.PI / 180;
    const lat2 = pointB.latitude * Math.PI / 180;
    const deltaLat = (pointB.latitude - pointA.latitude) * Math.PI / 180;
    const deltaLon = (pointB.longitude - pointA.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Check if both points are on the same route and determine the best direction
 * This handles both loop routes and linear routes properly
 */
export async function analyzeBidirectionalRoute(
    routeA: RouteSnap,
    routeB: RouteSnap
): Promise<RouteSegmentInfo | null> {
    if (routeA.id !== routeB.id) {
        return null; // Different routes
    }

    const sql = `
        WITH route_analysis AS (
            SELECT
                id,
                route_code,
                
                -- Forward direction calculation
                ST_LineLocatePoint(geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as loc_a_forward,
                ST_LineLocatePoint(geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as loc_b_forward,
                
                -- Get the actual geometry
                geom_forward
                
            FROM jeepney_routes
            WHERE id = $5
        ),
        distance_calc AS (
            SELECT
                *,
                -- Forward route distance (only if A comes before B)
                CASE
                    WHEN loc_a_forward < loc_b_forward THEN
                        ST_Length(
                            ST_LineSubstring(geom_forward, loc_a_forward, loc_b_forward)::geography
                        )
                    ELSE NULL
                END as forward_segment_distance,
                
                -- Get the segment geometry for forward direction (A to B)
                CASE
                    WHEN loc_a_forward < loc_b_forward THEN
                        ST_AsGeoJSON(ST_LineSubstring(geom_forward, loc_a_forward, loc_b_forward))
                    ELSE NULL
                END as forward_segment_geojson
                
            FROM route_analysis
        )
        SELECT
            id,
            route_code,
            forward_segment_distance,
            forward_segment_geojson,
            loc_a_forward,
            loc_b_forward
        FROM distance_calc;
    `;

    try {
        const params = [
            routeA.snapped_forward_lon,
            routeA.snapped_forward_lat,
            routeB.snapped_forward_lon,
            routeB.snapped_forward_lat,
            routeA.id
        ];

        const [result] = await query(sql, params);
        
        if (!result) return null;

        // Calculate direct distance between the two points
        const directDistance = calculateDirectDistance(
            { latitude: routeA.snapped_forward_lat, longitude: routeA.snapped_forward_lon },
            { latitude: routeB.snapped_forward_lat, longitude: routeB.snapped_forward_lon }
        );

        // Only process if the route goes in the correct direction
        if (!result.forward_segment_distance || !result.forward_segment_geojson) {
            return null;
        }

        const forwardDistance = result.forward_segment_distance;

        // Remove cross-road detection - just return the route
        return {
            routeId: result.id,
            routeCode: result.route_code,
            forwardDistance,
            reverseDistance: 0, // Not used anymore
            directDistance,
            shouldCrossRoad: false, // Never suggest crossing
            segmentGeoJSON: result.forward_segment_geojson,
            direction: 'forward' as 'forward' | 'reverse'
        };

    } catch (err) {
        console.error("Error analyzing bidirectional route:", err);
        return null;
    }
}

/**
 * Enhanced route calculation that handles bidirectional routes properly
 */
export async function calculateSmartRoute(
    snappedRoutesA: RouteSnap[],
    snappedRoutesB: RouteSnap[],
    skippedRoutes?: string[]
): Promise<CalculatedRoutes[]> {
    const results: CalculatedRoutes[] = [];
    
    // Group routes by ID to find matching pairs
    const routeBMap = new Map(snappedRoutesB.map(r => [r.id, r]));
    
    for (const routeA of snappedRoutesA) {
        const routeB = routeBMap.get(routeA.id);
        if (!routeB) continue; // No matching route at destination
        
        // Analyze if this is a bidirectional route situation
        const analysis = await analyzeBidirectionalRoute(routeA, routeB);
        
        if (!analysis) {
            // Route goes in wrong direction
            if (skippedRoutes && !skippedRoutes.includes(routeA.route_code)) {
                skippedRoutes.push(routeA.route_code);
            }
        } else {
            // Use the forward direction (only valid direction now)
            results.push({
                routeId: analysis.routeCode,
                distanceMeters: analysis.forwardDistance,
                segmentGeoJSON: analysis.segmentGeoJSON
            });
        }
    }
    
    return results;
}