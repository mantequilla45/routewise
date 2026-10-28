import { log } from '../lib/log';
import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { env } from '../env';
import { createAnonClient, supabaseAdmin } from '../lib/supabase';
import { requireAuth } from '../middleware/auth';
import {
  ensureProfile,
  recordLogin,
  toAuthUser,
  upsertGoogleProfile,
  type ProfileRow,
} from '../services/users';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export const auth = new Hono();

function sessionResponse(session: Session, user: User, profile: ProfileRow) {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    token_type: session.token_type,
    user: toAuthUser(profile, user),
  };
}

// Supabase reports its HTTP status as a plain number; Hono wants a typed status code.
function authStatus(
  error: AuthError | null | undefined,
  fallback: ContentfulStatusCode,
): ContentfulStatusCode {
  const status = error?.status;
  return status && status >= 400 && status < 600 ? (status as ContentfulStatusCode) : fallback;
}

function parseCredentials(body: unknown): { email: string; password: string } | null {
  const { email, password } = (body ?? {}) as Record<string, unknown>;
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return null;
  }
  return { email: email.trim().toLowerCase(), password };
}

auth.post('/signup', async (c) => {
  const creds = parseCredentials(await c.req.json().catch(() => null));
  if (!creds) return c.json({ error: 'Email and password are required' }, 400);

  const { data, error } = await createAnonClient().auth.signUp(creds);
  if (error) {
    return c.json({ error: error.message, code: error.code }, authStatus(error, 400));
  }

  // With email confirmation enabled Supabase returns a user but no session.
  if (!data.session || !data.user) {
    return c.json(
      { requires_confirmation: true, message: 'Check your email to confirm your account' },
      202,
    );
  }

  const profile = await ensureProfile(creds.email, 'email');
  return c.json(sessionResponse(data.session, data.user, profile), 201);
});

auth.post('/login', async (c) => {
  const creds = parseCredentials(await c.req.json().catch(() => null));
  if (!creds) return c.json({ error: 'Email and password are required' }, 400);

  const { data, error } = await createAnonClient().auth.signInWithPassword(creds);
  if (error || !data.session || !data.user) {
    return c.json({ error: error?.message || 'Invalid credentials' }, authStatus(error, 401));
  }

  const profile = await ensureProfile(creds.email, 'email');
  await recordLogin(profile);
  return c.json(sessionResponse(data.session, data.user, profile));
});

auth.post('/refresh', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const refreshToken = body.refresh_token;
  if (typeof refreshToken !== 'string' || !refreshToken) {
    return c.json({ error: 'refresh_token is required' }, 400);
  }

  const { data, error } = await createAnonClient().auth.refreshSession({
    refresh_token: refreshToken,
  });
  if (error || !data.session || !data.user?.email) {
    return c.json({ error: error?.message || 'Refresh failed' }, 401);
  }

  const profile = await ensureProfile(data.user.email, data.user.app_metadata?.provider || 'email');
  return c.json(sessionResponse(data.session, data.user, profile));
});

auth.post('/logout', requireAuth, async (c) => {
  const { error } = await supabaseAdmin.auth.admin.signOut(c.get('accessToken'));
  if (error) log.warn('signOut failed:', error.message);
  return c.body(null, 204);
});

// --- Google OAuth -----------------------------------------------------------
// The app opens /auth/google/authorize in a browser. Google sends the user back
// to /auth/google/callback, which exchanges the code server-side, turns the
// Google id_token into a Supabase session, and deep-links back into the app.

function encodeState(redirectUri: string, clientState: string) {
  return Buffer.from(JSON.stringify({ r: redirectUri, s: clientState })).toString('base64url');
}

function decodeState(state: string): { redirectUri: string; clientState: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString()) as {
      r?: string;
      s?: string;
    };
    if (typeof parsed.r !== 'string' || !env.allowedRedirectUris.includes(parsed.r)) return null;
    return { redirectUri: parsed.r, clientState: parsed.s ?? '' };
  } catch {
    return null;
  }
}

function appRedirect(redirectUri: string, params: Record<string, string>) {
  return `${redirectUri}?${new URLSearchParams(params).toString()}`;
}

auth.get('/google/authorize', (c) => {
  if (!env.googleClientId) {
    return c.json({ error: 'Google sign-in is not configured' }, 500);
  }

  const redirectUri = c.req.query('redirect_uri') ?? '';
  if (!env.allowedRedirectUris.includes(redirectUri)) {
    return c.json({ error: 'Invalid redirect URI' }, 400);
  }

  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: `${env.apiUrl}/auth/google/callback`,
    response_type: 'code',
    scope: c.req.query('scope') || 'openid email profile',
    state: encodeState(redirectUri, c.req.query('state') ?? ''),
    prompt: 'select_account',
  });

  return c.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});

auth.get('/google/callback', async (c) => {
  const state = decodeState(c.req.query('state') ?? '');
  // Without a valid state we don't know where to send the user; fall back to the
  // first allowed app URI so they at least land back in the app with an error.
  const redirectUri = state?.redirectUri ?? env.allowedRedirectUris[0];
  const code = c.req.query('code');

  if (!state || !code) {
    return c.redirect(appRedirect(redirectUri, { error: 'invalid_request' }));
  }

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.googleClientId,
        client_secret: env.googleClientSecret,
        redirect_uri: `${env.apiUrl}/auth/google/callback`,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      log.error('Google token exchange failed:', await tokenResponse.text());
      return c.redirect(appRedirect(redirectUri, { error: 'token_exchange_failed' }));
    }

    const tokens = (await tokenResponse.json()) as { id_token?: string };
    if (!tokens.id_token) {
      return c.redirect(appRedirect(redirectUri, { error: 'missing_id_token' }));
    }

    // Requires the Google provider to be enabled in Supabase Auth with this client ID.
    const { data, error } = await createAnonClient().auth.signInWithIdToken({
      provider: 'google',
      token: tokens.id_token,
    });

    if (error || !data.session || !data.user?.email) {
      log.error('Supabase signInWithIdToken failed:', error?.message);
      return c.redirect(appRedirect(redirectUri, { error: 'supabase_sign_in_failed' }));
    }

    const meta = data.user.user_metadata ?? {};
    await upsertGoogleProfile({
      google_id: meta.sub || meta.provider_id || data.user.id,
      email: data.user.email,
      full_name: meta.full_name || meta.name,
      picture: meta.avatar_url || meta.picture,
    });

    return c.redirect(
      appRedirect(redirectUri, {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: String(data.session.expires_in),
        state: state.clientState,
      }),
    );
  } catch (error) {
    log.error('Google callback error:', error);
    return c.redirect(appRedirect(redirectUri, { error: 'token_exchange_error' }));
  }
});
