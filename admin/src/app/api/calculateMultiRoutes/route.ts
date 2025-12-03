import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { routeDistanceCalculation } from '@/services/geo/routeDistanceCalculation';
import { findAlternativeEnd } from '@/services/geo/bidirectionalRouteHandler';

interface LatLng {
    latitude: number;
    longitude: number;
}

// Minimum fare constants (same as main route calculation)
const MINIMUM_FARE = 13;
const FARE_PER_KM = 2.20;

function calculateFare(distanceInMeters: number): number {
    const distanceInKm = distanceInMeters / 1000;
    const calculatedFare = distanceInKm * FARE_PER_KM;
    return Math.max(MINIMUM_FARE, Math.ceil(calculatedFare));
}

export async function POST(req: NextRequest) {
    try {
        const { from, to } = await req.json();
        
        if (!from || !to) {
            return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
        }

        const supabase = await createClient();
        console.log('Multi-route calculation starting:', { from, to });

        // Step 1: Find all routes that contain the starting point
        const startRoutesQuery = await supabase.rpc('find_routes_containing_point', {
            lat: from.latitude,
            lon: from.longitude,
            max_distance: 100 // meters
        });

        if (startRoutesQuery.error) {
            console.error('Error finding start routes:', startRoutesQuery.error);
            return NextResponse.json({ error: 'Failed to find routes from starting point' }, { status: 500 });
        }

        // Step 2: Find all routes that contain the ending point
        const endRoutesQuery = await supabase.rpc('find_routes_containing_point', {
            lat: to.latitude,
            lon: to.longitude,
            max_distance: 100 // meters
        });

        if (endRoutesQuery.error) {
            console.error('Error finding end routes:', endRoutesQuery.error);
            return NextResponse.json({ error: 'Failed to find routes to destination' }, { status: 500 });
        }

        const startRoutes = startRoutesQuery.data || [];
        const endRoutes = endRoutesQuery.data || [];

        console.log(`Found ${startRoutes.length} routes from start, ${endRoutes.length} routes to end`);

        if (startRoutes.length === 0 || endRoutes.length === 0) {
            return NextResponse.json({ error: 'No routes available for 2-jeep journey' }, { status: 404 });
        }

        // Step 3: Find intersecting route pairs
        const multiRouteOptions = [];

        for (const startRoute of startRoutes) {
            for (const endRoute of endRoutes) {
                // Skip if it's the same route (would be a single route)
                if (startRoute.id === endRoute.id) continue;

                // Find intersection points between the two routes
                const intersectionQuery = await supabase.rpc('find_route_intersections', {
                    route1_id: startRoute.id,
                    route2_id: endRoute.id,
                    max_distance: 50 // meters between routes to consider intersection
                });

                if (intersectionQuery.error) {
                    console.error('Error finding intersections:', intersectionQuery.error);
                    continue;
                }

                const intersections = intersectionQuery.data || [];
                
                if (intersections.length > 0) {
                    // Use the first intersection as transfer point
                    const transferPoint = intersections[0];
                    
                    // Get route segments from start to transfer and transfer to end
                    const firstSegmentQuery = await supabase.rpc('get_route_segment', {
                        route_id: startRoute.id,
                        start_lat: from.latitude,
                        start_lon: from.longitude,
                        end_lat: transferPoint.latitude,
                        end_lon: transferPoint.longitude
                    });

                    const secondSegmentQuery = await supabase.rpc('get_route_segment', {
                        route_id: endRoute.id,
                        start_lat: transferPoint.latitude,
                        start_lon: transferPoint.longitude,
                        end_lat: to.latitude,
                        end_lon: to.longitude
                    });

                    if (firstSegmentQuery.data && secondSegmentQuery.data) {
                        const firstCoords = firstSegmentQuery.data.coordinates;
                        const secondCoords = secondSegmentQuery.data.coordinates;
                        
                        // Calculate distances and fares
                        const firstDistance = firstSegmentQuery.data.distance_meters || 0;
                        const secondDistance = secondSegmentQuery.data.distance_meters || 0;
                        const totalDistance = firstDistance + secondDistance;
                        
                        const firstFare = calculateFare(firstDistance);
                        const secondFare = calculateFare(secondDistance);
                        const totalFare = firstFare + secondFare;

                        // Combine coordinates for the full route
                        const combinedCoords = [...firstCoords, ...secondCoords];

                        multiRouteOptions.push({
                            routeId: `${startRoute.route_id}->${endRoute.route_id}`,
                            routeName: `${startRoute.route_name} → ${endRoute.route_name}`,
                            routeColor: '#FF6B6B', // Red for transfers
                            distance: totalDistance,
                            fare: totalFare,
                            latLng: combinedCoords,
                            isTransfer: true,
                            firstRoute: {
                                routeId: startRoute.route_id,
                                routeName: startRoute.route_name,
                                coordinates: firstCoords,
                                fare: firstFare,
                                distance: firstDistance
                            },
                            secondRoute: {
                                routeId: endRoute.route_id,
                                routeName: endRoute.route_name,
                                coordinates: secondCoords,
                                fare: secondFare,
                                distance: secondDistance
                            },
                            transferPoint: transferPoint,
                            totalFare: totalFare
                        });
                    }
                }
            }
        }

        // Sort by total distance
        multiRouteOptions.sort((a, b) => a.distance - b.distance);

        // Return top 5 options
        const topOptions = multiRouteOptions.slice(0, 5);

        console.log(`Found ${multiRouteOptions.length} multi-route options, returning top ${topOptions.length}`);

        return NextResponse.json(topOptions);
        
    } catch (error) {
        console.error('Error in multi-route calculation:', error);
        return NextResponse.json(
            { error: 'Failed to calculate multi-routes' },
            { status: 500 }
        );
    }
}