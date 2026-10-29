import { query } from '../../lib/db';
import { log } from '../../lib/log';
import type { LatLng } from '../../types/GeoTypes';
import { cumulativeDistances, GridIndex, metersBetween, pointAt } from './geometry';

/**
 * The jeepney network as a graph. Every route is sampled into points ("nodes") a fixed
 * distance apart, in its direction of travel. Riding moves from a node to the next one on the
 * same route; a transfer walks from a node to a nearby node on another route. Jeepneys stop
 * anywhere, so any node is a place to board or get off.
 */

export const NODE_SPACING_M = 75;
// Longest walk between two routes that counts as a transfer.
export const TRANSFER_RADIUS_M = 200;
// A line whose ends are this close is a loop: the ride continues from its start.
const LOOP_GAP_M = 100;
// Rebuild at least this often so instances pick up route edits made elsewhere.
const MAX_AGE_MS = 10 * 60 * 1000;

export interface Route {
  id: string;
  code: string;
  name: string;
  line: LatLng[];
  cum: number[]; // cumulative meters along `line`
  length: number;
  isLoop: boolean;
}

export interface Node extends LatLng {
  id: number;
  route: number; // index into Network.routes
  at: number; // meters along the route's line
  next: number; // next node id on the same route, -1 at the end of an open line
}

export interface Transfer {
  to: number; // node id on another route
  walk: number; // meters
}

export interface Network {
  routes: Route[];
  nodes: Node[];
  transfers: Transfer[][]; // by node id
  index: GridIndex<Node>;
  builtAt: number;
}

let cached: Network | null = null;
let building: Promise<Network> | null = null;

/** Drop the cached network; the next search rebuilds it (call after routes change). */
export function invalidateNetwork() {
  cached = null;
}

export async function getNetwork(): Promise<Network> {
  if (cached && Date.now() - cached.builtAt < MAX_AGE_MS) return cached;
  // Concurrent requests share one build
  building ??= buildNetwork().finally(() => {
    building = null;
  });
  cached = await building;
  return cached;
}

async function loadRoutes(): Promise<Route[]> {
  const rows = await query<{ id: string; route_code: string; route_name: string; geojson: string }>(
    `SELECT id, route_code, CONCAT(start_point_name, ' - ', end_point_name) as route_name,
            ST_AsGeoJSON(geom_forward) as geojson
     FROM jeepney_routes
     WHERE geom_forward IS NOT NULL`,
  );

  return rows.flatMap((row) => {
    const geo = JSON.parse(row.geojson) as { type: string; coordinates: number[][] };
    if (geo.type !== 'LineString' || geo.coordinates.length < 2) return [];
    const line = geo.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
    const cum = cumulativeDistances(line);
    return [
      {
        id: row.id,
        code: row.route_code,
        name: row.route_name,
        line,
        cum,
        length: cum[cum.length - 1],
        isLoop: metersBetween(line[0], line[line.length - 1]) < LOOP_GAP_M,
      },
    ];
  });
}

async function buildNetwork(): Promise<Network> {
  const started = Date.now();
  const routes = await loadRoutes();
  const nodes: Node[] = [];
  const index = new GridIndex<Node>(TRANSFER_RADIUS_M);

  routes.forEach((route, r) => {
    const count = Math.max(2, Math.ceil(route.length / NODE_SPACING_M) + 1);
    const first = nodes.length;
    for (let k = 0; k < count; k++) {
      const at = Math.min(route.length, k * NODE_SPACING_M);
      const node: Node = {
        id: nodes.length,
        route: r,
        at,
        next: -1,
        ...pointAt(route.line, route.cum, at),
      };
      nodes.push(node);
      index.add(node);
    }
    for (let id = first; id < nodes.length - 1; id++) nodes[id].next = id + 1;
    // A loop's last node is its first point again; ride on from the start
    if (route.isLoop) nodes[nodes.length - 1].next = first;
  });

  // For each node, the closest node of every other route within walking distance
  const transfers: Transfer[][] = nodes.map((node) => {
    const nearestPerRoute = new Map<number, Transfer>();
    for (const { item, distance } of index.within(node, TRANSFER_RADIUS_M)) {
      if (item.route === node.route) continue;
      const best = nearestPerRoute.get(item.route);
      if (!best || distance < best.walk)
        nearestPerRoute.set(item.route, { to: item.id, walk: distance });
    }
    return [...nearestPerRoute.values()];
  });

  const edgeCount = transfers.reduce((n, t) => n + t.length, 0);
  log.info(
    `Routing network: ${routes.length} routes, ${nodes.length} nodes, ${edgeCount} transfer links (${Date.now() - started} ms)`,
  );
  return { routes, nodes, transfers, index, builtAt: Date.now() };
}
