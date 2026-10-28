import { LatLng } from '@/types/GeoTypes';
import { api } from '@/lib/api';

/**
 * Snaps a coordinate to the nearest route point
 * This ensures we start/end at actual jeepney stops
 */
export async function adjustToNearestRoad(point: LatLng): Promise<LatLng> {
    try {
        // 200 meters max distance to snap
        const data = await api.routes.nearestPoint(point, 0.2);

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
