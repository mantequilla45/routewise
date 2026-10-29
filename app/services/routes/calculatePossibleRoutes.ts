import { api, ApiError } from '@/lib/api';
import { LatLng, TripOption } from '@/types/GeoTypes';

/** Trip options for two points, or an error message to show. */
export default async function calculatePossibleRoutes(
  from: LatLng | null,
  to: LatLng | null,
): Promise<TripOption[] | { error: string }> {
  if (!from || !to) {
    return [];
  }

  try {
    return await api.routes.calculate(from, to);
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.body.error || 'No jeepney trip found between these places' };
    }
    console.error('Route calculation failed:', error);
    return { error: 'Failed to calculate routes' };
  }
}
