import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';

interface RoutePoint {
    route_id: string;
    route_code: string;
    point_index: number;
    latitude: number;
    longitude: number;
    distance: number;
}

export async function POST(request: NextRequest) {
    try {
        const { latitude, longitude, maxDistance = 0.5 } = await request.json();
        
        if (!latitude || !longitude) {
            return NextResponse.json(
                { error: 'Latitude and longitude are required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        
        // Query to find the nearest point on any route
        // Uses PostGIS to calculate distance and find nearest points
        const { data, error } = await supabase.rpc('find_nearest_route_points', {
            lat: latitude,
            lng: longitude,
            max_distance_km: maxDistance
        });

        if (error) {
            console.error('Error finding nearest route points:', error);
            
            // Fallback: Do a simpler query if the RPC doesn't exist
            const { data: routes, error: routesError } = await supabase
                .from('routes')
                .select('id, route_code, route_path');

            if (routesError) {
                return NextResponse.json(
                    { error: 'Failed to find nearest route points' },
                    { status: 500 }
                );
            }

            // Find nearest point manually
            let nearestPoint: RoutePoint | null = null;
            let minDistance = Infinity;

            routes?.forEach(route => {
                if (route.route_path && Array.isArray(route.route_path)) {
                    route.route_path.forEach((point: unknown, index: number) => {
                        if (Array.isArray(point) && point.length >= 2) {
                            const pointLat = point[1];
                            const pointLng = point[0];
                            
                            // Calculate distance using Haversine formula
                            const distance = calculateDistance(
                                latitude,
                                longitude,
                                pointLat,
                                pointLng
                            );

                            if (distance < minDistance && distance <= maxDistance) {
                                minDistance = distance;
                                nearestPoint = {
                                    route_id: route.id,
                                    route_code: route.route_code,
                                    point_index: index,
                                    latitude: pointLat,
                                    longitude: pointLng,
                                    distance
                                };
                            }
                        }
                    });
                }
            });

            if (!nearestPoint) {
                return NextResponse.json({
                    found: false,
                    original: { latitude, longitude },
                    message: 'No route points found within maximum distance'
                });
            }

            const foundPoint = nearestPoint as RoutePoint;
            return NextResponse.json({
                found: true,
                original: { latitude, longitude },
                nearest: foundPoint,
                snapped: foundPoint.distance < 0.05 // Snap if within 50 meters
            });
        }

        // Process RPC result
        if (!data || data.length === 0) {
            return NextResponse.json({
                found: false,
                original: { latitude, longitude },
                message: 'No route points found within maximum distance'
            });
        }

        const nearest = data[0];
        return NextResponse.json({
            found: true,
            original: { latitude, longitude },
            nearest: {
                route_id: nearest.route_id,
                route_code: nearest.route_code,
                point_index: nearest.point_index,
                latitude: nearest.point_lat,
                longitude: nearest.point_lng,
                distance: nearest.distance_km
            },
            snapped: nearest.distance_km < 0.05 // Snap if within 50 meters
        });

    } catch (error) {
        console.error('Error in nearest-point API:', error);
        return NextResponse.json(
            { error: 'Failed to find nearest point' },
            { status: 500 }
        );
    }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}