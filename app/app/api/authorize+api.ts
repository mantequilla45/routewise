import * as React from "react";
import * as WebBrowser from "expo-web-browser";
import { AuthError } from "expo-auth-session";

export type AuthUser = {
    id: string;
    email: string;
    name: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
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
    return <AuthContext.Provider
};