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
      return {
        latitude: data.nearest.latitude,
        longitude: data.nearest.longitude,
      };
    }

    return point;
  } catch (error) {
    console.error('Error finding nearest route point, using original:', error);
    return point;
  }
}
