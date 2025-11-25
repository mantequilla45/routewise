import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from "@/constants";
import { upsertUser } from "@/lib/supabase-admin";
import * as jose from "jose";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, client_id, redirect_uri } = body;

        if (!code) {
            return Response.json({ error: "Missing authorization code" }, { status: 400 });
        }

        // Exchange code for tokens with Google
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: GOOGLE_REDIRECT_URI,
                grant_type: "authorization_code",
            }).toString(),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error("Google token exchange failed:", error);
            return Response.json(
                { error: "Failed to exchange code with Google" },
                { status: tokenResponse.status }
            );
        }

        const tokens = await tokenResponse.json();
        
        // Decode the ID token to get user info
        if (tokens.id_token) {
            try {
                const userInfo = jose.decodeJwt(tokens.id_token) as any;
                
                // Save or update user in Supabase
                const { data: dbUser, error: dbError, isNewUser } = await upsertUser({
                    google_id: userInfo.sub,
                    email: userInfo.email,
                    full_name: userInfo.name,
                    picture: userInfo.picture,
                });

                if (dbError) {
                    console.error("Failed to save user to Supabase:", dbError);
                    // Continue with authentication even if database save fails
                }

                console.log(`User ${isNewUser ? 'created' : 'updated'}: ${userInfo.email}`);
            } catch (decodeError) {
                console.error("Failed to decode ID token:", decodeError);
            }
        }
        
        // Return the tokens to the client
        return Response.json({
            access_token: tokens.access_token,
            id_token: tokens.id_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in,
            token_type: tokens.token_type,
        });
    } catch (error) {
        console.error("Token exchange error:", error);
        return Response.json(
            { error: "Internal server error during token exchange" },
            { status: 500 }
        );
    }
}