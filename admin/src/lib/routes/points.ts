import type { Coordinate, LngLatPair } from './types';

const LOOP_TOLERANCE = 0.000001;

export function pointLabel(index: number): string {
  return `Point ${index + 1}`;
}

/** Re-label every point as "Point N" by its position. */
export function relabelPoints(points: Coordinate[]): Coordinate[] {
  return points.map((coord, i) => ({ ...coord, label: pointLabel(i) }));
}

/** Convert editor points to the [lng, lat] pairs the map and API expect. */
export function toLngLatPairs(points: Coordinate[]): LngLatPair[] {
  return points.map((coord) => [coord.lng, coord.lat]);
}

/** Convert [lng, lat] pairs into labelled editor points. */
export function fromLngLatPairs(pairs: LngLatPair[]): Coordinate[] {
  return pairs.map((coord, index) => ({ lat: coord[1], lng: coord[0], label: pointLabel(index) }));
}

/** True when the first and last points coincide (within a small tolerance). */
export function isClosedLoop(points: Coordinate[]): boolean {
  if (points.length <= 2) return false;
  const first = points[0];
  const last = points[points.length - 1];
  return (
    Math.abs(first.lat - last.lat) < LOOP_TOLERANCE &&
    Math.abs(first.lng - last.lng) < LOOP_TOLERANCE
  );
}

/** True when the first and last points are exactly equal (as produced by "Close Loop"). */
export function isLoopClosedExactly(points: Coordinate[]): boolean {
  if (points.length <= 2) return false;
  const first = points[0];
  const last = points[points.length - 1];
  return last.lat === first.lat && last.lng === first.lng;
}

export const CLOSED_LOOP_ALERT =
  "This route is a closed loop. You can only add points between existing segments.\n\nTo add a point:\n1. Select an existing point\n2. Click 'Insert' button\n3. Click on the map where you want the new point";

export const CLOSE_LOOP_CONFIRM_MESSAGE = `Once you close the loop:
• You can only add points between existing segments
• You cannot add points at the end of the route
• The route will form a continuous loop

Are you sure you want to close the loop?`;
