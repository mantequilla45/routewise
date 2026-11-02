import type { LatLng } from '@/types/GeoTypes';
import { headingAlong, metersBetween, pointAlong } from './progress';
import type { ActiveTrip } from './tracker';

// The camera centers this far ahead of the rider, so they sit low on the screen with the way
// ahead filling the view above them.
const LOOK_AHEAD_M = 150;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Degrees clockwise from north, from `a` toward `b`. */
function bearing(a: LatLng, b: LatLng): number {
  const dx = (b.longitude - a.longitude) * Math.cos(toRad(a.latitude));
  const dy = b.latitude - a.latitude;
  return ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
}

/** The point `meters` from `from` in direction `deg` (flat approximation). */
function offset(from: LatLng, deg: number, meters: number): LatLng {
  const d = meters / 111320;
  return {
    latitude: from.latitude + d * Math.cos(toRad(deg)),
    longitude: from.longitude + (d * Math.sin(toRad(deg))) / Math.cos(toRad(from.latitude)),
  };
}

/**
 * Navigation camera for a tracked trip: rotated to the direction of travel and centered ahead of
 * the rider. Riding, it follows the jeep's line; walking, it points at where they're walking to
 * (the stop to board, or the destination after the last ride). Null before the first fix.
 */
export function journeyCamera({
  trip,
  progress,
  position,
  destination,
}: ActiveTrip): { center: LatLng; bearing: number } | null {
  if (!position) return null;
  const leg = trip.legs[progress.legIndex];

  if (progress.along !== null) {
    return {
      center: pointAlong(leg.coordinates, progress.along + LOOK_AHEAD_M),
      bearing: headingAlong(leg.coordinates, progress.along),
    };
  }

  const gotOff = progress.alerted[progress.legIndex] && progress.boarded[progress.legIndex];
  const target = gotOff
    ? (trip.legs[progress.legIndex + 1]?.boardAt ?? destination)
    : (leg.boardAt ?? leg.coordinates[0] ?? destination);
  // Close to the target the direction swings wildly; keep north up there
  const deg = metersBetween(position, target) > 25 ? bearing(position, target) : 0;
  return { center: offset(position, deg, LOOK_AHEAD_M / 2), bearing: deg };
}
