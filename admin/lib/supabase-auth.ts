import * as SecureStore from 'expo-secure-store';

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom storage adapter for Expo SecureStore
const ExpoSecureStoreAdapter = {
  async getItem(key: string) {
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string) {
    await SecureStore.deleteItemAsync(key);
  },
};

// Types
export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    email?: string;
    name?: string;
    picture?: string;
  };
}

// Sign in with Google using Supabase Auth
export async function signInWithGoogle() {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/authorize`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        provider: 'google',
        redirect_to: process.env.EXPO_PUBLIC_SCHEME || 'routewise://',
      }),
    });

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return { data: null, error };
  }
}

// Get current session
export async function getSession() {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${await SecureStore.getItemAsync('supabase.auth.token')}`,
      },
    });

    if (!response.ok) {
      return { data: null, error: 'No session' };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Sign out
export async function signOut() {
  try {
    const token = await SecureStore.getItemAsync('supabase.auth.token');
    
    if (token) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
        },
      });
    }

    // Clear stored tokens
    await SecureStore.deleteItemAsync('supabase.auth.token');
    await SecureStore.deleteItemAsync('supabase.auth.refresh');
    
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error };
  }
}

// Handle auth callback
export async function handleAuthCallback(url: string) {
  try {
    // Parse the URL for tokens
    const urlParams = new URLSearchParams(url.split('#')[1] || '');
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');

    if (accessToken) {
      // Store tokens
      await SecureStore.setItemAsync('supabase.auth.token', accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync('supabase.auth.refresh', refreshToken);
      }

      // Get user data
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        return { data: user, error: null };
      }
    }

    return { data: null, error: 'No access token found' };
  } catch (error) {
    console.error('Error handling auth callback:', error);
    return { data: null, error };
  }
}

// Refresh token
export async function refreshSession() {
  try {
    const refreshToken = await SecureStore.getItemAsync('supabase.auth.refresh');
    
    if (!refreshToken) {
      return { data: null, error: 'No refresh token' };
    }

    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      
      // Store new tokens
      if (data.access_token) {
        await SecureStore.setItemAsync('supabase.auth.token', data.access_token);
      }
      if (data.refresh_token) {
        await SecureStore.setItemAsync('supabase.auth.refresh', data.refresh_token);
      }

      return { data, error: null };
    }

    return { data: null, error: 'Failed to refresh session' };
  } catch (error) {
    console.error('Error refreshing session:', error);
    return { data: null, error };
  }
}