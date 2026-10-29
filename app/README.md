# RouteWise mobile app

Expo (React Native) app. It is frontend-only: every network request goes to the
RouteWise API in [`../backend`](../backend/README.md). No Supabase or Google credentials
live in this app.

## Run it

1. Start the backend (see its README), or use the deployed URL.
2. Create `.env` from `.env.example` and set `EXPO_PUBLIC_API_URL`:
   - iOS simulator with a local backend: `http://localhost:3000`
   - Android emulator with a local backend: `http://10.0.2.2:3000`
   - Physical device: `http://<your-mac-lan-ip>:3000`
   - Production: your Vercel domain
3. Install and build a development client. The app uses `expo-maps` and `expo-dev-client`,
   so it does not run in the Expo Go store app.

   ```bash
   pnpm install
   pnpm ios       # or: pnpm android
   ```

   The first native build takes a few minutes. After that, `pnpm start` is enough; rebuild
   only when you add a native package or change `app.json`.

## Where things are

- `app/` — screens (file-based routing via expo-router)
- `components/` — UI components
- `context/auth.tsx` — sign-in state. Tokens are kept in SecureStore; `lib/api.ts` refreshes them.
- `lib/api.ts` — the only place that talks to the backend. Add new endpoints there.
- `services/` — route calculation helpers that call `lib/api.ts` (kept outside `app/`, which expo-router treats as screens)

## Sign-in flow

- Email/password: `POST /auth/login` or `/auth/signup` on the backend.
- Google: the app opens `/auth/google/authorize` in the system browser; the backend finishes
  OAuth and deep-links back to `routewise://` with tokens. The scheme is set in `app.json`.
