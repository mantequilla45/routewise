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
        // Use ST_LineLocatePoint to find the EXACT closest point on the route
        const startRoutesQuery = `
            SELECT 
                r.id,
                r.route_code,
                r.start_point_name,
                r.end_point_name,
                ST_LineLocatePoint(
                    r.geom_forward, 
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)
                ) as position_on_route,
                ST_Distance(
                    r.geom_forward::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                ) as distance_to_route
            FROM jeepney_routes r
            WHERE ST_DWithin(
                r.geom_forward::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                50  -- Within 50 meters of route
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
        // Use ST_LineLocatePoint to find the EXACT closest point on the route
        const endRoutesQuery = `
            SELECT 
                r.id,
                r.route_code,
                r.start_point_name,
                r.end_point_name,
                ST_LineLocatePoint(
                    r.geom_forward, 
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)
                ) as position_on_route,
                ST_Distance(
                    r.geom_forward::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                ) as distance_to_route
            FROM jeepney_routes r
            WHERE ST_DWithin(
                r.geom_forward::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                50  -- Within 50 meters of route
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
                // Check the entire route since jeepneys run in loops
                const intersectionQuery = `
                    WITH series AS (
                        SELECT generate_series(0.0, 1.0, 0.005) as step
                    ),
                    route_samples AS (
                        -- Sample points along the ENTIRE first route to find all possible intersections
                        SELECT 
                            ST_LineInterpolatePoint(r1.geom_forward, s.step) as point1,
                            s.step as position1,
                            -- Calculate effective distance considering the loop nature
                            CASE 
                                WHEN s.step >= $3::float THEN s.step - $3::float  -- Forward from start
                                ELSE (1.0 - $3::float) + s.step  -- Wrap around the loop
                            END as travel_distance
                        FROM 
                            (SELECT geom_forward FROM jeepney_routes WHERE id = $1) r1,
                            series s
                    ),
                    closest_points AS (
                        SELECT 
                            rs.point1,
                            rs.position1,
                            rs.travel_distance,
                            ST_ClosestPoint(r2.geom_forward, rs.point1) as point2,
                            ST_LineLocatePoint(r2.geom_forward, ST_ClosestPoint(r2.geom_forward, rs.point1)) as position2,
                            ST_Distance(rs.point1::geography, ST_ClosestPoint(r2.geom_forward, rs.point1)::geography) as distance,
                            $4::float as destination_pos
                        FROM route_samples rs,
                            (SELECT geom_forward FROM jeepney_routes WHERE id = $2) r2
                        WHERE ST_Distance(rs.point1::geography, r2.geom_forward::geography) < 50  -- Within 50 meters
                    )
                    SELECT 
                        ST_Y(point1) as lat1,
                        ST_X(point1) as lon1,
                        ST_Y(point2) as lat2,
                        ST_X(point2) as lon2,
                        position1,
                        position2,
                        distance,
                        travel_distance
                    FROM closest_points
                    WHERE position2 <= destination_pos  -- Intersection must be before destination on second route
                        AND travel_distance < 0.5  -- Don't travel more than half the route
                    ORDER BY 
                        -- Prefer closer intersections with shorter travel distance
                        travel_distance + (distance / 100)  -- Balance travel distance and intersection quality
                    LIMIT 1;
                `;

                const intersections = await query(intersectionQuery, [
                    startRoute.id, 
                    endRoute.id,
                    startRoute.position_on_route,
                    endRoute.position_on_route
                ]);

                // Debug: Check if there are ANY intersections (without position restriction)
                const allIntersectionsQuery = `
                    WITH closest AS (
                        SELECT 
                            ST_ClosestPoint(r2.geom_forward, ST_LineInterpolatePoint(r1.geom_forward, $3::float)) as point,
                            ST_LineLocatePoint(r2.geom_forward, ST_ClosestPoint(r2.geom_forward, ST_LineInterpolatePoint(r1.geom_forward, $3::float))) as position2,
                            ST_Distance(
                                ST_LineInterpolatePoint(r1.geom_forward, $3::float)::geography,
                                ST_ClosestPoint(r2.geom_forward, ST_LineInterpolatePoint(r1.geom_forward, $3::float))::geography
                            ) as distance
                        FROM 
                            (SELECT geom_forward FROM jeepney_routes WHERE id = $1) r1,
                            (SELECT geom_forward FROM jeepney_routes WHERE id = $2) r2
                    )
                    SELECT position2, distance FROM closest;
                `;
                
                const debugIntersections = await query(allIntersectionsQuery, [
                    startRoute.id,
                    endRoute.id,
                    startRoute.position_on_route
                ]);
                
                if (debugIntersections.length > 0) {
                    const debug = debugIntersections[0];
                    console.log(`  DEBUG: Closest point on ${endRoute.route_code} is at position ${(debug.position2 * 100).toFixed(1)}% (distance: ${debug.distance.toFixed(1)}m), destination at ${(endRoute.position_on_route * 100).toFixed(1)}%`);
                }

                if (intersections.length > 0) {
                    const intersection = intersections[0];
                    console.log(`🔄 MULTI-ROUTE API: Found valid intersection at distance ${intersection.distance}m, position1: ${intersection.position1}, position2: ${intersection.position2}`);

                    // Calculate the segments for each route
                    // First route: from start to intersection (handling loop wraparound)
                    const firstSegmentQuery = intersection.position1 >= startRoute.position_on_route
                        ? `-- Forward travel: start -> intersection
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
                            WHERE id = $1;`
                        : `-- Loop wraparound: start -> end + beginning -> intersection
                            SELECT 
                                ST_AsGeoJSON(
                                    ST_Union(
                                        ST_LineSubstring(geom_forward, $2::float, 1.0),
                                        ST_LineSubstring(geom_forward, 0.0, $3::float)
                                    )
                                ) as segment_geojson,
                                ST_Length(ST_LineSubstring(geom_forward, $2::float, 1.0)::geography) +
                                ST_Length(ST_LineSubstring(geom_forward, 0.0, $3::float)::geography) as distance_meters
                            FROM jeepney_routes 
                            WHERE id = $1;`;

                    console.log(`🔄 MULTI-ROUTE API: First segment - start pos: ${startRoute.position_on_route}, intersection pos: ${intersection.position1}`);
                    
                    const firstSegment = await query(firstSegmentQuery, [
                        startRoute.id,
                        startRoute.position_on_route,
                        intersection.position1
                    ]);

                    // Second route: from intersection to destination
                    // Handle both forward and backward cases since destination could be anywhere
                    const secondSegmentQuery = `
                        WITH route_data AS (
                            SELECT 
                                id,
                                geom_forward,
                                $2::float as intersection_pos,
                                $3::float as destination_pos
                            FROM jeepney_routes 
                            WHERE id = $1
                        )
                        SELECT 
                            ST_AsGeoJSON(
                                CASE 
                                    WHEN intersection_pos <= destination_pos THEN
                                        -- Forward: intersection before destination
                                        ST_LineSubstring(geom_forward, intersection_pos, destination_pos)
                                    ELSE
                                        -- Backward: destination before intersection (shouldn't happen but handle it)
                                        -- Return empty linestring in this case
                                        ST_GeomFromText('LINESTRING EMPTY', 4326)
                                END
                            ) as segment_geojson,
                            CASE 
                                WHEN intersection_pos <= destination_pos THEN
                                    ST_Length(ST_LineSubstring(geom_forward, intersection_pos, destination_pos)::geography)
                                ELSE
                                    999999  -- Large number to deprioritize invalid routes
                            END as distance_meters
                        FROM route_data;
                    `;

                    console.log(`🔄 MULTI-ROUTE API: Second segment - intersection pos: ${intersection.position2}, destination pos: ${endRoute.position_on_route}`);
                    
                    const secondSegment = await query(secondSegmentQuery, [
                        endRoute.id,
                        intersection.position2,
                        endRoute.position_on_route
                    ]);

                    if (firstSegment.length > 0 && secondSegment.length > 0) {
                        const firstCoords = parsePostgisGeoJson(firstSegment[0].segment_geojson);
                        const secondCoords = parsePostgisGeoJson(secondSegment[0].segment_geojson);

                        // Skip if second segment is invalid (would go backwards)
                        if (firstCoords.length > 0 && secondCoords.length > 0 && secondSegment[0].distance_meters < 50000) {
                            const route1Distance = firstSegment[0].distance_meters;
                            const route2Distance = secondSegment[0].distance_meters;
                            const totalDistance = route1Distance + route2Distance;

                            console.log(`🔄 MULTI-ROUTE API: First route has ${firstCoords.length} points, last point:`, firstCoords[firstCoords.length - 1]);
                            console.log(`🔄 MULTI-ROUTE API: Second route has ${secondCoords.length} points, first point:`, secondCoords[0], 'last point:', secondCoords[secondCoords.length - 1]);
                            console.log(`🔄 MULTI-ROUTE API: Destination should be near:`, { latitude: to.latitude, longitude: to.longitude });

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