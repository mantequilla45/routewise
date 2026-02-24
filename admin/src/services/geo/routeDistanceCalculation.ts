import { query } from "@/lib/db/db";
import { CalculatedRoutes, LatLng, MappedGeoRouteResult, RouteSnap } from "@/types/GeoTypes";
import { calculateSmartRoute } from "./bidirectionalRouteHandler";

export async function calculateRoute(latLngA: LatLng, latLngB: LatLng) {
    console.log('\n========================================');
    console.log('calculateRoute called on SERVER with:');
    console.log('Point A:', latLngA);
    console.log('Point B:', latLngB);
    console.log('========================================\n');
    
    const snappedRoutesA: RouteSnap[] = await findNearestRoutesPoints(latLngA);
    const snappedRoutesB: RouteSnap[] = await findNearestRoutesPoints(latLngB);

    if (!snappedRoutesA.length || !snappedRoutesB.length) {
        throw new Error("No jeepney routes found near the selected locations. Try selecting points closer to a route.");
    }

    // Track skipped routes for reporting
    const skippedRoutes: string[] = [];
    
    // First try the smart bidirectional route handler
    console.log('Trying smart bidirectional route handler...');
    const smartResults = await calculateSmartRoute(snappedRoutesA, snappedRoutesB, skippedRoutes);
    
    if (smartResults && smartResults.length > 0) {
        // Process smart results
        console.log(`Smart route returned ${smartResults.length} results, using those`);
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
    console.log('Smart route returned no results, falling back to original calculation...');
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
        -- Only snap if we're very close to the route (within 50 meters)
        -- Otherwise use the user's actual point
        CASE
            WHEN ST_Distance(
                geom_forward::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            ) < 50 THEN
                ST_X(
                    ST_ClosestPoint(
                        geom_forward,
                        ST_SetSRID(ST_MakePoint($1, $2), 4326)
                    )
                )
            ELSE
                $1  -- Use original longitude
        END AS snapped_forward_lon,
        CASE
            WHEN ST_Distance(
                geom_forward::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            ) < 50 THEN
                ST_Y(
                    ST_ClosestPoint(
                        geom_forward,
                        ST_SetSRID(ST_MakePoint($1, $2), 4326)
                    )
                )
            ELSE
                $2  -- Use original latitude
        END AS snapped_forward_lat
        
        FROM jeepney_routes
        
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
        console.log(`\n--- Processing ${routeA.route_code} ---`);
        console.log(`Point A coords: ${routeA.snapped_forward_lon}, ${routeA.snapped_forward_lat}`);
        console.log(`Point B coords: ${routeB.snapped_forward_lon}, ${routeB.snapped_forward_lat}`);
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
            FROM jeepney_routes
            WHERE id = $5
        ),
        debug_info AS (
            SELECT 
                loc_a,
                loc_b,
                is_closed_loop,
                CASE WHEN loc_a > loc_b AND is_closed_loop THEN 'NEEDS_OPTIMIZATION' ELSE 'OK' END as status
            FROM route_info
        ),
        -- Find if there's a point on the route very close to point A (other side of road)
        close_points AS (
            SELECT 
                generate_series(0.0, 1.0, 0.001) as position
            FROM route_info
        ),
        alternative_starts AS (
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
            ) < 50  -- Within 50 meters (other side of road)
            AND cp.position != ri.loc_a  -- Not the same point
            ORDER BY 
                -- Prefer points that would give shorter routes
                CASE 
                    WHEN cp.position < ri.loc_a AND cp.position < ri.loc_b AND ri.loc_b < ri.loc_a THEN 0
                    WHEN cp.position > ri.loc_a AND cp.position < ri.loc_b THEN 1
                    ELSE 2
                END,
                distance_to_a
            LIMIT 1
        ),
        -- Find if there's a point on the route very close to point B (other side of road)
        alternative_ends AS (
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
            ) < 50  -- Within 50 meters (other side of road)
            AND cp.position != ri.loc_b  -- Not the same point
            ORDER BY 
                -- Prefer points that would give shorter routes
                CASE 
                    WHEN cp.position > ri.loc_b AND cp.position > ri.loc_a AND ri.loc_a > ri.loc_b THEN 0
                    WHEN cp.position < ri.loc_b AND cp.position > ri.loc_a THEN 1
                    ELSE 2
                END,
                distance_to_b
            LIMIT 1
        )
        SELECT
            route_code,
            is_closed_loop,
            loc_a,
            loc_b,
            -- Debug: show raw alternative locations
            alt_start.alt_loc as alt_start_loc,
            alt_end.alt_loc as alt_end_loc,
            -- Use alternative points if they give a shorter route
            CASE 
                WHEN alt_start.alt_loc IS NOT NULL AND is_closed_loop AND loc_a > loc_b THEN
                    -- Check if using alt start point would be shorter
                    CASE
                        WHEN alt_start.alt_loc < loc_b THEN alt_start.alt_loc
                        ELSE loc_a
                    END
                ELSE loc_a
            END as final_loc_a,
            CASE 
                WHEN alt_end.alt_loc IS NOT NULL AND is_closed_loop AND loc_b < loc_a THEN
                    -- Check if using alt end point would be shorter
                    CASE
                        WHEN alt_end.alt_loc > loc_a THEN alt_end.alt_loc
                        ELSE loc_b
                    END
                ELSE loc_b
            END as final_loc_b,
            alt_start.alt_loc as alternative_start,
            alt_start.distance_to_a as alt_start_distance,
            alt_end.alt_loc as alternative_end,
            alt_end.distance_to_b as alt_end_distance,
            -- Debug: optimization decisions
            CASE WHEN loc_a > loc_b THEN 'A>B' ELSE 'A<=B' END as position_relationship,
            CASE WHEN alt_start.alt_loc IS NOT NULL THEN 'YES' ELSE 'NO' END as has_alt_start,
            CASE WHEN alt_end.alt_loc IS NOT NULL THEN 'YES' ELSE 'NO' END as has_alt_end,
            -- Calculate segment length using the optimal points
            CASE
                WHEN is_closed_loop THEN
                    -- For closed loops, use the final optimized positions
                    CASE
                        WHEN (CASE WHEN alt_start.alt_loc IS NOT NULL AND loc_a > loc_b THEN
                                  CASE WHEN alt_start.alt_loc < loc_b THEN alt_start.alt_loc ELSE loc_a END
                              ELSE loc_a END) <= 
                             (CASE WHEN alt_end.alt_loc IS NOT NULL AND loc_b < loc_a THEN
                                  CASE WHEN alt_end.alt_loc > loc_a THEN alt_end.alt_loc ELSE loc_b END
                              ELSE loc_b END) THEN
                            -- Simple forward path using final positions
                            ST_Length(ST_LineSubstring(geom_forward, 
                                CASE WHEN alt_start.alt_loc IS NOT NULL AND loc_a > loc_b THEN
                                    CASE WHEN alt_start.alt_loc < loc_b THEN alt_start.alt_loc ELSE loc_a END
                                ELSE loc_a END,
                                CASE WHEN alt_end.alt_loc IS NOT NULL AND loc_b < loc_a THEN
                                    CASE WHEN alt_end.alt_loc > loc_a THEN alt_end.alt_loc ELSE loc_b END
                                ELSE loc_b END
                            )::geography)
                        ELSE
                            -- A is after B, so we go from A to end, then start to B (forward around the loop)
                            ST_Length(
                                ST_LineMerge(
                                    ST_Collect(
                                        ST_LineSubstring(geom_forward, 
                                            CASE WHEN alt_start.alt_loc IS NOT NULL AND loc_a > loc_b THEN
                                                CASE WHEN alt_start.alt_loc < loc_b THEN alt_start.alt_loc ELSE loc_a END
                                            ELSE loc_a END, 1.0),
                                        ST_LineSubstring(geom_forward, 0.0, 
                                            CASE WHEN alt_end.alt_loc IS NOT NULL AND loc_b < loc_a THEN
                                                CASE WHEN alt_end.alt_loc > loc_a THEN alt_end.alt_loc ELSE loc_b END
                                            ELSE loc_b END)
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
            
            -- Get the geometry path using the optimal starting and ending points
            CASE
                WHEN is_closed_loop THEN
                    -- For closed loops, use optimized endpoints
                    CASE
                        WHEN (CASE WHEN alt_start.alt_loc IS NOT NULL AND loc_a > loc_b THEN
                                  CASE WHEN alt_start.alt_loc < loc_b THEN alt_start.alt_loc ELSE loc_a END
                              ELSE loc_a END) <= 
                             (CASE WHEN alt_end.alt_loc IS NOT NULL AND loc_b < loc_a THEN
                                  CASE WHEN alt_end.alt_loc > loc_a THEN alt_end.alt_loc ELSE loc_b END
                              ELSE loc_b END) THEN
                            -- Simple forward path using optimized endpoints
                            ST_AsGeoJSON(ST_LineSubstring(geom_forward, 
                                CASE WHEN alt_start.alt_loc IS NOT NULL AND loc_a > loc_b THEN
                                    CASE WHEN alt_start.alt_loc < loc_b THEN alt_start.alt_loc ELSE loc_a END
                                ELSE loc_a END,
                                CASE WHEN alt_end.alt_loc IS NOT NULL AND loc_b < loc_a THEN
                                    CASE WHEN alt_end.alt_loc > loc_a THEN alt_end.alt_loc ELSE loc_b END
                                ELSE loc_b END
                            ))
                        ELSE
                            -- A is after B, go forward around the loop with optimized points
                            ST_AsGeoJSON(
                                ST_LineMerge(
                                    ST_Collect(
                                        ST_LineSubstring(geom_forward, 
                                            CASE WHEN alt_start.alt_loc IS NOT NULL AND loc_a > loc_b THEN
                                                CASE WHEN alt_start.alt_loc < loc_b THEN alt_start.alt_loc ELSE loc_a END
                                            ELSE loc_a END, 1.0),
                                        ST_LineSubstring(geom_forward, 0.0, 
                                            CASE WHEN alt_end.alt_loc IS NOT NULL AND loc_b < loc_a THEN
                                                CASE WHEN alt_end.alt_loc > loc_a THEN alt_end.alt_loc ELSE loc_b END
                                            ELSE loc_b END)
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
                        WHEN alt_start.alt_loc IS NOT NULL AND loc_a > loc_b AND alt_start.alt_loc < loc_b THEN 'used_opposite_start'
                        WHEN alt_end.alt_loc IS NOT NULL AND loc_b < loc_a AND alt_end.alt_loc > loc_a THEN 'used_opposite_end'
                        WHEN alt_start.alt_loc IS NOT NULL AND alt_end.alt_loc IS NOT NULL THEN 'used_both_opposite_sides'
                        WHEN loc_a <= loc_b THEN 'forward_direct'
                        ELSE 'forward_wrapped'
                    END
                WHEN loc_a < loc_b THEN 'valid_forward'
                WHEN loc_a > loc_b THEN 'wrong_direction_rejected'
                ELSE 'same_point'
            END AS direction_status
        FROM route_info
        LEFT JOIN alternative_starts alt_start ON true
        LEFT JOIN alternative_ends alt_end ON true;
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
            
            // DEBUG: Log all the optimization details
            console.log(`\n=== Route ${routeA.route_code} Debug ===`);
            console.log(`Closed loop: ${row.is_closed_loop}`);
            console.log(`Original positions: A@${(row.loc_a * 100).toFixed(1)}%, B@${(row.loc_b * 100).toFixed(1)}%`);
            console.log(`Position relationship: ${row.position_relationship}`);
            console.log(`Has alternative start: ${row.has_alt_start} ${row.alt_start_loc ? `@ ${(row.alt_start_loc * 100).toFixed(1)}%` : ''}`);
            console.log(`Has alternative end: ${row.has_alt_end} ${row.alt_end_loc ? `@ ${(row.alt_end_loc * 100).toFixed(1)}%` : ''}`);
            console.log(`Final positions: A@${(row.final_loc_a * 100).toFixed(1)}%, B@${(row.final_loc_b * 100).toFixed(1)}%`);
            console.log(`Direction status: ${row.direction_status}`);
            
            // Only include routes that have a valid segment
            if (row.segment_length_meters !== null && row.segment_geojson !== null) {
                // Log when we use the opposite side optimization
                if (row.direction_status === 'used_opposite_start') {
                    console.log(`✓ Using opposite side of road for START to avoid long loop. Cross distance: ${row.alt_start_distance?.toFixed(0)}m`);
                } else if (row.direction_status === 'used_opposite_end') {
                    console.log(`✓ Using opposite side of road for END to avoid long loop. Cross distance: ${row.alt_end_distance?.toFixed(0)}m`);
                } else if (row.direction_status === 'used_both_opposite_sides') {
                    console.log(`✓ Using opposite side for BOTH start (${row.alt_start_distance?.toFixed(0)}m) and end (${row.alt_end_distance?.toFixed(0)}m)`);
                }
                
                results.push({
                    routeId: routeA.route_code,
                    distanceMeters: row.segment_length_meters,
                    segmentGeoJSON: row.segment_geojson
                });
                console.log(`✓ Route included: distance ${row.segment_length_meters?.toFixed(0)}m`);
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
