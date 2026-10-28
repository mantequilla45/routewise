import * as React from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { APP_SCHEME } from "@/constants";
import { api, ApiError, setOnSessionExpired, tokens, type AuthUser } from "@/lib/api";

WebBrowser.maybeCompleteAuthSession();

export type { AuthUser };

// Last known profile, so the account screen renders instantly on cold start
// while /me is re-fetched in the background.
const USER_CACHE_KEY = 'user_data';

type AuthContextValue = {
    user: AuthUser | null;
    isLoading: boolean;
    error: string | null;
    signIn: () => Promise<void>;                                   // Google
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string) => Promise<{ requiresConfirmation: boolean }>;
    signOut: () => Promise<void>;
    updateUser: (updates: Partial<AuthUser>) => Promise<void>;
    refreshProfile: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue>({
    user: null,
    isLoading: false,
    error: null,
    signIn: async () => { },
    signInWithEmail: async () => { },
    signUpWithEmail: async () => ({ requiresConfirmation: false }),
    signOut: async () => { },
    updateUser: async () => { },
    refreshProfile: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = React.useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    // The OAuth redirect can arrive via both the browser result and the URL
    // listener; this stops it being processed twice.
    const handledUrlRef = React.useRef<string | null>(null);

    const applyUser = React.useCallback(async (next: AuthUser | null) => {
        setUser(next);
        if (next) {
            await SecureStore.setItemAsync(USER_CACHE_KEY, JSON.stringify(next));
        } else {
            await SecureStore.deleteItemAsync(USER_CACHE_KEY);
        }
    }, []);

    // Load the cached profile, then verify the session against the backend.
    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { access } = await tokens.get();
                if (!access) return;

                const cached = await SecureStore.getItemAsync(USER_CACHE_KEY);
                if (cached && !cancelled) setUser(JSON.parse(cached));

                const fresh = await api.me.get();
                if (!cancelled) await applyUser(fresh);
            } catch (e) {
                // apiFetch already cleared tokens if the refresh failed.
                if (!cancelled && e instanceof ApiError && e.status === 401) await applyUser(null);
                else console.warn('Session restore failed:', e);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })().then(() => { if (!cancelled) setIsLoading(false); });
        return () => { cancelled = true; };
    }, [applyUser]);

    React.useEffect(() => {
        setOnSessionExpired(() => { applyUser(null); });
        return () => setOnSessionExpired(null);
    }, [applyUser]);

    // Handles `routewise://?access_token=…&refresh_token=…` from the Google callback.
    const handleAuthRedirect = React.useCallback(async (url: string) => {
        if (handledUrlRef.current === url) return;
        handledUrlRef.current = url;

        const { queryParams } = Linking.parse(url);
        if (!queryParams) return;

        if (queryParams.error) {
            setError('Sign in failed: ' + String(queryParams.error));
            setIsLoading(false);
            return;
        }

        const accessToken = queryParams.access_token;
        const refreshToken = queryParams.refresh_token;
        if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') return;

        try {
            await tokens.set({ access_token: accessToken, refresh_token: refreshToken });
            await applyUser(await api.me.get());
            setError(null);
        } catch (e) {
            console.error('Error completing sign in:', e);
            setError('Failed to complete sign in');
        } finally {
            setIsLoading(false);
        }
    }, [applyUser]);

    React.useEffect(() => {
        const subscription = Linking.addEventListener('url', (event) => { handleAuthRedirect(event.url); });
        Linking.getInitialURL().then((url) => { if (url) handleAuthRedirect(url); });
        return () => subscription.remove();
    }, [handleAuthRedirect]);

    const signIn = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const state = Math.random().toString(36).substring(2);
            const result = await WebBrowser.openAuthSessionAsync(
                api.auth.googleAuthorizeUrl(APP_SCHEME, state),
                APP_SCHEME,
            );

            if (result.type === 'success' && result.url) {
                await handleAuthRedirect(result.url);
            } else {
                // cancel / dismiss
                setIsLoading(false);
            }
        } catch (e) {
            console.error('Sign in error:', e);
            setError('Failed to sign in');
            setIsLoading(false);
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        const session = await api.auth.login(email, password);
        await tokens.set(session);
        await applyUser(session.user);
        setError(null);
    };

    const signUpWithEmail = async (email: string, password: string) => {
        const result = await api.auth.signup(email, password);
        if (result.requiresConfirmation) return { requiresConfirmation: true };
        await tokens.set(result.session);
        await applyUser(result.session.user);
        setError(null);
        return { requiresConfirmation: false };
    };

    const signOut = async () => {
        setIsLoading(true);
        try {
            await api.auth.logout().catch(() => { /* already signed out server-side or offline */ });
        } finally {
            await tokens.clear();
            await applyUser(null);
            setError(null);
            setIsLoading(false);
        }
    };

    const updateUser = async (updates: Partial<AuthUser>) => {
        if (!user) return;
        await applyUser({ ...user, ...updates });
    };

    const refreshProfile = async () => {
        try {
            await applyUser(await api.me.get());
        } catch (e) {
            console.warn('refreshProfile error', e);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            error,
            signIn,
            signInWithEmail,
            signUpWithEmail,
            signOut,
            updateUser,
            refreshProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
