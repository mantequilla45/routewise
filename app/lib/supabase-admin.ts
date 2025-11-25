import { createClient } from '@supabase/supabase-js';

// This should only be used on the server side (API routes)
// Never expose the service key to the client!
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables not configured');
}

export const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Helper function to upsert user with existing table structure
export async function upsertUser(userData: {
  google_id: string;
  email: string;
  full_name?: string;
  picture?: string;
}) {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client not initialized');
    return { data: null, error: new Error('Supabase not configured'), isNewUser: false };
  }

  try {
    console.log('Attempting to save user:', userData.email);

    // Try to find existing user first
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .or(`google_id.eq.${userData.google_id},email.eq.${userData.email}`)
      .maybeSingle();

    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          google_id: userData.google_id,
          email: userData.email,
          full_name: userData.full_name || existingUser.full_name,
          avatar_url: userData.picture || existingUser.avatar_url,
          picture: userData.picture,
          last_login: new Date().toISOString(),
          login_count: (existingUser.login_count || 0) + 1,
          auth_provider: 'google',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        return { data: null, error: updateError, isNewUser: false };
      }

      console.log('User updated successfully');
      return { data: updatedUser, error: null, isNewUser: false };
    } else {
      // Create new user
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          google_id: userData.google_id,
          email: userData.email,
          full_name: userData.full_name,
          avatar_url: userData.picture,
          picture: userData.picture,
          last_login: new Date().toISOString(),
          login_count: 1,
          auth_provider: 'google',
          is_admin: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return { data: null, error: insertError, isNewUser: true };
      }

      console.log('User created successfully');
      return { data: newUser, error: null, isNewUser: true };
    }

  } catch (error) {
    console.error('Error in upsertUser:', error);
    return { data: null, error, isNewUser: false };
  }
}

// Helper function to get user statistics
export async function getUserStatistics() {
  if (!supabaseAdmin) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  try {
    // Get total users
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get users from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { count: usersLast24h } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    // Get users from last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const { count: usersLast7d } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastWeek.toISOString());

    // Get users from last 30 days
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);
    const { count: usersLast30d } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonth.toISOString());

    // Get active users from last 24 hours
    const { count: activeLast24h } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', yesterday.toISOString());

    // Get active users from last 7 days
    const { count: activeLast7d } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', lastWeek.toISOString());

    return {
      data: {
        total_users: totalUsers || 0,
        users_last_24h: usersLast24h || 0,
        users_last_7d: usersLast7d || 0,
        users_last_30d: usersLast30d || 0,
        active_last_24h: activeLast24h || 0,
        active_last_7d: activeLast7d || 0,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error getting user statistics:', error);
    return { data: null, error };
  }
}