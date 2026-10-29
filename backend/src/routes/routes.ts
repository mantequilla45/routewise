import { Hono } from 'hono';
import { listRoutesWithGeometry } from '../services/admin/routes';
import type { LatLng } from '../types/GeoTypes';
import { planTrips } from '../services/routing/planner';
import { getRouteForDisplay, listRoutes } from '../services/routing/routeQueries';

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

// Full rows with geometry, for the admin browse page. Route data is public.
routes.get('/catalog', async (c) =>
  c.json({ success: true, routes: await listRoutesWithGeometry() }),
);

routes.get('/:id', async (c) => {
  return c.json(await getRouteForDisplay(c.req.param('id')));
});

routes.post('/calculate', async (c) => {
  const coords = await parseFromTo(c);
  if (!coords) return c.json({ error: 'Missing coordinates' }, 400);
  return c.json(await planTrips(coords.from, coords.to));
});
