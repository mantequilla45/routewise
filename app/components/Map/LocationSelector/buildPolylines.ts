import { LatLng, MappedGeoRouteResult } from '@/types/GeoTypes';
import { GoogleMapsPolyline } from 'expo-maps/build/google/GoogleMaps.types';

const POLYLINE_WIDTH = 16;
const FIRST_SEGMENT_COLOR = '#4CAF50'; // Green for first segment
const SECOND_SEGMENT_COLOR = '#FF6B6B'; // Red for second segment
const DEFAULT_COLOR = '#33ff00'; // Default green

/** Sort routes by distance, shortest first. Routes without a distance sort last. */
export function sortRoutesByDistance(routes: MappedGeoRouteResult[]): MappedGeoRouteResult[] {
  return [...routes].sort((a, b) => {
    const distA = a.distanceMeters || Number.MAX_VALUE;
    const distB = b.distanceMeters || Number.MAX_VALUE;
    return distA - distB;
  });
}

function toPolyline(id: string, coordinates: LatLng[], color: string): GoogleMapsPolyline {
  return {
    id,
    coordinates: coordinates.map((coord) => ({
      latitude: coord.latitude,
      longitude: coord.longitude,
    })),
    color,
    width: POLYLINE_WIDTH,
    geodesic: true,
  };
}

/**
 * Build one polyline per route (two for transfer routes), ids keyed on the result index so
 * `route_${index}` / `route_${index}_first|second` can be looked up later. Routes with no
 * coordinates still get an empty polyline so indices stay aligned with the results list.
 */
export function buildPolylines(sortedRoutes: MappedGeoRouteResult[]): GoogleMapsPolyline[] {
  const polylines: GoogleMapsPolyline[] = [];

  sortedRoutes.forEach((r, resultIndex) => {
    const isTransfer = 'isTransfer' in r && r.isTransfer === true;

    if (isTransfer && r.firstRoute && r.secondRoute) {
      if (r.firstRoute.coordinates && r.firstRoute.coordinates.length > 0) {
        polylines.push(
          toPolyline(`route_${resultIndex}_first`, r.firstRoute.coordinates, FIRST_SEGMENT_COLOR),
        );
      }

      if (r.secondRoute.coordinates && r.secondRoute.coordinates.length > 0) {
        polylines.push(
          toPolyline(
            `route_${resultIndex}_second`,
            r.secondRoute.coordinates,
            SECOND_SEGMENT_COLOR,
          ),
        );
      }
    } else if ((r.latLng && r.latLng.length > 0) || (r.coordinates && r.coordinates.length > 0)) {
      // Single route polyline - handle both latLng and coordinates formats
      const routeCoords = r.coordinates ?? r.latLng ?? [];
      polylines.push(toPolyline(`route_${resultIndex}`, routeCoords, DEFAULT_COLOR));
    } else {
      // Push empty polyline to maintain index consistency
      polylines.push(toPolyline(`route_${resultIndex}_empty`, [], DEFAULT_COLOR));
    }
  });

  return polylines;
}
