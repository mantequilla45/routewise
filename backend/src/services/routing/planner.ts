import { notFound } from '../../lib/http';
import type { LatLng } from '../../types/GeoTypes';
import { MinHeap, sliceLine } from './geometry';
import { getNetwork, type Network, type Node } from './network';

/**
 * Trip planner: shortest path over the jeepney network (see network.ts), scored in minutes.
 * Handles one, two or three jeeps the same way, follows each route's direction of travel, and
 * never rides further than it needs to (which also fixes overshooting on loop routes).
 */

// Scoring, in meters per minute: walking ~5 km/h, a jeepney in city traffic ~15 km/h.
const WALK_M_PER_MIN = 83;
const JEEP_M_PER_MIN = 250;
// Minutes added per transfer: waiting for the next jeep, and to prefer fewer transfers.
const TRANSFER_PENALTY_MIN = 5;
// Farthest walk from a pin to where a jeep can be boarded or left.
const ACCESS_RADIUS_M = 500;
const MAX_TRANSFERS = 2;
// Shortest ride worth taking before getting off (to transfer or at the destination). Without
// it, a one-stop hop can stand in for a longer walk: ride 100 m for ₱13 just to get within
// transfer range of another jeep.
const MIN_RIDE_M = 400;
const MAX_OPTIONS = 5;
// Searches allowed to fill MAX_OPTIONS, since padded trips (below) are thrown away.
const MAX_SEARCHES = 10;

/**
 * True when `trip` is `other` with extra jeeps added: every jeep of the shorter `other` is in
 * `trip`. E.g. "07B → 06H" when you can walk to 06H directly: more fare and a transfer for
 * nothing, so it isn't a real alternative.
 */
const isPadded = (trip: TripOption, other: TripOption) =>
  other.legs.length < trip.legs.length &&
  other.legs.every((leg) => trip.legs.some((l) => l.routeId === leg.routeId));

// Fare per jeep: ₱13 minimum, otherwise ₱2.20 per km, rounded up.
const MINIMUM_FARE = 13;
const FARE_PER_KM = 2.2;
export const fareFor = (meters: number) =>
  Math.max(MINIMUM_FARE, Math.ceil((meters / 1000) * FARE_PER_KM));

export interface Leg {
  routeId: string;
  routeCode: string;
  routeName: string;
  coordinates: LatLng[];
  distance: number; // meters ridden
  fare: number;
  boardAt: LatLng;
  alightAt: LatLng;
}

export interface TripOption {
  routeId: string;
  routeCode: string;
  routeName: string;
  legs: Leg[];
  isTransfer: boolean;
  coordinates: LatLng[]; // all legs, for single-polyline consumers
  distance: number; // meters ridden, all legs
  fare: number;
  totalFare: number;
  boardingWalk: number; // start pin -> first jeep
  alightingWalk: number; // last jeep -> destination pin
  transferWalks: number[]; // between jeeps
  estimatedMinutes: number;
  // Two-jeep fields kept for the app's existing transfer display
  firstRoute?: Leg;
  secondRoute?: Leg;
  transferPoint?: LatLng;
}

// How a node was reached during the search.
type Step =
  | { kind: 'board'; walk: number } // from the start pin
  | { kind: 'ride'; from: number }
  | { kind: 'transfer'; from: number; walk: number };

const DESTINATION = -1;

/** One shortest-path search; `bannedFirst` routes can't be boarded at the start. */
function search(
  net: Network,
  from: LatLng,
  egress: Map<number, number>,
  bannedFirst: Set<number>,
): { node: number; cost: number; steps: (Step | undefined)[] } | null {
  const cost = new Float64Array(net.nodes.length).fill(Infinity);
  const transfersUsed = new Uint8Array(net.nodes.length);
  const ridden = new Float64Array(net.nodes.length); // meters on the current jeep so far
  const steps: (Step | undefined)[] = new Array(net.nodes.length);
  const heap = new MinHeap<number>();
  let bestDestination = { node: -1, cost: Infinity };

  for (const { item, distance } of net.index.within(from, ACCESS_RADIUS_M)) {
    if (bannedFirst.has(item.route)) continue;
    const c = distance / WALK_M_PER_MIN;
    if (c < cost[item.id]) {
      cost[item.id] = c;
      ridden[item.id] = 0;
      steps[item.id] = { kind: 'board', walk: distance };
      heap.push(c, item.id);
    }
  }

  while (heap.size > 0) {
    const { key, value: id } = heap.pop()!;
    if (id === DESTINATION) break;
    if (key > cost[id]) continue; // stale entry
    if (key >= bestDestination.cost) break;

    const walkOut = egress.get(id);
    if (walkOut !== undefined && ridden[id] >= MIN_RIDE_M) {
      const total = key + walkOut / WALK_M_PER_MIN;
      if (total < bestDestination.cost) {
        bestDestination = { node: id, cost: total };
        heap.push(total, DESTINATION);
      }
    }

    const node = net.nodes[id];
    if (node.next >= 0) {
      const next = net.nodes[node.next];
      const ride = next.at >= node.at ? next.at - node.at : 0; // loop wrap: same point
      const c = key + ride / JEEP_M_PER_MIN;
      if (c < cost[next.id]) {
        cost[next.id] = c;
        transfersUsed[next.id] = transfersUsed[id];
        ridden[next.id] = ridden[id] + ride;
        steps[next.id] = { kind: 'ride', from: id };
        heap.push(c, next.id);
      }
    }

    // Transfer only after a real ride: never straight after boarding or after a short hop
    if (transfersUsed[id] < MAX_TRANSFERS && ridden[id] >= MIN_RIDE_M) {
      for (const t of net.transfers[id]) {
        const c = key + t.walk / WALK_M_PER_MIN + TRANSFER_PENALTY_MIN;
        if (c < cost[t.to]) {
          cost[t.to] = c;
          transfersUsed[t.to] = transfersUsed[id] + 1;
          ridden[t.to] = 0;
          steps[t.to] = { kind: 'transfer', from: id, walk: t.walk };
          heap.push(c, t.to);
        }
      }
    }
  }

  return bestDestination.node >= 0
    ? { node: bestDestination.node, cost: bestDestination.cost, steps }
    : null;
}

