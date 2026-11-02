// Backend API base URL, no trailing slash. See backend/README.md.
// Android emulator: http://10.0.2.2:3000. Physical device: http://<your-mac-lan-ip>:3000.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);

// Backend that runs Google sign-in. Google only accepts https (or a desktop's localhost) as the
// address to return to, so a phone testing against a backend on the Mac's network address can't
// sign in through it. Point this at the deployed backend in development: both use the same
// Supabase project, so the session it returns works with the local backend too.
export const AUTH_URL = (process.env.EXPO_PUBLIC_AUTH_URL || API_URL).replace(/\/$/, '');

// Deep-link scheme the backend redirects to after Google sign-in. Must match app.json "scheme"
// and be listed in the backend's ALLOWED_REDIRECT_URIS.
export const APP_SCHEME = process.env.EXPO_PUBLIC_SCHEME || 'routewise://';

export const LOGO = require('@/assets/logo/logo.svg');
export const LOGO_ICON = require('@/assets/logo/logo-icon.svg');
export const LOCATION_ICON = require('@/assets/icons/location.svg');
// Google's four-color "G", for the Continue with Google button
export const GOOGLE_ICON = require('@/assets/icons/google.svg');
// Shown where a place has no photo (e.g. a saved route's destination)
export const PLACE_PLACEHOLDER = require('@/assets/images/place-placeholder.svg');
