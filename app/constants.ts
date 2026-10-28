// Backend API base URL, no trailing slash. See backend/README.md.
// Android emulator: http://10.0.2.2:3000. Physical device: http://<your-mac-lan-ip>:3000.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

// Deep-link scheme the backend redirects to after Google sign-in. Must match app.json "scheme"
// and be listed in the backend's ALLOWED_REDIRECT_URIS.
export const APP_SCHEME = process.env.EXPO_PUBLIC_SCHEME || 'routewise://';

export const LOGO = require('@/assets/logo/logo.svg');
export const LOGO_ICON = require('@/assets/logo/logo-icon.svg');
export const LOCATION_ICON = require('@/assets/icons/location.svg')
