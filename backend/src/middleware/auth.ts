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
  const token = bearerToken(c.req.header('Authorization'));
  if (!token) {
    return c.json({ error: 'Missing bearer token' }, 401);
  }

  const signedIn = await signedInAs(token);
  if (!signedIn) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  c.set('authUser', signedIn.user);
  c.set('profile', signedIn.profile);
  c.set('accessToken', token);
  await next();
});

export type OptionalAuthVariables = { profile: ProfileRow | null };

// For routes open to everyone that also note who is signed in: sets `profile` from a valid
// token, or null without one (an invalid token counts as signed out, not an error).
export const optionalAuth = createMiddleware<{ Variables: OptionalAuthVariables }>(
  async (c, next) => {
    const token = bearerToken(c.req.header('Authorization'));
    const signedIn = token ? await signedInAs(token) : null;
    c.set('profile', signedIn?.profile ?? null);
    await next();
  },
);

function bearerToken(header: string | undefined): string {
  return header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

async function signedInAs(token: string): Promise<{ user: User; profile: ProfileRow } | null> {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user?.email) return null;
  const profile = await ensureProfile(data.user.email, data.user.app_metadata?.provider || 'email');
  return { user: data.user, profile };
}
