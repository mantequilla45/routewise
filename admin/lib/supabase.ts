// Note: You need to install @supabase/supabase-js
// Run: npm install @supabase/supabase-js
// import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client with custom storage for React Native
// Uncomment this after installing @supabase/supabase-js
/*
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      async getItem(key: string) {
        return await SecureStore.getItemAsync(key);
      },
      async setItem(key: string, value: string) {
        await SecureStore.setItemAsync(key, value);
      },
      async removeItem(key: string) {
        await SecureStore.deleteItemAsync(key);
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
*/

// Define the user profile type matching your database schema
export interface UserProfile {
  id?: string;
  email: string;
  full_name: string | null;
  phone_number?: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
  is_admin?: boolean;
}

// Function to save or update user profile
// This will be called from the auth context after Google sign-in
export async function saveUserProfile(userData: {
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}) {
  // For now, we'll use fetch to call your Supabase API directly
  // This is a temporary solution until @supabase/supabase-js is installed
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials not configured');
    return null;
  }
  
  try {
    // First, try to get existing user
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(userData.email)}`,
      {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
      }
    );
    
    const existingUsers = await checkResponse.json();
    
    let response;
    if (existingUsers && existingUsers.length > 0) {
      // Update existing user
      response = await fetch(
        `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(userData.email)}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            updated_at: new Date().toISOString(),
          }),
        }
      );
    } else {
      // Create new user with generated UUID
      // Generate a UUID v4
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      response = await fetch(
        `${supabaseUrl}/rest/v1/users`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            id: generateUUID(),
            email: userData.email,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            phone_number: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_admin: false,
          }),
        }
      );
    }
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Error saving user profile:', error);
      return null;
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('Failed to save user profile:', error);
    return null;
  }
}

// Function to get user profile by email
export async function getUserProfile(email: string) {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials not configured');
    return null;
  }
  
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=*`,
      {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      console.error('Error fetching user profile');
      return null;
    }
    
    const data = await response.json();
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
}