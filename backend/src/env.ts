function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const env = {
  supabaseUrl: required('SUPABASE_URL'),
  supabaseAnonKey: required('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  databaseUrl: required('DATABASE_URL'),
  googleClientId: optional('GOOGLE_CLIENT_ID', ''),
  googleClientSecret: optional('GOOGLE_CLIENT_SECRET', ''),
  // Server-side Google key for Places API (New): place search for the app.
  googleMapsServerKey: optional('GMAPS_SERVER_KEY', ''),
  apiUrl: optional('API_URL', 'http://localhost:3000').replace(/\/$/, ''),
  allowedRedirectUris: optional('ALLOWED_REDIRECT_URIS', 'routewise://')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  port: Number(optional('PORT', '3000')),
};
