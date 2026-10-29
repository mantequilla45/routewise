import type { GoogleMapsPolyline } from '@/context/map-context';
import { colors } from '@/theme';
import { LatLng, TripOption } from '@/types/GeoTypes';
import { Platform } from 'react-native';

// Apple Maps measures line width in points, Google Maps in pixels (~3x denser on phones),
// so the same number draws far thicker on iOS.
export const POLYLINE_WIDTH = Platform.OS === 'ios' ? 5 : 12;

// One color per jeep in a trip, in riding order.
const LEG_COLORS = [colors.routePrimary, colors.routeSecondary, colors.origin];

/** Line color of a trip's nth jeep; the route bar's chips use it too. */
export const legColor = (legIndex: number) => LEG_COLORS[legIndex % LEG_COLORS.length];

function toPolyline(id: string, coordinates: LatLng[], color: string): GoogleMapsPolyline {
  return {
    id,
    coordinates: coordinates.map(({ latitude, longitude }) => ({ latitude, longitude })),
    color,
    width: POLYLINE_WIDTH,
    geodesic: true,
  };
}

/** Polyline id prefix for every leg of the trip at `index` in the results list. */
export const tripPolylinePrefix = (index: number) => `route_${index}_`;

/** One polyline per jeep ride, ids `route_<result index>_<leg index>`. */
export function buildPolylines(trips: TripOption[]): GoogleMapsPolyline[] {
  return trips.flatMap((trip, index) =>
    trip.legs.map((leg, legIndex) =>
      toPolyline(`${tripPolylinePrefix(index)}${legIndex}`, leg.coordinates, legColor(legIndex)),
    ),
  );
}
