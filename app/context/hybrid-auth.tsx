import * as React from "react";
import * as WebBrowser from "expo-web-browser";
import { BASE_URL, APP_SCHEME } from "@/constants";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { supabase } from "@/lib/supabase-client";

WebBrowser.maybeCompleteAuthSession();

export type AuthUser = {
    id: string;
    email: string;
    name: string | null;
    picture: string | null;
    email_verified?: boolean;
    provider?: string;
    commuter?: string | null;
};

const AuthContext = React.createContext({
    user: null as AuthUser | null,
    signIn: () => { },
    signOut: () => { },
    isLoading: false,
    error: null as string | null,
    updateUser: async (_: any) => { },
    refreshProfile: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = React.useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isProcessingAuth, setIsProcessingAuth] = React.useState(false);
    const authProcessingRef = React.useRef(false);

    // Load session on mount
    React.useEffect(() => {
        loadStoredSession();
    }, []);

    const loadStoredSession = async () => {
        try {
            // Check if we have a stored user
            const storedUser = await SecureStore.getItemAsync('user_data');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error('Error loading session:', e);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle the redirect from OAuth
    React.useEffect(() => {
        const handleUrl = async (url: string) => {
            const parsed = Linking.parse(url);
            
            if (parsed.queryParams?.error) {
                setError('Authentication failed: ' + parsed.queryParams.error);
                setIsLoading(false);
                return;
            }
            
            if (parsed.queryParams?.access_token) {
                const accessToken = parsed.queryParams.access_token as string;
                await handleGoogleToken(accessToken);
            }
        };

        const subscription = Linking.addEventListener('url', (event) => {
            handleUrl(event.url);
        });

        Linking.getInitialURL().then((url) => {
            if (url) handleUrl(url);
        });

        return () => subscription.remove();
    }, []);

    // Subscribe to Supabase auth state changes so other sign-in methods (email/password)
    // update this context's `user` immediately.
    React.useEffect(() => {
        // If supabase isn't available, skip
        if (!supabase || !supabase.auth || !supabase.auth.onAuthStateChange) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            try {
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                    // Try to get the authenticated user from Supabase
                    const userResponse = await supabase.auth.getUser();
                    const supaUser = userResponse?.data?.user;

                    if (supaUser && supaUser.email) {
                        // Try to load profile from users table
                        const { data: profile } = await supabase
                            .from('users')
                            .select('*')
                            .eq('email', supaUser.email)
                            .single();

                        const userData = {
                            id: profile?.id || supaUser.id,
                            email: supaUser.email,
                            name: profile?.full_name || null,
                            picture: profile?.avatar_url || null,
                            commuter: profile?.commuter || profile?.commuter_type || null,
                            email_verified: supaUser.email_confirmed || supaUser.email_confirmed_at || undefined,
                            provider: supaUser?.app_metadata?.provider || 'email',
                        } as AuthUser;

                        setUser(userData);
                        await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
                    }
                }

                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    await SecureStore.deleteItemAsync('user_data');
                }
            } catch (e) {
                console.warn('Error handling auth state change:', e);
            }
        });

        return () => subscription?.unsubscribe?.();
    }, []);

    const signIn = async () => {
        let timeoutId: NodeJS.Timeout | null = null;
        
        try {
            setError(null);
            setIsLoading(true);
            
            // Set a timeout to prevent infinite loading state
            timeoutId = setTimeout(() => {
                setIsLoading(false);
                setError("Authentication timeout. Please try again.");
            }, 60000); // 60 second timeout
            
            // Use YOUR OAuth endpoint (shows "Continue to RouteWise")
            const authUrl = `${BASE_URL}/api/auth/authorize?` + new URLSearchParams({
                client_id: 'google',
                redirect_uri: APP_SCHEME,
                scope: 'openid email profile',
                state: Math.random().toString(36).substring(7),
            }).toString();
            
            const result = await WebBrowser.openAuthSessionAsync(authUrl, APP_SCHEME);
            
            // Clear timeout since we got a response
            if (timeoutId) clearTimeout(timeoutId);
            
            if (result.type === 'success' && result.url) {
                const parsed = Linking.parse(result.url);
                
                if (parsed.queryParams?.error) {
                    setError('Sign in failed: ' + (parsed.queryParams.error as string));
                    setIsLoading(false);
                    return;
                }
                
                if (parsed.queryParams?.access_token) {
                    await handleGoogleToken(parsed.queryParams.access_token as string);
                } else {
                    // Success but no token - shouldn't happen
                    setError('No access token received');
                    setIsLoading(false);
                }
            } else if (result.type === 'cancel') {
                // User cancelled the sign in
                setError(null);
                setIsLoading(false);
            } else if (result.type === 'dismiss') {
                // Browser was dismissed
                setError(null);
                setIsLoading(false);
            }
        } catch (e) {
            // Clear timeout on error
            if (timeoutId) clearTimeout(timeoutId);
            console.error('Sign in error:', e);
            setError("Failed to sign in");
            setIsLoading(false);
        }
    };

    const handleGoogleToken = async (googleAccessToken: string) => {
        // Prevent duplicate processing
        if (authProcessingRef.current) {
            console.log('Auth already in progress, skipping duplicate call');
            return;
        }
        
        const requestId = Math.random().toString(36).substring(7);
        console.log(`[${requestId}] Starting authentication process`);
        
        authProcessingRef.current = true;
        setIsProcessingAuth(true);
        
        try {
            // Get user info from Google
            const response = await fetch(
                "https://www.googleapis.com/userinfo/v2/me",
                {
                    headers: { Authorization: `Bearer ${googleAccessToken}` },
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to get user info');
            }
            
            const googleUser = await response.json();
            console.log(`[${requestId}] Google user info received:`, { email: googleUser.email, name: googleUser.name });
            
            // Google userinfo v2 returns 'id' not 'sub'
            const googleId = googleUser.id || googleUser.sub;
            
            // First check if user exists (use maybeSingle to avoid error when no rows)
            console.log(`[${requestId}] Searching for existing user with email:`, googleUser.email, 'Google ID:', googleId);
            const { data: existingUser, error: searchError } = await supabase
                .from('users')
                .select('*')
                .or(`email.eq.${googleUser.email},google_id.eq.${googleId}`)
                .maybeSingle();
            
            if (searchError) {
                console.error('Error searching for user:', searchError);
            } else if (existingUser) {
                console.log('Found existing user:', existingUser.email, 'with ID:', existingUser.id);
            } else {
                console.log('No existing user found, will create new user');
            }

            let dbUser;
            if (existingUser) {
                // Update existing user - use ID instead of email for more reliable update
                const { data, error } = await supabase
                    .from('users')
                    .update({
                        full_name: googleUser.name,
                        avatar_url: googleUser.picture,
                        google_id: googleId, // Add Google ID
                        picture: googleUser.picture, // Add picture field
                        last_login: new Date().toISOString(), // Add last login
                        login_count: (existingUser.login_count || 0) + 1, // Increment login count
                        auth_provider: 'google', // Set auth provider
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existingUser.id) // Use ID instead of email
                    .select()
                    .maybeSingle(); // Use maybeSingle to avoid error
                
                if (error) {
                    console.error('Error updating user:', error);
                    dbUser = existingUser; // Use existing user data as fallback
                } else {
                    console.log('User updated successfully:', googleUser.email);
                    // If update succeeded but no data returned, use the existing user with updated fields
                    dbUser = data || {
                        ...existingUser,
                        full_name: googleUser.name,
                        avatar_url: googleUser.picture,
                        google_id: googleId,
                        picture: googleUser.picture,
                        last_login: new Date().toISOString(),
                        login_count: (existingUser.login_count || 0) + 1,
                        auth_provider: 'google',
                        updated_at: new Date().toISOString(),
                    };
                }
            } else {
                // Create new user
                const { data, error } = await supabase
                    .from('users')
                    .insert({
                        email: googleUser.email,
                        full_name: googleUser.name,
                        avatar_url: googleUser.picture,
                        google_id: googleId, // Add Google ID
                        picture: googleUser.picture, // Add picture field
                        last_login: new Date().toISOString(), // Add last login
                        login_count: 1, // Set initial login count
                        auth_provider: 'google', // Set auth provider
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        is_admin: false,
                    })
                    .select()
                    .maybeSingle(); // Use maybeSingle to avoid error
                
                if (error) {
                    console.error('Error creating user:', error);
                    
                    // If duplicate key error, try to fetch the existing user
                    if (error.code === '23505') {
                        console.log('User already exists, fetching existing user...');
                        const { data: fetchedUser } = await supabase
                            .from('users')
                            .select('*')
                            .eq('email', googleUser.email)
                            .maybeSingle();
                        
                        if (fetchedUser) {
                            dbUser = fetchedUser;
                            console.log('Successfully fetched existing user');
                        }
                    }
                } else {
                    console.log('New user created:', googleUser.email);
                    // If insert succeeded but no data returned, create a user object
                    dbUser = data || {
                        email: googleUser.email,
                        full_name: googleUser.name,
                        avatar_url: googleUser.picture,
                        google_id: googleId,
                        picture: googleUser.picture,
                        last_login: new Date().toISOString(),
                        login_count: 1,
                        auth_provider: 'google',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        is_admin: false,
                    };
                }
            }

            if (!dbUser) {
                console.log('Warning: Could not retrieve user data from Supabase, using Google data');
                // Use Google data as fallback
                dbUser = {
                    email: googleUser.email,
                    full_name: googleUser.name,
                    avatar_url: googleUser.picture,
                    google_id: googleId,
                };
            }

            const userData: AuthUser = {
                id: dbUser?.id || googleUser.id,
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture,
                commuter: dbUser?.commuter || dbUser?.commuter_type || null,
                email_verified: googleUser.verified_email,
                provider: 'google'
            };
            
            setUser(userData);
            setError(null);
            
            // Store user data
            await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
            
        } catch (e) {
            console.error('Error handling Google token:', e);
            setError("Failed to complete sign in");
        } finally {
            setIsLoading(false);
            // Reset the flag after a delay to allow for legitimate re-authentication
            setTimeout(() => {
                authProcessingRef.current = false;
                setIsProcessingAuth(false);
            }, 1000); // 1 second cooldown
        }
    };

    const signOut = async () => {
        try {
            setIsLoading(true);
            await SecureStore.deleteItemAsync('user_data');
            setUser(null);
            setError(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Allow components to update the cached user in context and SecureStore
    const updateUser = async (updates: any) => {
        try {
            const newUser = { ...(user as any) || {}, ...updates };
            setUser(newUser as AuthUser);
            await SecureStore.setItemAsync('user_data', JSON.stringify(newUser));
        } catch (e) {
            console.warn('updateUser error', e);
        }
    };

    // Re-fetch the current user's profile from the DB and update context
    const refreshProfile = async () => {
        try {
            if (!supabase) return;
            // Try to identify the user by current context user id or stored session
            const stored = await SecureStore.getItemAsync('user_data');
            let email: string | undefined;
            let id: string | undefined;
            if (stored) {
                const parsed = JSON.parse(stored);
                email = parsed.email;
                id = parsed.id;
            }

            // If we have an id or email, fetch profile
            if (!id && !email) return;

            const q = supabase.from('users').select('*').maybeSingle();
            const query = id ? supabase.from('users').select('*').eq('id', id).maybeSingle() : supabase.from('users').select('*').eq('email', email).maybeSingle();
            const { data: profile } = await query;
            if (!profile) return;

            const newUser: AuthUser = {
                id: profile.id,
                email: profile.email,
                name: profile.full_name || null,
                picture: profile.avatar_url || null,
                commuter: profile.commuter || profile.commuter_type || null,
                email_verified: undefined,
                provider: profile.auth_provider || 'email',
            };

            setUser(newUser);
            await SecureStore.setItemAsync('user_data', JSON.stringify(newUser));
        } catch (e) {
            console.warn('refreshProfile error', e);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            signIn,
            signOut,
            isLoading,
            error,
            updateUser,
            refreshProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};