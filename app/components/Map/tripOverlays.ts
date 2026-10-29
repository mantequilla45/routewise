import type { GoogleMapsPolyline } from '@/context/map-context';
import { colors } from '@/theme';
import { LatLng, TripOption } from '@/types/GeoTypes';
import { Platform } from 'react-native';

export type TripStop = {
  id: string;
  coordinates: LatLng;
  title: string;
  kind: 'board' | 'alight';
};

/**
 * Where to get on and off each jeep of a trip. The first jeep is "Ride", a later one is
 * "Wait for" (you walk there after getting off the previous jeep), and every jeep but the last
 * gets a "Get off" stop. The final drop-off is the destination pin itself.
 */
export function tripStops(trip: TripOption): TripStop[] {
  const stops: TripStop[] = [];
  trip.legs.forEach((leg, i) => {
    if (leg.boardAt) {
      stops.push({
        id: `board-${i}`,
        coordinates: leg.boardAt,
        title: i === 0 ? `Ride ${leg.routeCode} here` : `Wait for ${leg.routeCode} here`,
        kind: 'board',
      });
    }
    if (leg.alightAt && i < trip.legs.length - 1) {
      stops.push({
        id: `alight-${i}`,
        coordinates: leg.alightAt,
        title: `Get off ${leg.routeCode} here`,
        kind: 'alight',
      });
    }
  });
  return stops;
}

// Walks are thinner than jeep lines so the two read differently (no dashes in expo-maps).
const WALK_WIDTH = Platform.OS === 'ios' ? 3 : 7;

/** Straight walking connectors: start pin → first jeep, jeep → jeep, last jeep → destination. */
export function walkLines(
  trip: TripOption,
  start: LatLng | null,
  destination: LatLng | null,
): GoogleMapsPolyline[] {
  const ends: [LatLng | null | undefined, LatLng | null | undefined][] = [
    [start, trip.legs[0]?.boardAt],
    ...trip.legs
      .slice(1)
      .map((leg, i): [LatLng | undefined, LatLng | undefined] => [
        trip.legs[i].alightAt,
        leg.boardAt,
      ]),
    [trip.legs[trip.legs.length - 1]?.alightAt, destination],
  ];
  return ends.flatMap(([from, to], i) =>
    from && to
      ? [
          {
            id: `walk-${i}`,
            coordinates: [from, to],
            color: colors.textTertiary,
            width: WALK_WIDTH,
          },
        ]
      : [],
  );
}
