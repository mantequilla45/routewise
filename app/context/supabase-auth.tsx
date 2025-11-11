import * as React from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Session, User } from "@supabase/supabase-js";
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
    session: null as Session | null,
    signIn: () => { },
    signOut: () => { },
    isLoading: false,
    error: null as string | null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = React.useState<AuthUser | null>(null);
    const [session, setSession] = React.useState<Session | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Load session on mount
    React.useEffect(() => {
        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                setUserFromSupabaseUser(session.user);
            }
            setIsLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                setUserFromSupabaseUser(session.user);
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Convert Supabase user to our AuthUser type
    const setUserFromSupabaseUser = (supabaseUser: User) => {
        const metadata = supabaseUser.user_metadata;
        setUser({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: metadata?.full_name || metadata?.name || null,
            picture: metadata?.avatar_url || metadata?.picture || null,
            email_verified: supabaseUser.email_confirmed_at != null,
            provider: 'google',
        });
    };

    const signIn = async () => {
        try {
            console.log('Sign in button clicked');
            setError(null);
            setIsLoading(true);

            // Create the redirect URL for your app
            const redirectUrl = Linking.createURL('/');
            console.log('Redirect URL:', redirectUrl);
            
            // Check if supabase is initialized
            if (!supabase) {
                console.error('Supabase client not initialized');
                throw new Error('Supabase client not initialized');
            }
            
            // Sign in with Google via Supabase
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: false,
                },
            });
            
            console.log('OAuth response:', { data, error });

            if (error) {
                console.error('Sign in error:', error);
                setError(error.message);
                setIsLoading(false);
                return;
            }

            // Open the OAuth URL in a web browser
            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectUrl
                );

                if (result.type === 'success' && result.url) {
                    // Parse the URL to get the access token and refresh token
                    const url = new URL(result.url);
                    const hashParams = new URLSearchParams(url.hash.substring(1));
                    const accessToken = hashParams.get('access_token');
                    const refreshToken = hashParams.get('refresh_token');

                    if (accessToken) {
                        // Set the session manually
                        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
                        
                        if (user && !userError) {
                            setUserFromSupabaseUser(user);
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Sign in error:', e);
            setError("Failed to sign in");
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        try {
            setIsLoading(true);
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                console.error('Sign out error:', error);
                setError(error.message);
            } else {
                setUser(null);
                setSession(null);
                setError(null);
            }
        } catch (e) {
            console.error('Sign out error:', e);
            setError("Failed to sign out");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
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