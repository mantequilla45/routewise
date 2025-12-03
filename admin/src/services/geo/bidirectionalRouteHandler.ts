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
        WITH route_info AS (
            SELECT
                id,
                route_code,
                geom_forward,
                ST_LineLocatePoint(geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as loc_a,
                ST_LineLocatePoint(geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as loc_b,
                -- Check if route is closed (first point equals last point)
                ST_Equals(ST_StartPoint(geom_forward), ST_EndPoint(geom_forward)) as is_closed_loop
            FROM jeepney_routes
            WHERE id = $5
        ),
        -- Find alternative points within 50 meters for opposite side of road
        close_points AS (
            SELECT 
                generate_series(0.0, 1.0, 0.001) as position
            FROM route_info
        ),
        alternative_starts AS (
            -- Find a point on the route that's close to the start but comes AFTER it in the direction of travel
            -- This handles the "opposite side of road" case where user pins the wrong side
            SELECT 
                cp.position as alt_loc,
                ST_Distance(
                    ST_LineInterpolatePoint(ri.geom_forward, cp.position)::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                ) as distance_to_a
            FROM close_points cp, route_info ri
            WHERE ST_Distance(
                ST_LineInterpolatePoint(ri.geom_forward, cp.position)::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            ) < 50  -- Within 50 meters of starting point
            AND cp.position > ri.loc_a  -- Must come AFTER the pinned starting point
            AND cp.position < ri.loc_b  -- Must be before the destination
            ORDER BY cp.position  -- Get the FIRST occurrence after the pinned point
            LIMIT 1
        ),
        alternative_ends AS (
            -- Find ANY point within 50m of destination that comes EARLIER on the route
            -- This stops the route at the first nearby point (opposite side of road)
            SELECT 
                cp.position as alt_loc,
                ST_Distance(
                    ST_LineInterpolatePoint(ri.geom_forward, cp.position)::geography,
                    ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
                ) as distance_to_b
            FROM close_points cp, route_info ri
            WHERE ST_Distance(
                ST_LineInterpolatePoint(ri.geom_forward, cp.position)::geography,
                ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
            ) < 50  -- Within 50 meters of destination
            AND cp.position > ri.loc_a  -- Must be after the start point
            AND cp.position < ri.loc_b  -- Must come BEFORE the pinned destination
            ORDER BY cp.position  -- Get the FIRST occurrence along the route
            LIMIT 1
        ),
        optimized_points AS (
            SELECT
                id,
                route_code,
                is_closed_loop,
                loc_a,
                loc_b,
                geom_forward,
                -- Use optimized points ONLY when they help avoid long loops
                CASE 
                    -- If we found a later starting point (opposite side), use it
                    WHEN alt_start.alt_loc IS NOT NULL THEN
                        alt_start.alt_loc  -- Use the later starting point (opposite side of road)
                    ELSE 
                        loc_a  -- Use original
                END as final_loc_a,
                CASE 
                    -- If we found a closer cutoff point for the destination, use it
                    WHEN alt_end.alt_loc IS NOT NULL THEN
                        alt_end.alt_loc  -- Use the earlier cutoff point (opposite side of road)
                    ELSE 
                        loc_b  -- Use original
                END as final_loc_b,
                -- Keep debug info
                alt_start.alt_loc as alt_start_loc,
                alt_end.alt_loc as alt_end_loc,
                alt_start.distance_to_a as alt_start_distance,
                alt_end.distance_to_b as alt_end_distance
            FROM route_info
            LEFT JOIN alternative_starts alt_start ON true
            LEFT JOIN alternative_ends alt_end ON true
        )
        SELECT
            id,
            route_code,
            is_closed_loop,
            loc_a,
            loc_b,
            final_loc_a,
            final_loc_b,
            -- Calculate distance using the final optimized points
            CASE
                WHEN is_closed_loop THEN
                    CASE
                        WHEN final_loc_a <= final_loc_b THEN
                            -- Simple forward path
                            ST_Length(ST_LineSubstring(geom_forward, final_loc_a, final_loc_b)::geography)
                        ELSE
                            -- Need to go around the loop (A to end, then start to B)
                            ST_Length(
                                ST_LineMerge(
                                    ST_Collect(
                                        ST_LineSubstring(geom_forward, final_loc_a, 1.0),
                                        ST_LineSubstring(geom_forward, 0.0, final_loc_b)
                                    )
                                )::geography
                            )
                    END
                ELSE
                    -- Non-loops: only allow forward direction
                    CASE
                        WHEN final_loc_a < final_loc_b THEN
                            ST_Length(ST_LineSubstring(geom_forward, final_loc_a, final_loc_b)::geography)
                        ELSE NULL
                    END
            END as forward_segment_distance,
            
            -- Get geometry using the final optimized points
            CASE
                WHEN is_closed_loop THEN
                    CASE
                        WHEN final_loc_a <= final_loc_b THEN
                            -- Simple forward path
                            ST_AsGeoJSON(ST_LineSubstring(geom_forward, final_loc_a, final_loc_b))
                        ELSE
                            -- Need to go around the loop (A to end, then start to B)
                            ST_AsGeoJSON(
                                ST_LineMerge(
                                    ST_Collect(
                                        ST_LineSubstring(geom_forward, final_loc_a, 1.0),
                                        ST_LineSubstring(geom_forward, 0.0, final_loc_b)
                                    )
                                )
                            )
                    END
                ELSE
                    -- Non-loops: only allow forward direction
                    CASE
                        WHEN final_loc_a < final_loc_b THEN
                            ST_AsGeoJSON(ST_LineSubstring(geom_forward, final_loc_a, final_loc_b))
                        ELSE NULL
                    END
            END as forward_segment_geojson,
            
            -- Debug info
            alt_start_loc,
            alt_end_loc,
            alt_start_distance,
            alt_end_distance
        FROM optimized_points;
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

        // Debug logging for optimization
        console.log(`\n=== Smart Route ${result.route_code} Debug ===`);
        console.log(`Closed loop: ${result.is_closed_loop}`);
        console.log(`Original positions: A@${(result.loc_a * 100).toFixed(1)}%, B@${(result.loc_b * 100).toFixed(1)}%`);
        
        // Check if optimization is needed
        const needsOptimization = result.is_closed_loop && result.loc_a > result.loc_b;
        if (needsOptimization) {
            console.log(`⚠️ OPTIMIZATION NEEDED: A > B on closed loop`);
        }
        
        if (result.alt_start_loc && result.final_loc_a !== result.loc_a) {
            console.log(`✅ Using alternative START @ ${(result.alt_start_loc * 100).toFixed(1)}% (was ${(result.loc_a * 100).toFixed(1)}%), distance: ${result.alt_start_distance?.toFixed(0)}m`);
        }
        if (result.alt_end_loc && result.final_loc_b !== result.loc_b) {
            console.log(`✅ Using alternative END @ ${(result.alt_end_loc * 100).toFixed(1)}% (was ${(result.loc_b * 100).toFixed(1)}%), distance: ${result.alt_end_distance?.toFixed(0)}m`);
        }
        
        console.log(`Final positions: A@${(result.final_loc_a * 100).toFixed(1)}%, B@${(result.final_loc_b * 100).toFixed(1)}%`);
        
        if (needsOptimization && result.final_loc_a === result.loc_a && result.final_loc_b === result.loc_b) {
            console.log(`❌ WARNING: No optimization applied despite A > B!`);
        }

        // Calculate direct distance between the two points
        const directDistance = calculateDirectDistance(
            { latitude: routeA.snapped_forward_lat, longitude: routeA.snapped_forward_lon },
            { latitude: routeB.snapped_forward_lat, longitude: routeB.snapped_forward_lon }
        );

        // Only process if the route goes in the correct direction
        if (!result.forward_segment_distance || !result.forward_segment_geojson) {
            console.log(`Route ${result.route_code}: No valid segment (wrong direction)`);
            return null;
        }

        const forwardDistance = result.forward_segment_distance;
        console.log(`Route ${result.route_code}: Valid segment, distance: ${forwardDistance.toFixed(0)}m`);

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