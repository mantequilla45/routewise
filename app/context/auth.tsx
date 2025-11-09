import * as React from "react";
import * as WebBrowser from "expo-web-browser";
import { AuthError } from "expo-auth-session";


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
    error: null as AuthError | null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = React.useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<AuthError | null>(null);
    const signIn = async () => { };
    const signOut = async () => { };
    const fetchWithAuth = async (url: string, options?: RequestInit) => { };

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