import * as React from "react";
import * as WebBrowser from "expo-web-browser";
import { BASE_URL, APP_SCHEME } from "@/constants";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { saveUserProfile } from "@/lib/supabase";


WebBrowser.maybeCompleteAuthSession();

export type AuthUser = {
    id: string;
    email: string;
    name: string;
    picture?: string;
    email_verified?: boolean;
    provider?: string;
    exp?: number;
    cookieExpiration?: number; // Added for web cookie expiration tracking
};

const AuthContext = React.createContext({
    user: null as AuthUser | null,
    signIn: () => { },
    signOut: () => { },
    fetchWithAuth: async (url: string, options?: RequestInit) => Promise.resolve(new Response()),
    isLoading: false,
    error: null as string | null,
});

// Your Google OAuth Client ID from environment or hardcoded
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "880953895599-q9qljrddahcj5rhlmqehiq130i8lh9oj.apps.googleusercontent.com";

// Storage keys
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    TOKEN_EXPIRY: 'token_expiry',
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = React.useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = React.useState(true); // Start with loading true
    const [error, setError] = React.useState<string | null>(null);
    const [refreshTimer, setRefreshTimer] = React.useState<NodeJS.Timeout | null>(null);

    // Load stored tokens on app startup
    React.useEffect(() => {
        loadStoredAuth();
    }, []);

    // Handle the redirect from OAuth
    React.useEffect(() => {
        const handleUrl = async (url: string) => {
            const parsed = Linking.parse(url);
            
            // Check for error
            if (parsed.queryParams?.error) {
                setError('Authentication failed: ' + parsed.queryParams.error);
                setIsLoading(false);
                return;
            }
            
            // Check for access token (tokens already exchanged by backend)
            if (parsed.queryParams?.access_token) {
                const accessToken = parsed.queryParams.access_token as string;
                const refreshToken = (parsed.queryParams.refresh_token as string) || '';
                const expiresIn = parsed.queryParams.expires_in 
                    ? parseInt(parsed.queryParams.expires_in as string) 
                    : 3600;
                
                // Store tokens securely
                await storeTokens(accessToken, refreshToken, expiresIn);
                
                // Get user info and store it
                await getUserInfo(accessToken);
            }
        };

        // Listen for incoming links
        const subscription = Linking.addEventListener('url', (event) => {
            handleUrl(event.url);
        });

        // Check if app was opened with a link
        Linking.getInitialURL().then((url) => {
            if (url) handleUrl(url);
        });

        return () => subscription.remove();
    }, []);

    // Cleanup timer on unmount
    React.useEffect(() => {
        return () => {
            if (refreshTimer) {
                clearTimeout(refreshTimer);
            }
        };
    }, [refreshTimer]);

    const loadStoredAuth = async () => {
        try {
            const [storedToken, storedUserData, tokenExpiry] = await Promise.all([
                SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
                SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA),
                SecureStore.getItemAsync(STORAGE_KEYS.TOKEN_EXPIRY),
            ]);

            if (storedToken && storedUserData && tokenExpiry) {
                const expiryTime = parseInt(tokenExpiry);
                const now = Date.now();
                
                // Check if token is still valid (with 5 minute buffer)
                if (expiryTime > now + 5 * 60 * 1000) {
                    // Token is still valid
                    const userData = JSON.parse(storedUserData);
                    setUser(userData);
                    
                    // Schedule token refresh
                    scheduleTokenRefresh(expiryTime - now);
                } else {
                    // Token expired, clear storage
                    await clearStoredAuth();
                }
            }
        } catch (error) {
            console.error('Error loading stored auth:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const storeTokens = async (accessToken: string, refreshToken: string, expiresIn: number) => {
        try {
            const expiryTime = Date.now() + (expiresIn * 1000);
            
            await Promise.all([
                SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
                refreshToken && SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
                SecureStore.setItemAsync(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString()),
            ].filter(Boolean));
            
            // Schedule token refresh before expiry
            scheduleTokenRefresh(expiresIn * 1000);
        } catch (error) {
            console.error('Error storing tokens:', error);
        }
    };

    const clearStoredAuth = async () => {
        try {
            await Promise.all([
                SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
                SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
                SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA),
                SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN_EXPIRY),
            ]);
        } catch (error) {
            console.error('Error clearing stored auth:', error);
        }
    };

    const scheduleTokenRefresh = (timeUntilExpiry: number) => {
        // Clear any existing timer
        if (refreshTimer) {
            clearTimeout(refreshTimer);
        }
        
        // Schedule refresh 5 minutes before token expires
        const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 0);
        
        if (refreshTime > 0) {
            const timer = setTimeout(() => {
                refreshAccessToken();
            }, refreshTime);
            
            setRefreshTimer(timer);
        }
    };

    const refreshAccessToken = async () => {
        try {
            const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
            
            if (!refreshToken) {
                // No refresh token, need to re-authenticate
                await signOut();
                return;
            }
            
            // Call refresh endpoint
            const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh_token: refreshToken,
                }),
            });
            
            if (!response.ok) {
                // Refresh failed, need to re-authenticate
                await signOut();
                return;
            }
            
            const data = await response.json();
            
            // Store new tokens
            await storeTokens(
                data.access_token,
                data.refresh_token || refreshToken, // Use new refresh token if provided
                data.expires_in || 3600
            );
            
            console.log('Token refreshed successfully');
        } catch (error) {
            console.error('Error refreshing token:', error);
            await signOut();
        }
    };

    const getUserInfo = async (token: string | undefined) => {
        if (!token) return;
        
        try {
            setIsLoading(true);
            const response = await fetch(
                "https://www.googleapis.com/userinfo/v2/me",
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to get user info');
            }
            
            const userInfo = await response.json();
            const userData: AuthUser = {
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                email_verified: userInfo.verified_email,
                provider: 'google'
            };
            
            setUser(userData);
            setError(null);
            
            // Store user data locally
            await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
            
            // Save user profile to Supabase
            try {
                await saveUserProfile({
                    email: userInfo.email,
                    full_name: userInfo.name || null,
                    avatar_url: userInfo.picture || null,
                });
                console.log('User profile saved to Supabase');
            } catch (supabaseError) {
                // Don't fail the sign-in if Supabase save fails
                console.error('Failed to save to Supabase:', supabaseError);
            }
        } catch (e) {
            console.error(e);
            setError("Failed to get user information");
            await clearStoredAuth();
        } finally {
            setIsLoading(false);
        }
    };

    const signIn = async () => {
        try {
            setError(null);
            setIsLoading(true);
            
            // Use your custom OAuth endpoint
            const authUrl = `${BASE_URL}/api/auth/authorize?` + new URLSearchParams({
                client_id: 'google',
                redirect_uri: APP_SCHEME,
                scope: 'openid email profile',
                state: Math.random().toString(36).substring(7),
            }).toString();
            
            // Open the browser for OAuth
            const result = await WebBrowser.openAuthSessionAsync(authUrl, APP_SCHEME);
            
            if (result.type === 'success' && result.url) {
                // The callback endpoint already exchanged the code for tokens
                const parsed = Linking.parse(result.url);
                
                if (parsed.queryParams?.error) {
                    setError('Sign in failed: ' + (parsed.queryParams.error as string));
                    setIsLoading(false);
                    return;
                }
                
                if (parsed.queryParams?.access_token) {
                    await getUserInfo(parsed.queryParams.access_token as string);
                } else {
                    // Success but no token - shouldn't happen
                    setError('No access token received');
                    setIsLoading(false);
                }
            } else if (result.type === 'cancel') {
                // User cancelled the sign in
                setError(null); // Don't show error for user cancellation
                setIsLoading(false);
            } else if (result.type === 'dismiss') {
                // Browser was dismissed
                setError(null);
                setIsLoading(false);
            }
        } catch (e) {
            console.error('Sign in error:', e);
            setError("Failed to sign in");
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        try {
            setIsLoading(true);
            
            // Clear stored tokens
            await clearStoredAuth();
            
            // Clear timer
            if (refreshTimer) {
                clearTimeout(refreshTimer);
                setRefreshTimer(null);
            }
            
            setUser(null);
            setError(null);
        } finally {
            setIsLoading(false);
        }
    };
    
    const fetchWithAuth = async (url: string, options?: RequestInit) => {
        // This can be implemented if you need to make authenticated API calls
        return fetch(url, options);
    };

    return (
        <AuthContext.Provider value={{
            user,
            signIn,
            signOut,
            fetchWithAuth,
            isLoading,
            error,
        }}
        >
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