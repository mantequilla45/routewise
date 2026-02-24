import { LatLng } from '@/types/GeoTypes';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

/**
 * Snaps a coordinate to the nearest road using Google's Roads API
 * Falls back to original coordinate if API fails
 */
export async function snapToNearestRoad(point: LatLng): Promise<LatLng> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.warn('Google Maps API key not configured, skipping snap to road');
        return point;
    }

    try {
        const url = `https://roads.googleapis.com/v1/nearestRoads?` +
            `points=${point.latitude},${point.longitude}` +
            `&key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn('Roads API request failed:', response.status);
            return point;
        }

        const data = await response.json();
        
        if (data.snappedPoints && data.snappedPoints.length > 0) {
            const snapped = data.snappedPoints[0];
            const snappedPoint: LatLng = {
                latitude: snapped.location.latitude,
                longitude: snapped.location.longitude
            };
            
            // Calculate distance to check if the snap is reasonable (within ~50 meters)
            const distance = calculateDistance(point, snappedPoint);
            if (distance > 0.05) { // More than 50 meters away
                console.warn('Snapped point too far from original, using original');
                return point;
            }
            
            console.log('Successfully snapped to road:', snappedPoint);
            return snappedPoint;
        }
        
        return point;
    } catch (error) {
        console.error('Error snapping to road:', error);
        return point;
    }
}

/**
 * Calculate distance between two points in kilometers
 */
function calculateDistance(point1: LatLng, point2: LatLng): number {
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

/**
 * Alternative: Use Directions API to get a route between two points
 * This ensures the points are on routable roads
 */
export async function getRouteAdjustedPoints(
    pointA: LatLng, 
    pointB: LatLng
): Promise<{ pointA: LatLng; pointB: LatLng }> {
    if (!GOOGLE_MAPS_API_KEY) {
        return { pointA, pointB };
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?` +
            `origin=${pointA.latitude},${pointA.longitude}` +
            `&destination=${pointB.latitude},${pointB.longitude}` +
            `&mode=driving` +
            `&key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        
        if (!response.ok) {
            return { pointA, pointB };
        }

        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const legs = route.legs[0];
            
            // Get the actual start and end locations from the route
            const adjustedPointA: LatLng = {
                latitude: legs.start_location.lat,
                longitude: legs.start_location.lng
            };
            
            const adjustedPointB: LatLng = {
                latitude: legs.end_location.lat,
                longitude: legs.end_location.lng
            };
            
            return { 
                pointA: adjustedPointA, 
                pointB: adjustedPointB 
            };
        }
        
        return { pointA, pointB };
    } catch (error) {
        console.error('Error getting route-adjusted points:', error);
        return { pointA, pointB };
    }
}