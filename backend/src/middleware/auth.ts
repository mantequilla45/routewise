import { createMiddleware } from 'hono/factory';
import type { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '../lib/supabase';
import { ensureProfile, type ProfileRow } from '../services/users';

export type AuthVariables = {
    authUser: User;
    profile: ProfileRow;
    accessToken: string;
};

// Verifies the Supabase access token in `Authorization: Bearer <token>` and
// loads the caller's profile row. Handlers read them with c.get('profile').
export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const header = c.req.header('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

    if (!token) {
        return c.json({ error: 'Missing bearer token' }, 401);
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user?.email) {
        return c.json({ error: 'Invalid or expired token' }, 401);
    }

    const profile = await ensureProfile(data.user.email, data.user.app_metadata?.provider || 'email');

    c.set('authUser', data.user);
    c.set('profile', profile);
    c.set('accessToken', token);
    await next();
});
