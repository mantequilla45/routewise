import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

const clientOptions = {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
    },
};

// Service-role client. Bypasses RLS, so it never leaves the backend.
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, clientOptions);

// Fresh anon client per auth call. Sign-in methods store session state on the
// client instance, so sharing one across concurrent requests would leak sessions.
export function createAnonClient() {
    return createClient(env.supabaseUrl, env.supabaseAnonKey, clientOptions);
}
