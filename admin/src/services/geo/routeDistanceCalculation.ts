import { query } from "@/lib/db/db";
import { CalculatedRoutes, LatLng, MappedGeoRouteResult, RouteSnap } from "@/types/GeoTypes";
import { calculateSmartRoute } from "./bidirectionalRouteHandler";

export async function calculateRoute(latLngA: LatLng, latLngB: LatLng) {
    const snappedRoutesA: RouteSnap[] = await findNearestRoutesPoints(latLngA);
    const snappedRoutesB: RouteSnap[] = await findNearestRoutesPoints(latLngB);

    if (!snappedRoutesA.length || !snappedRoutesB.length) {
        throw new Error("No jeepney routes found near the selected locations. Try selecting points closer to a route.");
    }

    // Track skipped routes for reporting
    const skippedRoutes: string[] = [];
    
    // First try the smart bidirectional route handler
    const smartResults = await calculateSmartRoute(snappedRoutesA, snappedRoutesB, skippedRoutes);
    
    if (smartResults && smartResults.length > 0) {
        // Process smart results
        const results: MappedGeoRouteResult[] = smartResults.map(r => {
            return {
                routeId: r.routeId,
                distanceMeters: r.distanceMeters,
                latLng: parsePostgisGeoJson(r.segmentGeoJSON)
            };
        });
        
        return { results, skippedRoutes };
    }
    
    // Fallback to original calculation if smart routing doesn't work
    const rawResults = await calculateRouteDistances(
        snappedRoutesA,
        snappedRoutesB,
        skippedRoutes
    );

    if (!rawResults || rawResults.length === 0) {
        // Build informative error message
        let errorMsg = "No valid routes found between these points.";
        if (skippedRoutes.length > 0) {
            errorMsg += ` Routes ${skippedRoutes.join(', ')} go in the opposite direction for your selected travel path.`;
        }
        throw new Error(errorMsg);
    }
    
    const results: MappedGeoRouteResult[] = rawResults.map(r => ({
        routeId: r.routeId,
        distanceMeters: r.distanceMeters,
        latLng: parsePostgisGeoJson(r.segmentGeoJSON)
    }));

    return { results, skippedRoutes };
}

export async function findNearestRoutesPoints(latLng: LatLng) {
    const radiusMeters = 200;
    const lon = latLng.longitude;
    const lat = latLng.latitude;

    const sql = `
        SELECT
        id,
        route_code,
        start_point_name,
        end_point_name,
        ST_Distance(
            geom_forward::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) AS distance_forward,
        ST_X(
            ST_ClosestPoint(
            geom_forward,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)
            )
        ) AS snapped_forward_lon,
        ST_Y(
            ST_ClosestPoint(
            geom_forward,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)
            )
        ) AS snapped_forward_lat
        
        FROM new_jeepney_routes
        
        WHERE ST_DWithin(
            geom_forward::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            $3
        )
        ORDER BY distance_forward ASC;
        `;

    try {
        const result = await query(sql, [lon, lat, radiusMeters]);
        return result;
    } catch (err) {
        console.error("Postgres query error:", err);
        return [];
    }
}

function findMatchingRoutePairs(
    routesA: RouteSnap[],
    routesB: RouteSnap[]
): [RouteSnap, RouteSnap][] {
    const routeBMap = new Map(routesB.map(r => [r.id, r]));
    const pairs: [RouteSnap, RouteSnap][] = [];

    for (const routeA of routesA) {
        const routeB = routeBMap.get(routeA.id);
        if (routeB) {
            pairs.push([routeA, routeB]);
        }
    }

    return pairs;
}

