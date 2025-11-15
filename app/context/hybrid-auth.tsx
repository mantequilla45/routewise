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
};

const AuthContext = React.createContext({
    user: null as AuthUser | null,
    signIn: () => { },
    signOut: () => { },
    isLoading: false,
    error: null as string | null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = React.useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

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
            
            // First check if user exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('*')
                .eq('email', googleUser.email)
                .single();

            let dbUser;
            if (existingUser) {
                // Update existing user
                const { data, error } = await supabase
                    .from('users')
                    .update({
                        full_name: googleUser.name,
                        avatar_url: googleUser.picture,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('email', googleUser.email)
                    .select()
                    .single();
                dbUser = data;
                if (error) console.error('Error updating user:', error);
            } else {
                // Create new user
                const { data, error } = await supabase
                    .from('users')
                    .insert({
                        email: googleUser.email,
                        full_name: googleUser.name,
                        avatar_url: googleUser.picture,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        is_admin: false,
                    })
                    .select()
                    .single();
                dbUser = data;
                if (error) console.error('Error creating user:', error);
            }

            if (!dbUser) {
                console.error('Could not save user to Supabase');
                // Continue anyway - user is still authenticated via Google
            }

            const userData: AuthUser = {
                id: dbUser?.id || googleUser.id,
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture,
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

    return (
        <AuthContext.Provider value={{
            user,
            signIn,
            signOut,
            isLoading,
            error,
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