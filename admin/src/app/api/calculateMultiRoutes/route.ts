import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/db';
import { LatLng } from '@/types/GeoTypes';

// Minimum fare constants
const MINIMUM_FARE = 13;
const FARE_PER_KM = 2.20;

function calculateFare(distanceInMeters: number): number {
    const distanceInKm = distanceInMeters / 1000;
    const calculatedFare = distanceInKm * FARE_PER_KM;
    return Math.max(MINIMUM_FARE, Math.ceil(calculatedFare));
}

function parsePostgisGeoJson(geoJson: string): LatLng[] {
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

export async function POST(req: NextRequest) {
    try {
        const { from, to } = await req.json();
        
        if (!from || !to) {
            return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
        }

        console.log('🔄 MULTI-ROUTE API: Starting calculation');
        console.log('🔄 MULTI-ROUTE API: From:', from);
        console.log('🔄 MULTI-ROUTE API: To:', to);

        // Step 1: Find ALL routes that can be taken from the starting point
        const startRoutesQuery = `
            SELECT DISTINCT
                r.id,
                r.route_code,
                r.start_point_name,
                r.end_point_name,
                ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as position_on_route,
                ST_Distance(
                    r.geom_forward::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                ) as distance_to_route
            FROM jeepney_routes r
            WHERE ST_DWithin(
                r.geom_forward::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                200  -- Within 200 meters
            )
            ORDER BY distance_to_route;
        `;

        const startRoutes = await query(startRoutesQuery, [from.longitude, from.latitude]);
        console.log(`🔄 MULTI-ROUTE API: Found ${startRoutes.length} routes near start:`, 
            startRoutes.map(r => r.route_code).join(', '));
        
        // Log detailed info about start routes
        startRoutes.forEach(r => {
            console.log(`  - ${r.route_code}: ${r.start_point_name} → ${r.end_point_name}, position: ${(r.position_on_route * 100).toFixed(1)}%, distance: ${r.distance_to_route.toFixed(0)}m`);
        });

        // Step 2: Find ALL routes that can reach the destination
        const endRoutesQuery = `
            SELECT DISTINCT
                r.id,
                r.route_code,
                r.start_point_name,
                r.end_point_name,
                ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as position_on_route,
                ST_Distance(
                    r.geom_forward::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                ) as distance_to_route
            FROM jeepney_routes r
            WHERE ST_DWithin(
                r.geom_forward::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                200  -- Within 200 meters
            )
            ORDER BY distance_to_route;
        `;

        const endRoutes = await query(endRoutesQuery, [to.longitude, to.latitude]);
        console.log(`🔄 MULTI-ROUTE API: Found ${endRoutes.length} routes near destination:`, 
            endRoutes.map(r => r.route_code).join(', '));
        
        // Log detailed info about end routes
        endRoutes.forEach(r => {
            console.log(`  - ${r.route_code}: ${r.start_point_name} → ${r.end_point_name}, position: ${(r.position_on_route * 100).toFixed(1)}%, distance: ${r.distance_to_route.toFixed(0)}m`);
        });

        if (startRoutes.length === 0 || endRoutes.length === 0) {
            return NextResponse.json({ error: 'No routes available for journey' }, { status: 404 });
        }

        // Step 3: Find all possible route combinations
        const multiRouteOptions = [];

        for (const startRoute of startRoutes) {
            for (const endRoute of endRoutes) {
                // Skip if it's the same route (would be a single route, not multi)
                if (startRoute.id === endRoute.id) continue;

                console.log(`🔄 MULTI-ROUTE API: Checking ${startRoute.route_code} -> ${endRoute.route_code}`);

                // Find the closest point where these two routes meet
                const intersectionQuery = `
                    WITH series AS (
                        SELECT generate_series(0.0, 1.0, 0.005) as step
                    ),
                    route_samples AS (
                        -- Sample points along the first route (from start position to end)
                        SELECT 
                            ST_LineInterpolatePoint(r1.geom_forward, 
                                LEAST(1.0, $3::float + s.step)
                            ) as point1,
                            LEAST(1.0, $3::float + s.step) as position1
                        FROM 
                            (SELECT geom_forward FROM jeepney_routes WHERE id = $1) r1,
                            series s
                        WHERE $3::float + s.step <= 1.0
                    ),
                    closest_points AS (
                        SELECT 
                            rs.point1,
                            rs.position1,
                            ST_ClosestPoint(r2.geom_forward, rs.point1) as point2,
                            ST_LineLocatePoint(r2.geom_forward, ST_ClosestPoint(r2.geom_forward, rs.point1)) as position2,
                            ST_Distance(rs.point1::geography, ST_ClosestPoint(r2.geom_forward, rs.point1)::geography) as distance
                        FROM route_samples rs,
                            (SELECT geom_forward FROM jeepney_routes WHERE id = $2) r2
                        WHERE ST_Distance(rs.point1::geography, r2.geom_forward::geography) < 100  -- Within 100 meters
                    )
                    SELECT 
                        ST_Y(point1) as lat1,
                        ST_X(point1) as lon1,
                        ST_Y(point2) as lat2,
                        ST_X(point2) as lon2,
                        position1,
                        position2,
                        distance
                    FROM closest_points
                    WHERE position2 < $4  -- Must be before the destination on route2
                    ORDER BY 
                        -- Prefer intersections that minimize total travel
                        (position1 - $3) + ($4 - position2) + distance
                    LIMIT 1;
                `;

                const intersections = await query(intersectionQuery, [
                    startRoute.id, 
                    endRoute.id,
                    startRoute.position_on_route,
                    endRoute.position_on_route
                ]);

                if (intersections.length > 0) {
                    const intersection = intersections[0];
                    console.log(`🔄 MULTI-ROUTE API: Found intersection at distance ${intersection.distance}m`);

                    // Calculate the segments for each route
                    // First route: from start to intersection
                    const firstSegmentQuery = `
                        SELECT 
                            ST_AsGeoJSON(
                                ST_LineSubstring(
                                    geom_forward, 
                                    $2::float, 
                                    $3::float
                                )
                            ) as segment_geojson,
                            ST_Length(
                                ST_LineSubstring(
                                    geom_forward, 
                                    $2::float, 
                                    $3::float
                                )::geography
                            ) as distance_meters
                        FROM jeepney_routes 
                        WHERE id = $1;
                    `;

                    const firstSegment = await query(firstSegmentQuery, [
                        startRoute.id,
                        startRoute.position_on_route,
                        intersection.position1
                    ]);

                    // Second route: from intersection to destination
                    const secondSegmentQuery = `
                        SELECT 
                            ST_AsGeoJSON(
                                ST_LineSubstring(
                                    geom_forward, 
                                    $2::float, 
                                    $3::float
                                )
                            ) as segment_geojson,
                            ST_Length(
                                ST_LineSubstring(
                                    geom_forward, 
                                    $2::float, 
                                    $3::float
                                )::geography
                            ) as distance_meters
                        FROM jeepney_routes 
                        WHERE id = $1;
                    `;

                    const secondSegment = await query(secondSegmentQuery, [
                        endRoute.id,
                        intersection.position2,
                        endRoute.position_on_route
                    ]);

                    if (firstSegment.length > 0 && secondSegment.length > 0) {
                        const firstCoords = parsePostgisGeoJson(firstSegment[0].segment_geojson);
                        const secondCoords = parsePostgisGeoJson(secondSegment[0].segment_geojson);

                        if (firstCoords.length > 0 && secondCoords.length > 0) {
                            const route1Distance = firstSegment[0].distance_meters;
                            const route2Distance = secondSegment[0].distance_meters;
                            const totalDistance = route1Distance + route2Distance;

                            multiRouteOptions.push({
                                routeId: `${startRoute.route_code}-${endRoute.route_code}`,
                                routeName: `${startRoute.route_code} to ${endRoute.route_code}`,
                                distanceMeters: totalDistance,
                                isTransfer: true,
                                firstRoute: {
                                    routeId: startRoute.route_code,
                                    routeName: `${startRoute.start_point_name} - ${startRoute.end_point_name}`,
                                    coordinates: firstCoords,
                                    fare: calculateFare(route1Distance),
                                    distance: route1Distance
                                },
                                secondRoute: {
                                    routeId: endRoute.route_code,
                                    routeName: `${endRoute.start_point_name} - ${endRoute.end_point_name}`,
                                    coordinates: secondCoords,
                                    fare: calculateFare(route2Distance),
                                    distance: route2Distance
                                },
                                transferPoint: {
                                    latitude: intersection.lat1,
                                    longitude: intersection.lon1
                                },
                                totalFare: calculateFare(route1Distance) + calculateFare(route2Distance),
                                transferDistance: intersection.distance
                            });

                            console.log(`🔄 MULTI-ROUTE API: Added route combination ${startRoute.route_code} -> ${endRoute.route_code}`);
                        }
                    }
                }
            }
        }

        // Sort by total distance (shortest first)
        multiRouteOptions.sort((a, b) => a.distanceMeters - b.distanceMeters);

        // Return top 5 options
        const topOptions = multiRouteOptions.slice(0, 5);

        console.log(`🔄 MULTI-ROUTE API: Returning ${topOptions.length} route combinations`);
        
        return NextResponse.json(topOptions);

    } catch (error) {
        console.error('🔄 MULTI-ROUTE API ERROR:', error);
        return NextResponse.json({ 
            error: 'Failed to calculate multi-route journey',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}