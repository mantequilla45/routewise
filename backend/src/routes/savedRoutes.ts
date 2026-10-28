import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { requireAuth, type AuthVariables } from '../middleware/auth';

export const savedRoutes = new Hono<{ Variables: AuthVariables }>();

savedRoutes.use('*', requireAuth);

savedRoutes.get('/', async (c) => {
  const { data, error } = await supabaseAdmin
    .from('saved_routes')
    .select('*')
    .eq('user_id', c.get('profile').id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved routes:', error);
    return c.json({ error: 'Failed to load saved routes' }, 500);
  }
  return c.json(data ?? []);
});

savedRoutes.post('/', async (c) => {
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400);

  const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
  if (
    !isNum(body.start_lat) ||
    !isNum(body.start_lng) ||
    !isNum(body.end_lat) ||
    !isNum(body.end_lng)
  ) {
    return c.json({ error: 'start_lat, start_lng, end_lat and end_lng are required numbers' }, 400);
  }

  const row = {
    user_id: c.get('profile').id,
    route_name: typeof body.route_name === 'string' ? body.route_name : 'Direct',
    start_location: typeof body.start_location === 'string' ? body.start_location : 'Pin A',
    end_location: typeof body.end_location === 'string' ? body.end_location : 'Pin B',
    start_lat: body.start_lat,
    start_lng: body.start_lng,
    end_lat: body.end_lat,
    end_lng: body.end_lng,
    jeepney_codes: Array.isArray(body.jeepney_codes) ? body.jeepney_codes : [],
    total_fare: isNum(body.total_fare) ? body.total_fare : null,
    transfer_points: body.transfer_points ?? null,
  };

  const { data, error } = await supabaseAdmin.from('saved_routes').insert(row).select().single();
  if (error) {
    console.error('Error saving route:', error);
    return c.json({ error: 'Failed to save route' }, 500);
  }
  return c.json(data, 201);
});

savedRoutes.delete('/:id', async (c) => {
  const { data, error } = await supabaseAdmin
    .from('saved_routes')
    .delete()
    .eq('id', c.req.param('id'))
    .eq('user_id', c.get('profile').id)
    .select('id');

  if (error) {
    console.error('Error deleting route:', error);
    return c.json({ error: 'Failed to delete route' }, 500);
  }
  if (!data || data.length === 0) {
    return c.json({ error: 'Saved route not found' }, 404);
  }
  return c.body(null, 204);
});
