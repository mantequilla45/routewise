import { createMiddleware } from 'hono/factory';
import { requireAuth, type AuthVariables } from './auth';

// requireAuth, then the caller's users.is_admin must be true.
export const requireAdmin = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  let authed = false;
  const result = await requireAuth(c, async () => {
    authed = true;
  });
  if (!authed) return result;

  if (!c.get('profile').is_admin) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  await next();
});
