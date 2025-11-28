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
                horizontal_or_vertical_road,
                
                -- Forward direction calculation
                ST_LineLocatePoint(geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as loc_a_forward,
                ST_LineLocatePoint(geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as loc_b_forward,
                
                -- Reverse direction calculation
                ST_LineLocatePoint(geom_reverse, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as loc_a_reverse,
                ST_LineLocatePoint(geom_reverse, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as loc_b_reverse,
                
                -- Get the actual geometries
                geom_forward,
                geom_reverse
                
            FROM new_jeepney_routes
            WHERE id = $5
        ),
        distance_calc AS (
            SELECT
                *,
                -- Forward route distance (always go from A to B along the line)
                ST_Length(
                    ST_LineSubstring(
                        geom_forward, 
                        LEAST(loc_a_forward, loc_b_forward), 
                        GREATEST(loc_a_forward, loc_b_forward)
                    )::geography
                ) as forward_segment_distance,
                
                -- Reverse route distance (always go from A to B along the line)
                ST_Length(
                    ST_LineSubstring(
                        geom_reverse, 
                        LEAST(loc_a_reverse, loc_b_reverse), 
                        GREATEST(loc_a_reverse, loc_b_reverse)
                    )::geography
                ) as reverse_segment_distance,
                
                -- Get the segment geometries for both directions (A to B)
                ST_AsGeoJSON(
                    CASE
                        WHEN loc_a_forward <= loc_b_forward THEN
                            ST_LineSubstring(geom_forward, loc_a_forward, loc_b_forward)
                        ELSE
                            ST_Reverse(ST_LineSubstring(geom_forward, loc_b_forward, loc_a_forward))
                    END
                ) as forward_segment_geojson,
                
                ST_AsGeoJSON(
                    CASE
                        WHEN loc_a_reverse <= loc_b_reverse THEN
                            ST_LineSubstring(geom_reverse, loc_a_reverse, loc_b_reverse)
                        ELSE
                            ST_Reverse(ST_LineSubstring(geom_reverse, loc_b_reverse, loc_a_reverse))
                    END
                ) as reverse_segment_geojson
                
            FROM route_analysis
        )
        SELECT
            id,
            route_code,
            forward_segment_distance,
            reverse_segment_distance,
            forward_segment_geojson,
            reverse_segment_geojson,
            horizontal_or_vertical_road
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

        const forwardDistance = result.forward_segment_distance;
        const reverseDistance = result.reverse_segment_distance;

        // Determine if we should suggest crossing the road
        // If one direction is significantly longer than the direct distance and the other
        const CROSSING_THRESHOLD = 3; // If route is 3x longer than direct distance
        const MIN_DETOUR_DISTANCE = 500; // Minimum 500m detour to suggest crossing

        let shouldCrossRoad = false;
        let bestDirection: 'forward' | 'reverse' = 'forward';
        let bestDistance = forwardDistance;
        let bestGeoJSON = result.forward_segment_geojson;

        // Choose the shorter route
        if (forwardDistance <= reverseDistance) {
            bestDirection = 'forward';
            bestDistance = forwardDistance;
            bestGeoJSON = result.forward_segment_geojson;
        } else {
            bestDirection = 'reverse';
            bestDistance = reverseDistance;
            bestGeoJSON = result.reverse_segment_geojson;
        }

        // Check if the best route is still unreasonably long
        if (bestDistance > directDistance * CROSSING_THRESHOLD && 
            bestDistance > MIN_DETOUR_DISTANCE) {
            // The route requires a long detour, suggest crossing the road
            shouldCrossRoad = true;
        }

        return {
            routeId: result.id,
            routeCode: result.route_code,
            forwardDistance,
            reverseDistance,
            directDistance,
            shouldCrossRoad,
            segmentGeoJSON: bestGeoJSON,
            direction: bestDirection
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
    snappedRoutesB: RouteSnap[]
): Promise<CalculatedRoutes[]> {
    const results: CalculatedRoutes[] = [];
    
    // Group routes by ID to find matching pairs
    const routeBMap = new Map(snappedRoutesB.map(r => [r.id, r]));
    
    for (const routeA of snappedRoutesA) {
        const routeB = routeBMap.get(routeA.id);
        if (!routeB) continue; // No matching route at destination
        
        // Analyze if this is a bidirectional route situation
        const analysis = await analyzeBidirectionalRoute(routeA, routeB);
        
        if (analysis) {
            if (analysis.shouldCrossRoad) {
                // Add a special marker to indicate road crossing is needed
                results.push({
                    routeId: `${analysis.routeCode}_CROSS`,
                    distanceMeters: analysis.directDistance,
                    segmentGeoJSON: JSON.stringify({
                        type: "LineString",
                        coordinates: [
                            [routeA.snapped_forward_lon, routeA.snapped_forward_lat],
                            [routeB.snapped_forward_lon, routeB.snapped_forward_lat]
                        ],
                        properties: {
                            shouldCrossRoad: true,
                            message: "Cross to the other side of the road for a shorter route"
                        }
                    })
                });
            } else {
                // Use the optimal direction
                results.push({
                    routeId: analysis.routeCode,
                    distanceMeters: analysis.direction === 'forward' 
                        ? analysis.forwardDistance 
                        : analysis.reverseDistance,
                    segmentGeoJSON: analysis.segmentGeoJSON
                });
            }
        }
    }
    
    return results;
}