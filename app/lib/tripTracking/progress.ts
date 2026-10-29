import type { LatLng, TripOption } from '@/types/GeoTypes';

/**
 * Pure trip-progress logic: given the trip and a new position, where the rider is (which jeep,
 * how far until they get off) and which alerts are now due. No I/O, so the background location
 * task and the screen share it.
 */

// Alert this far (along the ride) before the drop-off.
export const ALERT_BEFORE_M = 200;
// Further than this from a jeep's line, the rider isn't on that jeep (still walking, GPS drift).
const ON_ROUTE_M = 60;
// Within this of the next jeep's line, near the end of the current ride: the transfer happened.
const NEXT_LEG_M = 60;
// Within this of the destination pin: arrived.
const ARRIVED_M = 60;

const M_PER_DEG = 111320;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Straight-line meters between two points (flat approximation, fine at city scale). */
export function metersBetween(a: LatLng, b: LatLng): number {
  const dx = (b.longitude - a.longitude) * M_PER_DEG * Math.cos(toRad(a.latitude));
  const dy = (b.latitude - a.latitude) * M_PER_DEG;
  return Math.hypot(dx, dy);
}

export function lineLength(line: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < line.length; i++) total += metersBetween(line[i - 1], line[i]);
  return total;
}

/** Closest point of a line to `p`: meters along the line, and meters away from it. */
export function projectOnLine(line: LatLng[], p: LatLng): { along: number; away: number } {
  let best = { along: 0, away: Infinity };
  let walked = 0;
  const k = M_PER_DEG * Math.cos(toRad(p.latitude));
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    // Local meters with `a` at the origin
    const bx = (b.longitude - a.longitude) * k;
    const by = (b.latitude - a.latitude) * M_PER_DEG;
    const px = (p.longitude - a.longitude) * k;
    const py = (p.latitude - a.latitude) * M_PER_DEG;
    const lengthSq = bx * bx + by * by;
    const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / lengthSq));
    const away = Math.hypot(px - bx * t, py - by * t);
    const length = Math.sqrt(lengthSq);
    if (away < best.away) best = { along: walked + length * t, away };
    walked += length;
  }
  return best;
}

export interface TripProgress {
  legIndex: number; // the jeep the rider is on, or walking to
  alerted: boolean[]; // per leg: the "get off soon" alert was sent
  remaining: number | null; // meters of ride left on the current jeep, null if not on it yet
  arrived: boolean;
}

export interface TripAlert {
  title: string;
  body: string;
}

export const initialProgress = (trip: TripOption): TripProgress => ({
  legIndex: 0,
  alerted: trip.legs.map(() => false),
  remaining: null,
  arrived: false,
});

/** Progress after a new position, and any alerts that became due. */
export function advance(
  trip: TripOption,
  destination: LatLng,
  progress: TripProgress,
  position: LatLng,
): { progress: TripProgress; alerts: TripAlert[] } {
  if (progress.arrived) return { progress, alerts: [] };
  const alerts: TripAlert[] = [];
  let { legIndex } = progress;
  const alerted = [...progress.alerted];
  const lastLeg = trip.legs.length - 1;

  if (legIndex === lastLeg && metersBetween(position, destination) <= ARRIVED_M) {
    return {
      progress: { ...progress, alerted, remaining: 0, arrived: true },
      alerts: [{ title: "You've arrived", body: 'You are at your destination. Trip ended.' }],
    };
  }

  const leg = trip.legs[legIndex];
  const here = projectOnLine(leg.coordinates, position);
  const remaining = Math.max(0, lineLength(leg.coordinates) - here.along);
  const onJeep = here.away <= ON_ROUTE_M;

  if (onJeep && !alerted[legIndex] && remaining <= ALERT_BEFORE_M) {
    alerted[legIndex] = true;
    const next = trip.legs[legIndex + 1];
    alerts.push(
      next
        ? {
            title: `Get ready to get off ${leg.routeCode}`,
            body: `Your transfer is about ${roundTo10(remaining)} m ahead. Next, ride ${next.routeCode}.`,
          }
        : {
            title: 'Your destination is close',
            body: `Get ready to get off ${leg.routeCode} in about ${roundTo10(remaining)} m.`,
          },
    );
  }

  // Moved on to the next jeep: near the end of this ride and close to the next line
  const next = trip.legs[legIndex + 1];
  if (next && remaining <= ALERT_BEFORE_M) {
    const nextHere = projectOnLine(next.coordinates, position);
    if (nextHere.away <= NEXT_LEG_M && nextHere.away < here.away) {
      legIndex += 1;
      alerted[legIndex - 1] = true; // never alert for a ride already behind
    }
  }

  return {
    progress: {
      legIndex,
      alerted,
      remaining: legIndex === progress.legIndex && onJeep ? remaining : null,
      arrived: false,
    },
    alerts,
  };
}

const roundTo10 = (m: number) => Math.max(10, Math.round(m / 10) * 10);
