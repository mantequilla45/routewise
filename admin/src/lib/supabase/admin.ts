import { createClient } from "@supabase/supabase-js";

// This function is for server-side code only (Server Components, Route Handlers)
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Return a null client during build time when credentials are missing
  // This allows the build to complete successfully
  if (!supabaseUrl || (!serviceRoleKey && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
    console.warn('Supabase credentials missing - returning null client for build');
    // Return null but typed as the client for build compatibility
    return null as unknown as ReturnType<typeof createClient>;
  }
  
  // Use the publishable key as fallback during build time
  // In production, SUPABASE_SERVICE_ROLE_KEY should be set
  const key = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

  return createClient(
    supabaseUrl,
    key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}