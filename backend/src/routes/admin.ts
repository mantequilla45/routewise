import { Hono } from 'hono';
import { requireAdmin } from '../middleware/admin';
import type { AuthVariables } from '../middleware/auth';
import {
  addRoute,
  deleteRoute,
  getRouteForAdmin,
  listRoutesWithGeometry,
  parseRouteInput,
  updateRoute,
} from '../services/admin/routes';
import {
  getContribution,
  listContributions,
  REVIEW_STATUSES,
  reviewContribution,
  type ReviewStatus,
} from '../services/admin/contributions';
import { describeDatabase } from '../services/admin/database';
import { createUser, deleteUser, getUser, listUsers, updateUser } from '../services/admin/users';

// Everything under /admin requires users.is_admin. Response shapes match what the
// admin dashboard's former Next.js API routes returned.
export const admin = new Hono<{ Variables: AuthVariables }>();

admin.use('*', requireAdmin);

// --- Jeepney routes ---------------------------------------------------------
admin.get('/routes', async (c) =>
  c.json({ success: true, routes: await listRoutesWithGeometry() }),
);

admin.post('/routes', async (c) => {
  const input = parseRouteInput(await c.req.json().catch(() => null));
  return c.json({ success: true, route: await addRoute(input) }, 201);
});

admin.get('/routes/:id', async (c) =>
  c.json({ success: true, route: await getRouteForAdmin(c.req.param('id')) }),
);

admin.put('/routes/:id', async (c) => {
  const input = parseRouteInput(await c.req.json().catch(() => null));
  return c.json({ success: true, route: await updateRoute(c.req.param('id'), input) });
});

admin.delete('/routes/:id', async (c) =>
  c.json({ success: true, deleted: await deleteRoute(c.req.param('id')) }),
);

// --- Route contributions (review) -------------------------------------------
admin.get('/contributions', async (c) => {
  const status = c.req.query('status') || 'pending';
  return c.json({ success: true, contributions: await listContributions(status) });
});

admin.get('/contributions/:id', async (c) =>
  c.json({ success: true, contribution: await getContribution(c.req.param('id')) }),
);

admin.patch('/contributions/:id', async (c) => {
  const body = ((await c.req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  const status = body.status;
  if (typeof status !== 'string' || !REVIEW_STATUSES.includes(status as ReviewStatus)) {
    return c.json({ success: false, error: 'Invalid status' }, 400);
  }
  const contribution = await reviewContribution(c.req.param('id'), {
    status: status as ReviewStatus,
    review_notes: typeof body.review_notes === 'string' ? body.review_notes : null,
    transferred_route_id:
      typeof body.transferred_route_id === 'string' ? body.transferred_route_id : null,
  });
  return c.json({ success: true, contribution });
});

// --- Users ------------------------------------------------------------------
admin.get('/users', async (c) => c.json(await listUsers()));

admin.post('/users', async (c) => {
  const body = ((await c.req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  return c.json(await createUser(body), 201);
});

admin.get('/users/:id', async (c) => c.json(await getUser(c.req.param('id'))));

admin.put('/users/:id', async (c) => {
  const body = ((await c.req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  return c.json(await updateUser(c.req.param('id'), body));
});

admin.delete('/users/:id', async (c) => {
  await deleteUser(c.req.param('id'));
  return c.json({ success: true });
});

// --- Database browser -------------------------------------------------------
admin.get('/database/tables', async (c) =>
  c.json({ success: true, ...(await describeDatabase()) }),
);
