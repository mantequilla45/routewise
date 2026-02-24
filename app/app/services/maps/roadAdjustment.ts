import { LatLng } from '@/types/GeoTypes';

/**
 * Snaps a coordinate to the nearest route point
 * This ensures we start/end at actual jeepney stops
 */
export async function adjustToNearestRoad(point: LatLng): Promise<LatLng> {
    try {
        // Find the nearest point on an actual route
        const response = await fetch("http://10.0.2.2:3000/api/routes/nearest-point", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                latitude: point.latitude,
                longitude: point.longitude,
                maxDistance: 0.2 // 200 meters max distance to snap
            })
        });

        if (!response.ok) {
            console.warn('Nearest point request failed, using original point');
            return point;
        }

        const data = await response.json();
        
        if (data.found && data.snapped && data.nearest) {
            console.log('Point snapped to route point:', {
                original: point,
                snapped: {
                    latitude: data.nearest.latitude,
                    longitude: data.nearest.longitude
                },
                route: data.nearest.route_code,
                distance: `${(data.nearest.distance * 1000).toFixed(0)}m`
            });
            return {
                latitude: data.nearest.latitude,
                longitude: data.nearest.longitude
            };
        }

        console.log('No nearby route point found, using original');
        return point;
    } catch (error) {
        console.error('Error finding nearest route point, using original:', error);
        return point;
    }
}

/**
 * Validates if two points will create a reasonable route
 * Returns adjusted points if needed
 */
export async function validateRoutePoints(
    pointA: LatLng,
    pointB: LatLng
): Promise<{ pointA: LatLng; pointB: LatLng; warning?: string }> {
    try {
        const response = await fetch("http://10.0.2.2:3000/api/validateRoutePoints", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pointA, pointB })
        });

        if (!response.ok) {
            return { pointA, pointB };
        }

        const data = await response.json();
        
        return {
            pointA: data.adjustedPointA || pointA,
            pointB: data.adjustedPointB || pointB,
            warning: data.warning
        };
    } catch (error) {
        console.error('Error validating route points:', error);
        return { pointA, pointB };
    }
}