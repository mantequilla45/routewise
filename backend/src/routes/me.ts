import { Hono } from 'hono';
import { requireAuth, type AuthVariables } from '../middleware/auth';
import { toAuthUser, updateProfile } from '../services/users';

export const me = new Hono<{ Variables: AuthVariables }>();

me.use('*', requireAuth);

me.get('/', (c) => {
    return c.json(toAuthUser(c.get('profile'), c.get('authUser')));
});

me.patch('/', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const updates: { full_name?: string; commuter?: string } = {};

    if (typeof body.name === 'string') updates.full_name = body.name.trim();
    if (typeof body.commuter === 'string') updates.commuter = body.commuter.trim();

    if (Object.keys(updates).length === 0) {
        return c.json({ error: 'Nothing to update. Send name and/or commuter.' }, 400);
    }

    const profile = await updateProfile(c.get('profile').id, updates);
    return c.json(toAuthUser(profile, c.get('authUser')));
});
