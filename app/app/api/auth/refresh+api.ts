import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "@/constants";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { refresh_token } = body;

        if (!refresh_token) {
            return Response.json({ error: "Missing refresh token" }, { status: 400 });
        }

        // Exchange refresh token for new access token with Google
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                refresh_token,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                grant_type: "refresh_token",
            }).toString(),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error("Google token refresh failed:", error);
            return Response.json(
                { error: "Failed to refresh token" },
                { status: tokenResponse.status }
            );
        }

        const tokens = await tokenResponse.json();
        
        // Return the new tokens to the client
        return Response.json({
            access_token: tokens.access_token,
            expires_in: tokens.expires_in,
            token_type: tokens.token_type,
            // Google may or may not return a new refresh token
            refresh_token: tokens.refresh_token,
        });
    } catch (error) {
        console.error("Token refresh error:", error);
        return Response.json(
            { error: "Internal server error during token refresh" },
            { status: 500 }
        );
    }
}