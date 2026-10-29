import { LatLng, MappedGeoRouteResult } from '@/types/GeoTypes';
import { api, ApiError } from '@/lib/api';

// firstRoute, secondRoute, transferPoint and totalFare come from MappedGeoRouteResult.
export interface MultiRouteResult extends MappedGeoRouteResult {
  isTransfer: boolean;
}

export async function calculateMultiRoutes(
  from: LatLng,
  to: LatLng,
): Promise<MultiRouteResult[] | { error: string; warning?: string }> {
  try {
    const data = await api.routes.calculateMulti(from, to);

    // Mark all results as transfer routes
    return data.map((route) => ({ ...route, isTransfer: true }));
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        error: error.body.error || 'No 2-jeep routes available',
        warning: error.body.warning,
      };
    }
    console.error('MULTI-ROUTE FATAL ERROR:', error);
    return {
      error: 'Failed to calculate 2-jeep routes',
      warning: 'Network or calculation error occurred',
    };
  }
}
