import { query } from "@/lib/db/db";
import { CalculatedRoutes, LatLng, MappedGeoRouteResult, RouteSnap } from "@/types/GeoTypes";

export async function calculateRoute(latLngA: LatLng, latLngB: LatLng) {
    const snappedRoutesA: RouteSnap[] = await findNearestRoutesPoints(latLngA);
    const snappedRoutesB: RouteSnap[] = await findNearestRoutesPoints(latLngB);

    if (!snappedRoutesA.length || !snappedRoutesB.length) {
        throw new Error("No routes found near one of the points");
    }

    const direction = getMovementDirection(latLngA, latLngB);

    const rawResults = await calculateRouteDistances(
        snappedRoutesA,
        snappedRoutesB,
        [direction.horizontal, direction.vertical]
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
        ST_Distance(
            geom_reverse::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) AS distance_reverse,
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
        ) AS snapped_forward_lat,
        ST_X(
            ST_ClosestPoint(
            geom_reverse,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)
            )
        ) AS snapped_reverse_lon,
        ST_Y(
            ST_ClosestPoint(
            geom_reverse,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)
            )
        ) AS snapped_reverse_lat
        
        FROM new_jeepney_routes
        
        WHERE ST_DWithin(
            geom_forward::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            $3
        )
        OR ST_DWithin(
            geom_reverse::geography,
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
    direction: [string, string]
) {
    const matchingPairs = findMatchingRoutePairs(snappedRoutesA, snappedRoutesB);

    if (matchingPairs.length === 0) return [];

    const results: CalculatedRoutes[] = [];

    for (const [routeA, routeB] of matchingPairs) {
        const sql = `
        SELECT
        ST_Length(
            ST_LineSubstring(
            CASE
                WHEN horizontal_or_vertical_road = true AND $6 = 'horizontal' THEN geom_forward
                WHEN horizontal_or_vertical_road = true AND $6 = 'reverse_horizontal' THEN geom_reverse
                WHEN horizontal_or_vertical_road = false AND $6 = 'vertical' THEN geom_forward
                WHEN horizontal_or_vertical_road = false AND $6 = 'reverse_vertical' THEN geom_reverse
                ELSE geom_forward
            END,
            ST_LineLocatePoint(
                CASE
                WHEN horizontal_or_vertical_road = true AND $6 = 'horizontal' THEN geom_forward
                WHEN horizontal_or_vertical_road = true AND $6 = 'reverse_horizontal' THEN geom_reverse
                WHEN horizontal_or_vertical_road = false AND $6 = 'vertical' THEN geom_forward
                WHEN horizontal_or_vertical_road = false AND $6 = 'reverse_vertical' THEN geom_reverse
                ELSE geom_forward
                END,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)
            ),
            ST_LineLocatePoint(
                CASE
                WHEN horizontal_or_vertical_road = true AND $6 = 'horizontal' THEN geom_forward
                WHEN horizontal_or_vertical_road = true AND $6 = 'reverse_horizontal' THEN geom_reverse
                WHEN horizontal_or_vertical_road = false AND $6 = 'vertical' THEN geom_forward
                WHEN horizontal_or_vertical_road = false AND $6 = 'reverse_vertical' THEN geom_reverse
                ELSE geom_forward
                END,
                ST_SetSRID(ST_MakePoint($3, $4), 4326)
            )
            )::geography
        ) AS segment_length_meters,

        ST_AsGeoJSON(
            ST_LineSubstring(
            CASE
                WHEN horizontal_or_vertical_road = true AND $6 = 'horizontal' THEN geom_forward
                WHEN horizontal_or_vertical_road = true AND $6 = 'reverse_horizontal' THEN geom_reverse
                WHEN horizontal_or_vertical_road = false AND $6 = 'vertical' THEN geom_forward
                WHEN horizontal_or_vertical_road = false AND $6 = 'reverse_vertical' THEN geom_reverse
                ELSE geom_forward
            END,
            ST_LineLocatePoint(
                CASE
                WHEN horizontal_or_vertical_road = true AND $6 = 'horizontal' THEN geom_forward
                WHEN horizontal_or_vertical_road = true AND $6 = 'reverse_horizontal' THEN geom_reverse
                WHEN horizontal_or_vertical_road = false AND $6 = 'vertical' THEN geom_forward
                WHEN horizontal_or_vertical_road = false AND $6 = 'reverse_vertical' THEN geom_reverse
                ELSE geom_forward
                END,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)
            ),
            ST_LineLocatePoint(
                CASE
                WHEN horizontal_or_vertical_road = true AND $6 = 'horizontal' THEN geom_forward
                WHEN horizontal_or_vertical_road = true AND $6 = 'reverse_horizontal' THEN geom_reverse
                WHEN horizontal_or_vertical_road = false AND $6 = 'vertical' THEN geom_forward
                WHEN horizontal_or_vertical_road = false AND $6 = 'reverse_vertical' THEN geom_reverse
                ELSE geom_forward
                END,
                ST_SetSRID(ST_MakePoint($3, $4), 4326)
            )
            )
        ) AS segment_geojson

        FROM new_jeepney_routes
        WHERE id = $5;
        `;

        const params = [
            routeA.snapped_forward_lon,
            routeA.snapped_forward_lat,
            routeB.snapped_forward_lon,
            routeB.snapped_forward_lat,
            routeA.id,
            direction
        ];

        try {
            const [row] = await query(sql, params);
            results.push({
                routeId: routeA.route_code,
                distanceMeters: row.segment_length_meters,
                segmentGeoJSON: row.segment_geojson
            });
        } catch (err) {
            console.error(`Error calculating distance for route ${routeA.id}:`, err);
        }
    }

    return results;
}

function getMovementDirection(latLngA: LatLng, latLngB: LatLng) {
    const dLat = latLngB.latitude - latLngA.latitude;
    const dLon = latLngB.longitude - latLngA.longitude;

    let horizontal: "forward" | "reverse" | "none";
    let vertical: "forward" | "reverse" | "none";

    if (dLon > 0) horizontal = "forward";
    else if (dLon < 0) horizontal = "reverse";
    else horizontal = "none";

    if (dLat > 0) vertical = "forward";
    else if (dLat < 0) vertical = "reverse";
    else vertical = "none";

    return { horizontal, vertical };
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
