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
  console.log('🔄 MULTI-ROUTE: Starting 2-jeep calculation');
  console.log('🔄 MULTI-ROUTE: From:', from);
  console.log('🔄 MULTI-ROUTE: To:', to);

  try {
    const data = await api.routes.calculateMulti(from, to);
    console.log('🔄 MULTI-ROUTE SUCCESS: Response data:', data);

    if (Array.isArray(data)) {
      console.log('🔄 MULTI-ROUTE: Found', data.length, '2-jeep route combinations');
      // Mark all results as transfer routes
      return data.map((route) => ({
        ...route,
        isTransfer: true,
      })) as MultiRouteResult[];
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.log('🔄 MULTI-ROUTE ERROR:', error.body);
      return {
        error: error.body.error || 'No 2-jeep routes available',
        warning: error.body.warning,
      };
    }
    console.error('🔄 MULTI-ROUTE FATAL ERROR:', error);
    return {
      error: 'Failed to calculate 2-jeep routes',
      warning: 'Network or calculation error occurred',
    };
  }
}
