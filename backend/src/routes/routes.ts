import { Hono } from 'hono';
import type { LatLng } from '../types/GeoTypes';
import { calculateRoutes } from '../services/routing/calculateRoutes';
import { calculateMultiRoutes } from '../services/routing/calculateMultiRoutes';
import {
  findNearestRoutePoint,
  getRouteForDisplay,
  listRoutes,
} from '../services/routing/routeQueries';

export const routes = new Hono();

function parseLatLng(value: unknown): LatLng | null {
  const v = value as Record<string, unknown> | null;
  if (!v || typeof v.latitude !== 'number' || typeof v.longitude !== 'number') return null;
  if (!Number.isFinite(v.latitude) || !Number.isFinite(v.longitude)) return null;
  return { latitude: v.latitude, longitude: v.longitude };
}

async function parseFromTo(c: { req: { json: () => Promise<unknown> } }) {
  const body = ((await c.req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  const from = parseLatLng(body.from);
  const to = parseLatLng(body.to);
  return from && to ? { from, to } : null;
}

routes.get('/', async (c) => {
  return c.json(await listRoutes());
});

routes.get('/:id', async (c) => {
  return c.json(await getRouteForDisplay(c.req.param('id')));
});

routes.post('/nearest-point', async (c) => {
  const body = ((await c.req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  const point = parseLatLng(body);
  if (!point) return c.json({ error: 'Latitude and longitude are required' }, 400);

  const maxDistance = typeof body.maxDistance === 'number' ? body.maxDistance : 50;
  return c.json(await findNearestRoutePoint(point, maxDistance));
});

routes.post('/calculate', async (c) => {
  const coords = await parseFromTo(c);
  if (!coords) return c.json({ error: 'Missing coordinates' }, 400);
  return c.json(await calculateRoutes(coords.from, coords.to));
});

routes.post('/calculate-multi', async (c) => {
  const coords = await parseFromTo(c);
  if (!coords) return c.json({ error: 'Missing coordinates' }, 400);
  return c.json(await calculateMultiRoutes(coords.from, coords.to));
});
