import { query } from "@/lib/db/db";
import { CalculatedRoutes, LatLng, MappedGeoRouteResult, RouteSnap } from "@/types/GeoTypes";
import { calculateSmartRoute } from "./bidirectionalRouteHandler";

export async function calculateRoute(latLngA: LatLng, latLngB: LatLng) {
    console.log('=== CALCULATING ROUTE ===');
    console.log('Point A:', latLngA);
    console.log('Point B:', latLngB);
    
    const snappedRoutesA: RouteSnap[] = await findNearestRoutesPoints(latLngA);
    const snappedRoutesB: RouteSnap[] = await findNearestRoutesPoints(latLngB);

    console.log('Routes near A:', snappedRoutesA.map(r => r.route_code));
    console.log('Routes near B:', snappedRoutesB.map(r => r.route_code));

    if (!snappedRoutesA.length || !snappedRoutesB.length) {
        throw new Error("No routes found near one of the points");
    }

    // First try the smart bidirectional route handler
    const smartResults = await calculateSmartRoute(snappedRoutesA, snappedRoutesB);
    
    if (smartResults && smartResults.length > 0) {
        // Process smart results
        const results: MappedGeoRouteResult[] = smartResults.map(r => {
            const geoJson = JSON.parse(r.segmentGeoJSON);
            const isCrossRoad = r.routeId.endsWith('_CROSS');
            
            return {
                routeId: r.routeId,
                distanceMeters: r.distanceMeters,
                latLng: parsePostgisGeoJson(r.segmentGeoJSON),
                // Add a special property to indicate crossing is needed
                ...(isCrossRoad && { 
                    shouldCrossRoad: true,
                    message: geoJson.properties?.message || "Cross to the other side of the road"
                })
            };
        });
        
        console.log("Smart route results:", results);
        return results;
    }
    
    // Fallback to original calculation if smart routing doesn't work
    const rawResults = await calculateRouteDistances(
        snappedRoutesA,
        snappedRoutesB
    );

    if (!rawResults || rawResults.length === 0) {
        return [];
    }
    
    const results: MappedGeoRouteResult[] = rawResults.map(r => ({
        routeId: r.routeId,
        distanceMeters: r.distanceMeters,
        latLng: parsePostgisGeoJson(r.segmentGeoJSON)
    }));

    console.log(results);
    return results;
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
    snappedRoutesB: RouteSnap[]
) {
    const matchingPairs = findMatchingRoutePairs(snappedRoutesA, snappedRoutesB);

    if (matchingPairs.length === 0) return [];

    const results: CalculatedRoutes[] = [];

    for (const [routeA, routeB] of matchingPairs) {
        // Each route has its own specific path and direction
        // Only check if the route goes in the correct direction (A before B)
        const sql = `
        WITH route_locations AS (
            SELECT
                id,
                route_code,
                horizontal_or_vertical_road,
                geom_forward,
                ST_LineLocatePoint(geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as loc_a,
                ST_LineLocatePoint(geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as loc_b
            FROM new_jeepney_routes
            WHERE id = $5
        )
        SELECT
            route_code,
            -- Only return a result if A comes before B in the route direction
            CASE
                WHEN loc_a < loc_b THEN
                    ST_Length(ST_LineSubstring(geom_forward, loc_a, loc_b)::geography)
                ELSE NULL
            END AS segment_length_meters,
            
            -- Get the geometry only if direction is valid
            CASE
                WHEN loc_a < loc_b THEN
                    ST_AsGeoJSON(ST_LineSubstring(geom_forward, loc_a, loc_b))
                ELSE NULL
            END AS segment_geojson,
            
            -- Debug info
            loc_a,
            loc_b,
            CASE
                WHEN loc_a < loc_b THEN 'valid'
                WHEN loc_a > loc_b THEN 'wrong_direction'
                ELSE 'same_point'
            END AS direction_status
        FROM route_locations;
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
            
            // Only include routes that have a valid direction
            if (row.segment_length_meters !== null && row.segment_geojson !== null) {
                // Additional check: if the distance along the route is too large compared to
                // what would be expected, it might be going the wrong way
                const routeDistance = row.segment_length_meters;
                console.log(`Route ${routeA.route_code}: Distance check - ${routeDistance.toFixed(0)}m`);
                
                results.push({
                    routeId: routeA.route_code,
                    distanceMeters: row.segment_length_meters,
                    segmentGeoJSON: row.segment_geojson
                });
                console.log(`Route ${routeA.route_code}: Valid (${row.direction_status}) - loc_a: ${row.loc_a?.toFixed(3)}, loc_b: ${row.loc_b?.toFixed(3)}`);
            } else {
                console.log(`Route ${routeA.route_code}: Skipped (${row.direction_status}) - Route goes in opposite direction (A:${row.loc_a?.toFixed(3)} B:${row.loc_b?.toFixed(3)})`);
            }
        } catch (err) {
            console.error(`Error calculating distance for route ${routeA.id}:`, err);
        }
    }

    return results;
}

function parsePostgisGeoJson(segmentGeoJSON: string): LatLng[] {
    const geojson = JSON.parse(segmentGeoJSON);
    return geojson.coordinates.map(
        ([lon, lat]: [number, number]) => ({
            latitude: lat,
            longitude: lon
        })
    );
}