async function calculateRouteDistances(
    snappedRoutesA: RouteSnap[],
    snappedRoutesB: RouteSnap[],
    skippedRoutes?: string[]
) {
    const matchingPairs = findMatchingRoutePairs(snappedRoutesA, snappedRoutesB);

    if (matchingPairs.length === 0) return [];

    const results: CalculatedRoutes[] = [];

    for (const [routeA, routeB] of matchingPairs) {
        // Check if this is a closed loop route (first and last points are the same)
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
            FROM new_jeepney_routes
            WHERE id = $5
        )
        SELECT
            route_code,
            is_closed_loop,
            loc_a,
            loc_b,
            -- Calculate segment length - ONLY in forward direction
            CASE
                WHEN is_closed_loop THEN
                    -- For closed loops, always go forward along the route
                    CASE
                        WHEN loc_a <= loc_b THEN
                            -- Simple forward path from A to B
                            ST_Length(ST_LineSubstring(geom_forward, loc_a, loc_b)::geography)
                        ELSE
                            -- A is after B, so we go from A to end, then start to B (forward around the loop)
                            ST_Length(
                                ST_LineMerge(
                                    ST_Collect(
                                        ST_LineSubstring(geom_forward, loc_a, 1.0),
                                        ST_LineSubstring(geom_forward, 0.0, loc_b)
                                    )
                                )::geography
                            )
                    END
                ELSE
                    -- For non-loops, ONLY allow forward direction
                    CASE
                        WHEN loc_a < loc_b THEN
                            ST_Length(ST_LineSubstring(geom_forward, loc_a, loc_b)::geography)
                        ELSE 
                            NULL -- Reject backward travel
                    END
            END AS segment_length_meters,
            
            -- Get the geometry path - ONLY forward direction
            CASE
                WHEN is_closed_loop THEN
                    -- For closed loops, always go forward
                    CASE
                        WHEN loc_a <= loc_b THEN
                            -- Simple forward path from A to B
                            ST_AsGeoJSON(ST_LineSubstring(geom_forward, loc_a, loc_b))
                        ELSE
                            -- A is after B, go forward around the loop
                            ST_AsGeoJSON(
                                ST_LineMerge(
                                    ST_Collect(
                                        ST_LineSubstring(geom_forward, loc_a, 1.0),
                                        ST_LineSubstring(geom_forward, 0.0, loc_b)
                                    )
                                )
                            )
                    END
                ELSE
                    -- For non-loops, ONLY forward direction
                    CASE
                        WHEN loc_a < loc_b THEN
                            ST_AsGeoJSON(ST_LineSubstring(geom_forward, loc_a, loc_b))
                        ELSE 
                            NULL -- Reject backward travel
                    END
            END AS segment_geojson,
            
            -- Direction status for debugging
            CASE
                WHEN is_closed_loop THEN 
                    CASE
                        WHEN loc_a <= loc_b THEN 'forward_direct'
                        ELSE 'forward_wrapped'
                    END
                WHEN loc_a < loc_b THEN 'valid_forward'
                WHEN loc_a > loc_b THEN 'wrong_direction_rejected'
                ELSE 'same_point'
            END AS direction_status
        FROM route_info;
        `;

        const params = [
            routeA.snapped_forward_lon,
            routeA.snapped_forward_lat,
            routeB.snapped_forward_lon,
            routeB.snapped_forward_lat,
            routeA.id
        ];

        try {
            const [row] = await query(sql, params);
            
            // Only include routes that have a valid segment
            if (row.segment_length_meters !== null && row.segment_geojson !== null) {
                results.push({
                    routeId: routeA.route_code,
                    distanceMeters: row.segment_length_meters,
                    segmentGeoJSON: row.segment_geojson
                });
                console.log(`Route ${routeA.route_code}: ${row.direction_status} - distance: ${row.segment_length_meters?.toFixed(0)}m (A@${(row.loc_a * 100).toFixed(1)}% → B@${(row.loc_b * 100).toFixed(1)}%)`);
            } else if (row.direction_status === 'wrong_direction_rejected' && !row.is_closed_loop) {
                // Only track as skipped if it's not a closed loop and wrong direction
                if (skippedRoutes && !skippedRoutes.includes(routeA.route_code)) {
                    skippedRoutes.push(routeA.route_code);
                }
                console.log(`Route ${routeA.route_code}: Skipped (wrong direction - would need backward travel from ${(row.loc_a * 100).toFixed(1)}% to ${(row.loc_b * 100).toFixed(1)}%)`);
            }
        } catch (err) {
            console.error(`Error calculating distance for route ${routeA.id}:`, err);
        }
    }

    return results;
}

function parsePostgisGeoJson(segmentGeoJSON: string): LatLng[] {
    const geojson = JSON.parse(segmentGeoJSON);
    
    // Handle both LineString and MultiLineString
    let coordinates = geojson.coordinates;
    
    // If it's a MultiLineString (array of arrays of coordinates), flatten it
    if (geojson.type === 'MultiLineString' && Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) {
        console.log('Converting MultiLineString to single path');
        coordinates = coordinates.flat();
    }
    
    // Ensure coordinates are in the right format
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
        console.error('Invalid coordinates format:', geojson);
        return [];
    }
    
    // Check if first element is a coordinate pair or nested
    if (Array.isArray(coordinates[0]) && coordinates[0].length === 2) {
        // Normal LineString format [[lon, lat], [lon, lat], ...]
        return coordinates.map(
            ([lon, lat]: [number, number]) => ({
                latitude: lat,
                longitude: lon
            })
        );
    } else {
        console.error('Unexpected coordinate format:', coordinates);
        return [];
    }
}