/** Turn the search's back-pointers into legs: runs of nodes on the same route. */
function toTrip(
  net: Network,
  last: number,
  steps: (Step | undefined)[],
  alightingWalk: number,
  minutes: number,
): TripOption {
  // Walk back from the last node to the boarding node
  const path: Node[] = [];
  const joins: { kind: Step['kind']; walk: number }[] = [];
  for (let id = last; ;) {
    path.unshift(net.nodes[id]);
    const step = steps[id]!;
    joins.unshift({ kind: step.kind, walk: step.kind === 'ride' ? 0 : step.walk });
    if (step.kind === 'board') break;
    id = step.from;
  }

  const legs: Leg[] = [];
  const transferWalks: number[] = [];
  let start = 0;
  for (let i = 1; i <= path.length; i++) {
    if (i < path.length && joins[i].kind === 'ride') continue;
    const board = path[start];
    const alight = path[i - 1];
    const route = net.routes[board.route];
    const distance =
      alight.at >= board.at ? alight.at - board.at : route.length - board.at + alight.at;
    legs.push({
      routeId: route.id,
      routeCode: route.code,
      routeName: route.name,
      coordinates: sliceLine(route.line, route.cum, board.at, alight.at, route.isLoop),
      distance,
      fare: fareFor(distance),
      boardAt: { latitude: board.latitude, longitude: board.longitude },
      alightAt: { latitude: alight.latitude, longitude: alight.longitude },
    });
    if (i < path.length) transferWalks.push(Math.round(joins[i].walk));
    start = i;
  }

  const fare = legs.reduce((sum, leg) => sum + leg.fare, 0);
  return {
    routeId: legs.map((l) => l.routeId).join('+'),
    routeCode: legs.map((l) => l.routeCode).join(' → '),
    routeName: legs.map((l) => l.routeName).join(' → '),
    legs,
    isTransfer: legs.length > 1,
    coordinates: legs.flatMap((l) => l.coordinates),
    distance: legs.reduce((sum, leg) => sum + leg.distance, 0),
    fare,
    totalFare: fare,
    boardingWalk: Math.round(joins[0].walk),
    alightingWalk: Math.round(alightingWalk),
    transferWalks,
    estimatedMinutes: Math.round(minutes),
    ...(legs.length === 2 && {
      firstRoute: legs[0],
      secondRoute: legs[1],
      transferPoint: legs[1].boardAt,
    }),
  };
}

/**
 * Up to MAX_OPTIONS trips from `from` to `to`, fastest first. Each further option boards a
 * different first jeep, so the list offers real alternatives rather than tiny variations.
 */
export async function planTrips(from: LatLng, to: LatLng): Promise<TripOption[]> {
  const net = await getNetwork();

  const egress = new Map<number, number>();
  for (const { item, distance } of net.index.within(to, ACCESS_RADIUS_M)) {
    egress.set(item.id, distance);
  }
  if (egress.size === 0) {
    throw notFound('No jeepney route passes within 500 m of your destination');
  }
  if (net.index.within(from, ACCESS_RADIUS_M).length === 0) {
    throw notFound('No jeepney route passes within 500 m of your starting point');
  }

  const options: TripOption[] = [];
  const seen = new Set<string>();
  const bannedFirst = new Set<number>();
  for (let i = 0; i < MAX_SEARCHES && options.length < MAX_OPTIONS; i++) {
    const found = search(net, from, egress, bannedFirst);
    if (!found) break;
    const trip = toTrip(net, found.node, found.steps, egress.get(found.node)!, found.cost);
    if (!seen.has(trip.routeId) && !options.some((o) => isPadded(trip, o))) {
      seen.add(trip.routeId);
      options.push(trip);
    }
    const firstRoute = net.routes.findIndex((r) => r.id === trip.legs[0].routeId);
    bannedFirst.add(firstRoute);
  }

  if (options.length === 0) {
    throw notFound('No jeepney trip found between these places', {
      debugInfo: { reason: 'no path with up to 3 jeeps' },
    });
  }
  // A shorter trip found later can pad out one found earlier. Searches run cheapest-first, but
  // the first-jeep bans can surface a faster later option.
  return options
    .filter((trip) => !options.some((o) => isPadded(trip, o)))
    .sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);
}
