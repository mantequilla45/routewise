import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function POST(request: NextRequest) {
    try {
        const { point } = await request.json();
        
        if (!point || !point.latitude || !point.longitude) {
            return NextResponse.json(
                { error: 'Invalid point coordinates' },
                { status: 400 }
            );
        }

        if (!GOOGLE_MAPS_API_KEY) {
            console.warn('Google Maps API key not configured, returning original point');
            return NextResponse.json({
                adjustedPoint: point,
                original: point,
                adjusted: false
            });
        }

        // Use Google Roads API to snap to nearest road
        try {
            const roadsUrl = `https://roads.googleapis.com/v1/nearestRoads?` +
                `points=${point.latitude},${point.longitude}` +
                `&key=${GOOGLE_MAPS_API_KEY}`;

            const roadsResponse = await fetch(roadsUrl);
            
            if (roadsResponse.ok) {
                const roadsData = await roadsResponse.json();
                
                if (roadsData.snappedPoints && roadsData.snappedPoints.length > 0) {
                    const snapped = roadsData.snappedPoints[0];
                    const adjustedPoint = {
                        latitude: snapped.location.latitude,
                        longitude: snapped.location.longitude
                    };
                    
                    // Calculate distance to verify the snap is reasonable
                    const distance = calculateDistance(point, adjustedPoint);
                    
                    // If snapped point is within 100 meters, use it
                    if (distance < 0.1) {
                        console.log('Point snapped to road:', adjustedPoint);
                        return NextResponse.json({
                            adjustedPoint,
                            original: point,
                            adjusted: true,
                            distance: distance * 1000 // Convert to meters
                        });
                    }
                }
            }
        } catch (roadsError) {
            console.error('Roads API error:', roadsError);
        }

        // Fallback: Use Directions API to find nearest routable point
        try {
            // Create a small offset to generate a mini route
            const offsetPoint = {
                latitude: point.latitude + 0.0001,
                longitude: point.longitude
            };

            const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?` +
                `origin=${point.latitude},${point.longitude}` +
                `&destination=${offsetPoint.latitude},${offsetPoint.longitude}` +
                `&mode=driving` +
                `&key=${GOOGLE_MAPS_API_KEY}`;

            const directionsResponse = await fetch(directionsUrl);
            
            if (directionsResponse.ok) {
                const directionsData = await directionsResponse.json();
                
                if (directionsData.routes && directionsData.routes.length > 0) {
                    const route = directionsData.routes[0];
                    const leg = route.legs[0];
                    
                    // Use the start location from the route
                    const adjustedPoint = {
                        latitude: leg.start_location.lat,
                        longitude: leg.start_location.lng
                    };
                    
                    console.log('Point adjusted via Directions API:', adjustedPoint);
                    return NextResponse.json({
                        adjustedPoint,
                        original: point,
                        adjusted: true,
                        method: 'directions'
                    });
                }
            }
        } catch (directionsError) {
            console.error('Directions API error:', directionsError);
        }

        // If all else fails, return the original point
        return NextResponse.json({
            adjustedPoint: point,
            original: point,
            adjusted: false
        });

    } catch (error) {
        console.error('Error adjusting to road:', error);
        return NextResponse.json(
            { error: 'Failed to adjust point to road' },
            { status: 500 }
        );
    }
}

interface Point {
    latitude: number;
    longitude: number;
}

function calculateDistance(point1: Point, point2: Point): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}