import type { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '../lib/supabase';

// Row in the public `users` table. Its `id` is the app-level user id that
// `saved_routes.user_id` references; it is NOT the Supabase auth uid.
export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  picture: string | null;
  google_id: string | null;
  commuter: string | null;
  commuter_type?: string | null;
  auth_provider: string | null;
  is_admin: boolean | null;
  login_count: number | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

// Shape the mobile app keeps in its auth context.
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  email_verified?: boolean;
  provider?: string;
  commuter?: string | null;
}

export function toAuthUser(profile: ProfileRow, authUser: User): AuthUser {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.full_name ?? null,
    picture: profile.avatar_url ?? profile.picture ?? null,
    commuter: profile.commuter ?? profile.commuter_type ?? null,
    email_verified: !!authUser.email_confirmed_at,
    provider: authUser.app_metadata?.provider || profile.auth_provider || 'email',
  };
}

export async function findProfileByEmail(email: string): Promise<ProfileRow | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Returns the profile row for an email, creating it on first sign-in.
export async function ensureProfile(email: string, provider: string): Promise<ProfileRow> {
  const existing = await findProfileByEmail(email);
  if (existing) return existing;

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      email,
      auth_provider: provider,
      is_admin: false,
      login_count: 1,
      last_login: now,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  // Another request may have inserted the same email concurrently.
  if (error?.code === '23505') {
    const raced = await findProfileByEmail(email);
    if (raced) return raced;
  }
  if (error) throw error;
  return data;
}

export async function recordLogin(profile: ProfileRow): Promise<void> {
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      last_login: new Date().toISOString(),
      login_count: (profile.login_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id);
  if (error) console.warn('recordLogin failed:', error.message);
}

export async function upsertGoogleProfile(google: {
  google_id: string;
  email: string;
  full_name?: string;
  picture?: string;
}): Promise<ProfileRow> {
  const now = new Date().toISOString();

  const { data: existing, error: findError } = await supabaseAdmin
    .from('users')
    .select('*')
    .or(`google_id.eq.${google.google_id},email.eq.${google.email}`)
    .maybeSingle();
  if (findError) throw findError;

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        google_id: google.google_id,
        full_name: google.full_name || existing.full_name,
        avatar_url: google.picture || existing.avatar_url,
        picture: google.picture || existing.picture,
        last_login: now,
        login_count: (existing.login_count || 0) + 1,
        auth_provider: 'google',
        updated_at: now,
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      email: google.email,
      full_name: google.full_name ?? null,
      avatar_url: google.picture ?? null,
      picture: google.picture ?? null,
      google_id: google.google_id,
      last_login: now,
      login_count: 1,
      auth_provider: 'google',
      is_admin: false,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(
  id: string,
  updates: { full_name?: string; commuter?: string },
): Promise<ProfileRow> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
