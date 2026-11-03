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
// Within this of the destination pin: arrived, whichever step the tracker thinks they're on.
const ARRIVED_M = 75;
// A missed transfer: this far off the current jeep's line, on a later jeep's line and this far
// into its ride. Routes share roads, so being near another line alone proves nothing.
const LEFT_ROUTE_M = 150;
const INTO_LATER_RIDE_M = 100;

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
  boarded: boolean[]; // per leg: detected riding it (moving at jeep speed along its line)
  alerted: boolean[]; // per leg: the "get off soon" alert was sent
  remaining: number | null; // meters of ride left on the current jeep, null if not riding it
  along: number | null; // meters into the current ride, null if not riding it (for the trail)
  arrived: boolean;
  // Boarding detection: consecutive fast fixes on the line, and where on the line the rider
  // was first seen (a slow-GPS fallback)
  fastFixes: number;
  onLineFrom: number | null;
  last: { position: LatLng; time: number } | null;
}

/** One location update: where, when (ms), and the device's speed in m/s if it has one. */
export interface Fix {
  position: LatLng;
  time: number;
  speed?: number | null;
}

export interface TripAlert {
  title: string;
  body: string;
}

export const initialProgress = (trip: TripOption): TripProgress => ({
  legIndex: 0,
  boarded: trip.legs.map(() => false),
  alerted: trip.legs.map(() => false),
  remaining: null,
  along: null,
  arrived: false,
  fastFixes: 0,
  onLineFrom: null,
  last: null,
});

// Riding, not walking: faster than ~12.6 km/h (walking is ~5) along the jeep's line, on this many
// fixes in a row so one GPS jump doesn't count.
const BOARD_SPEED_MPS = 3.5;
const BOARD_FIXES = 2;
// Without usable speed, this far along the line since first reaching it also means riding.
const BOARD_DISTANCE_M = 600;

/** Speed for this fix: the device's own if valid, else distance over time since the last one. */
export function speedOf(fix: Fix, last: TripProgress['last']): number | null {
  if (fix.speed != null && fix.speed >= 0) return fix.speed;
  if (!last) return null;
  const seconds = (fix.time - last.time) / 1000;
  if (seconds <= 0 || seconds > 60) return null;
  return metersBetween(last.position, fix.position) / seconds;
}

/** Progress after a new location fix, and any alerts that became due. */
export function advance(
  trip: TripOption,
  destination: LatLng,
  progress: TripProgress,
  fix: Fix,
): { progress: TripProgress; alerts: TripAlert[] } {
  if (progress.arrived) return { progress, alerts: [] };
  const { position } = fix;
  const alerts: TripAlert[] = [];
  let { legIndex, fastFixes, onLineFrom } = progress;
  const alerted = [...progress.alerted];
  const boarded = [...progress.boarded];
  const lastLeg = trip.legs.length - 1;
  const last = { position, time: fix.time };

  // Arrival finishes the trip from any step, so a missed transfer can't keep it running
  if (metersBetween(position, destination) <= ARRIVED_M) {
    return {
      progress: { ...progress, alerted, boarded, remaining: 0, arrived: true, last },
      alerts: [{ title: "You've arrived", body: 'You are at your destination. Trip ended.' }],
    };
  }

  // Catch up after a missed transfer: clearly off this jeep's line and riding a later one
  if (projectOnLine(trip.legs[legIndex].coordinates, position).away > LEFT_ROUTE_M) {
    for (let j = lastLeg; j > legIndex; j--) {
      const later = projectOnLine(trip.legs[j].coordinates, position);
      if (later.away <= ON_ROUTE_M && later.along >= INTO_LATER_RIDE_M) {
        for (let k = legIndex; k < j; k++) alerted[k] = true; // rides behind: no alerts
        legIndex = j;
        fastFixes = 0;
        onLineFrom = null;
        break;
      }
    }
  }

  const leg = trip.legs[legIndex];
  const here = projectOnLine(leg.coordinates, position);
  const remaining = Math.max(0, lineLength(leg.coordinates) - here.along);
  const onLine = here.away <= ON_ROUTE_M;

  // Boarding: moving at jeep speed along the line, or well along it since first reaching it
  if (!boarded[legIndex]) {
    const speed = speedOf(fix, progress.last);
    fastFixes = onLine && speed !== null && speed >= BOARD_SPEED_MPS ? fastFixes + 1 : 0;
    if (onLine && onLineFrom === null) onLineFrom = here.along;
    if (!onLine) onLineFrom = null;
    const farAlong = onLineFrom !== null && here.along - onLineFrom >= BOARD_DISTANCE_M;
    if (fastFixes >= BOARD_FIXES || farAlong) {
      boarded[legIndex] = true;
      alerts.push({
        title: `You're on ${leg.routeCode}`,
        body: `We'll tell you when it's time to get off.`,
      });
    }
  }
  const riding = boarded[legIndex] && onLine;

  if (riding && !alerted[legIndex] && remaining <= ALERT_BEFORE_M) {
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
  let moved = false;
  if (next && remaining <= ALERT_BEFORE_M) {
    const nextHere = projectOnLine(next.coordinates, position);
    if (nextHere.away <= NEXT_LEG_M && nextHere.away < here.away) {
      alerted[legIndex] = true; // never alert for a ride already behind
      boarded[legIndex] = true;
      legIndex += 1;
      fastFixes = 0;
      onLineFrom = null;
      moved = true;
    }
  }

  const ridingNow = !moved && riding;
  return {
    progress: {
      legIndex,
      boarded,
      alerted,
      remaining: ridingNow ? remaining : null,
      along: ridingNow ? here.along : null,
      arrived: false,
      fastFixes,
      onLineFrom,
      last,
    },
    alerts,
  };
}

const roundTo10 = (m: number) => Math.max(10, Math.round(m / 10) * 10);

/** The part of a line between two distances along it (for the travelled trail). */
export function sliceAlong(line: LatLng[], from: number, to: number): LatLng[] {
  const out: LatLng[] = [];
  let walked = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const length = metersBetween(a, b);
    const end = walked + length;
    const at = (d: number) => {
      const f = length === 0 ? 0 : (d - walked) / length;
      return {
        latitude: a.latitude + (b.latitude - a.latitude) * f,
        longitude: a.longitude + (b.longitude - a.longitude) * f,
      };
    };
    if (end >= from && walked <= to) {
      if (out.length === 0) out.push(walked >= from ? a : at(from));
      out.push(end <= to ? b : at(to));
    }
    walked = end;
  }
  return out;
}

/**
 * Direction of travel in degrees clockwise from north at `distance` along a line, measured over
 * the next ~80 m so small kinks don't swing the map.
 */
export function headingAlong(line: LatLng[], distance: number): number {
  const total = lineLength(line);
  const ahead = sliceAlong(
    line,
    Math.min(distance, Math.max(0, total - 1)),
    Math.min(total, distance + 80),
  );
  const a = ahead[0];
  const b = ahead[ahead.length - 1];
  if (!a || !b) return 0;
  const dx = (b.longitude - a.longitude) * Math.cos(toRad(a.latitude));
  const dy = b.latitude - a.latitude;
  return ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
}

/** The point `distance` meters along a line (clamped to its ends). */
export function pointAlong(line: LatLng[], distance: number): LatLng {
  const pts = sliceAlong(line, Math.max(0, distance), Math.max(0, distance));
  return pts[0] ?? line[line.length - 1];
}
