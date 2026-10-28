import { supabaseAdmin } from '../../lib/supabase';
import { HttpError, notFound } from '../../lib/http';

const EDITABLE_FIELDS = [
  'full_name',
  'phone_number',
  'is_admin',
  'commuter',
  'avatar_url',
  'metadata',
] as const;

function pickEditable(body: Record<string, unknown>) {
  const updates: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field];
  }
  return updates;
}

export async function listUsers() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new HttpError(500, { error: 'Failed to fetch users' });
  return data ?? [];
}

export async function getUser(id: string) {
  const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', id).maybeSingle();
  if (error) throw new HttpError(500, { error: 'Failed to fetch user' });
  if (!data) throw notFound('User not found');
  return data;
}

export async function createUser(body: Record<string, unknown>) {
  if (typeof body.email !== 'string' || !body.email) {
    throw new HttpError(400, { error: 'email is required' });
  }
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      email: body.email,
      ...pickEditable(body),
      is_admin: body.is_admin === true,
      auth_provider: typeof body.auth_provider === 'string' ? body.auth_provider : 'email',
      metadata: body.metadata ?? {},
      login_count: 0,
    })
    .select()
    .single();
  if (error) throw new HttpError(500, { error: 'Failed to create user' });
  return data;
}

export async function updateUser(id: string, body: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ ...pickEditable(body), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new HttpError(500, { error: 'Failed to update user' });
  if (!data) throw notFound('User not found');
  return data;
}

export async function deleteUser(id: string) {
  const { error } = await supabaseAdmin.from('users').delete().eq('id', id);
  if (error) throw new HttpError(500, { error: 'Failed to delete user' });
}
