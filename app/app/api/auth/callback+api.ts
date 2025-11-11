import { APP_SCHEME, BASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from "@/constants";

export async function GET(request: Request) {
    const incomingParams = new URLSearchParams(request.url.split("?")[1]);
    const combinedPlatformAndState = incomingParams.get("state");
    const code = incomingParams.get("code");

    if (!combinedPlatformAndState || !code) {
        return Response.json({ error: "Invalid state or code" }, { status: 400 });
    }

    // strip platform to return state as it was set on the client
    const platform = combinedPlatformAndState.split("|")[0];
    const state = combinedPlatformAndState.split("|")[1];

    // Exchange code for tokens immediately
    try {
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
            return Response.redirect(
                (platform === "web" ? BASE_URL : APP_SCHEME) + "?error=token_exchange_failed"
            );
        }

        const tokens = await tokenResponse.json();
        
        // Pass tokens to the app via URL parameters
        const outgoingParams = new URLSearchParams({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || "",
            id_token: tokens.id_token || "",
            expires_in: tokens.expires_in?.toString() || "3600",
            state,
        });

        return Response.redirect(
            (platform === "web" ? BASE_URL : APP_SCHEME) + "?" + outgoingParams.toString()
        );
    } catch (error) {
        console.error("Token exchange error:", error);
        return Response.redirect(
            (platform === "web" ? BASE_URL : APP_SCHEME) + "?error=token_exchange_error"
        );
    }
}