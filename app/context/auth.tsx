import * as React from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { BASE_URL } from "@/constants";


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

// Your Google OAuth Client ID
const GOOGLE_CLIENT_ID = "880953895599-q9qljrddahcj5rhlmqehiq130i8lh9oj.apps.googleusercontent.com";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = React.useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // For development with Expo Go, use the Expo proxy
    const redirectUri = makeRedirectUri({
        scheme: 'routewise',
        useProxy: true // This is important for development with Expo Go
    });

    console.log('Redirect URI:', redirectUri); // This will help you see what URI to add to Google Console

    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ["openid", "profile", "email"],
        redirectUri,
    });

    React.useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            // Get user info from Google
            getUserInfo(authentication?.accessToken);
        }
    }, [response]);

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
            
            const userInfo = await response.json();
            setUser({
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                email_verified: userInfo.verified_email,
                provider: 'google'
            });
            setError(null);
        } catch (e) {
            console.error(e);
            setError("Failed to get user information");
        } finally {
            setIsLoading(false);
        }
    };

    const signIn = async () => {
        try {
            setError(null);
            await promptAsync();
        } catch (e) {
            console.log(e);
            setError("Failed to sign in");
        };
    };

    const signOut = async () => { 
        setUser(null);
        setError(null);
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