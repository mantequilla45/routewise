import type { LatLng } from '@/types/GeoTypes';
import { headingAlong, metersBetween } from './progress';
import type { ActiveTrip } from './tracker';

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Degrees clockwise from north, from `a` toward `b`. */
function bearing(a: LatLng, b: LatLng): number {
  const dx = (b.longitude - a.longitude) * Math.cos(toRad(a.latitude));
  const dy = b.latitude - a.latitude;
  return ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
}

/**
 * Navigation camera for a tracked trip, like turn-by-turn directions: centered on the rider and
 * rotated so the way ahead points up. Riding, "ahead" is along the jeep's line; walking, it's
 * toward where they're walking to (the stop to board, or the destination after the last ride).
 * Null before the first fix.
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
    return { center: position, bearing: headingAlong(leg.coordinates, progress.along) };
  }

  const gotOff = progress.alerted[progress.legIndex] && progress.boarded[progress.legIndex];
  const target = gotOff
    ? (trip.legs[progress.legIndex + 1]?.boardAt ?? destination)
    : (leg.boardAt ?? leg.coordinates[0] ?? destination);
  // Close to the target the direction swings wildly; keep north up there
  const deg = metersBetween(position, target) > 25 ? bearing(position, target) : 0;
  return { center: position, bearing: deg };
}
