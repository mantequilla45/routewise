import { legColor, POLYLINE_WIDTH } from '@/components/Map/LocationSelector/buildPolylines';
import type { GoogleMapsPolyline } from '@/context/map-context';
import { sliceAlong } from '@/lib/tripTracking/progress';
import type { TripProgress } from '@/lib/tripTracking/progress';
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
        // The first stop also carries the trip's time (there's no route bar for trips)
        title:
          i === 0
            ? `Ride ${leg.routeCode} here · ${trip.estimatedMinutes} min`
            : `Wait for ${leg.routeCode} here`,
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

// Walks are thinner than jeep lines, and dashed, so the two read differently. expo-maps has no
// dashed lines, so each walk is drawn as short pieces; sizes are on screen (points on iOS, pixels
// on Android, ~3x denser).
const WALK_WIDTH = Platform.OS === 'ios' ? 3 : 7;
const DASH = Platform.OS === 'ios' ? 6 : 18;
const DASH_GAP = Platform.OS === 'ios' ? 5 : 15;
// Most pieces per walk; zoomed far in on a long walk, the dashes get longer instead
const MAX_DASHES = 150;

const M_PER_DEG = 111_320;

/**
 * Each walk as dashes: pieces DASH long with DASH_GAP between them, on screen. `metersPerUnit`
 * is meters per screen point/pixel at the current zoom.
 */
export function dashed(lines: GoogleMapsPolyline[], metersPerUnit: number): GoogleMapsPolyline[] {
  return lines.flatMap((line) => {
    const [a, b] = line.coordinates ?? [];
    const [lat1, lng1, lat2, lng2] = [a?.latitude, a?.longitude, b?.latitude, b?.longitude];
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return [line];
    const cosLat = Math.cos((lat1 * Math.PI) / 180);
    const total = Math.hypot((lng2 - lng1) * M_PER_DEG * cosLat, (lat2 - lat1) * M_PER_DEG);
    const period = Math.max((DASH + DASH_GAP) * metersPerUnit, total / MAX_DASHES);
    const dash = period * (DASH / (DASH + DASH_GAP));
    if (!total || period >= total) return [line];
    const at = (m: number) => ({
      latitude: lat1 + ((lat2 - lat1) * m) / total,
      longitude: lng1 + ((lng2 - lng1) * m) / total,
    });
    const pieces: GoogleMapsPolyline[] = [];
    for (let m = 0; m < total; m += period) {
      pieces.push({
        ...line,
        id: `${line.id}-${pieces.length}`,
        coordinates: [at(m), at(Math.min(m + dash, total))],
      });
    }
    return pieces;
  });
}

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

// The travelled part of a ride: the jeep's color, faint and thinner, so the way you came stays
// visible without competing with the road ahead.
const TRAIL_ALPHA = '59'; // ~35% opacity, appended to a #RRGGBB color
const TRAIL_WIDTH = Platform.OS === 'ios' ? 3 : 7;

/**
 * Each ride of a tracked trip, split into the trail already covered and the part still ahead:
 * rides behind the rider are all trail, the current ride is split where they are, rides ahead are
 * drawn in full.
 */
export function journeyLines(trip: TripOption, progress: TripProgress): GoogleMapsPolyline[] {
  return trip.legs.flatMap((leg, i) => {
    const color = legColor(i);
    const full = (id: string, coordinates: LatLng[]): GoogleMapsPolyline => ({
      id,
      coordinates,
      color,
      width: POLYLINE_WIDTH,
    });
    const trail = (id: string, coordinates: LatLng[]): GoogleMapsPolyline => ({
      id,
      coordinates,
      color: `${color}${TRAIL_ALPHA}`,
      width: TRAIL_WIDTH,
    });
    if (i < progress.legIndex) return [trail(`journey-${i}-trail`, leg.coordinates)];
    if (i > progress.legIndex || progress.along === null) {
      return [full(`journey-${i}`, leg.coordinates)];
    }
    const behind = sliceAlong(leg.coordinates, 0, progress.along);
    const ahead = sliceAlong(leg.coordinates, progress.along, Infinity);
    return [
      ...(behind.length > 1 ? [trail(`journey-${i}-trail`, behind)] : []),
      ...(ahead.length > 1 ? [full(`journey-${i}`, ahead)] : []),
    ];
  });
}
