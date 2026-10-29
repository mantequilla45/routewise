# RouteWise API

Backend for the RouteWise mobile app. Hono on Node, deployed to Vercel. Every request from
the app goes through here; the app itself holds no Supabase or Google credentials.

## Endpoints

| Method         | Path                                                       | Auth   | Purpose                                                               |
| -------------- | ---------------------------------------------------------- | ------ | --------------------------------------------------------------------- |
| GET            | `/health`                                                  | –      | Liveness check                                                        |
| POST           | `/auth/signup`                                             | –      | `{ email, password }` → session, or `202` if email confirmation is on |
| POST           | `/auth/login`                                              | –      | `{ email, password }` → session                                       |
| POST           | `/auth/refresh`                                            | –      | `{ refresh_token }` → new session                                     |
| POST           | `/auth/logout`                                             | Bearer | Revokes the session                                                   |
| GET            | `/auth/google/authorize?redirect_uri=routewise://&state=…` | –      | Opens Google sign-in                                                  |
| GET            | `/auth/google/callback`                                    | –      | Google redirects here; deep-links back to the app with tokens         |
| GET            | `/me`                                                      | Bearer | Current user profile                                                  |
| PATCH          | `/me`                                                      | Bearer | `{ name?, commuter? }`                                                |
| GET            | `/saved-routes`                                            | Bearer | List the caller's saved routes                                        |
| POST           | `/saved-routes`                                            | Bearer | Save a route                                                          |
| DELETE         | `/saved-routes/:id`                                        | Bearer | Delete one of the caller's saved routes                               |
| GET            | `/routes`                                                  | –      | All jeepney routes (summary)                                          |
| GET            | `/routes/:id`                                              | –      | One route with polyline coordinates                                   |
| POST           | `/routes/calculate`                                        | –      | `{ from, to }` → up to 5 trips (1-3 jeeps), fastest first             |
| GET            | `/places/autocomplete?q=&session=&lat=&lng=`               | –      | Place suggestions (Google Places, biased to Cebu)                     |
| GET            | `/places/popular`                                          | –      | Curated popular destinations (malls, schools, terminals…)             |
| GET            | `/places/:id?session=`                                     | –      | Place name, address and coordinates                                   |
| POST           | `/contributions`                                           | Bearer | Submit a route for review (any signed-in user)                        |
| GET            | `/routes/catalog`                                          | –      | All routes with geometry (admin browse page)                          |
| GET            | `/admin/routes`                                            | Admin  | Routes with geometry                                                  |
| POST           | `/admin/routes`                                            | Admin  | Add a route                                                           |
| GET/PUT/DELETE | `/admin/routes/:id`                                        | Admin  | Read, replace, delete a route                                         |
| GET            | `/admin/contributions?status=`                             | Admin  | Contributions awaiting review                                         |
| GET/PATCH      | `/admin/contributions/:id`                                 | Admin  | Read / review (`approved`, `rejected`, `needs_revision`)              |
| GET/POST       | `/admin/users`                                             | Admin  | List / create users                                                   |
| GET/PUT/DELETE | `/admin/users/:id`                                         | Admin  | Read, update, delete a user                                           |
| GET            | `/admin/database/tables`                                   | Admin  | Table browser used by the dashboard                                   |

A session looks like `{ access_token, refresh_token, expires_in, expires_at, user }`. Send
`Authorization: Bearer <access_token>` on protected routes; `401` means refresh and retry.
"Admin" routes additionally require `users.is_admin` for the caller (`403` otherwise). The admin
dashboard sends its Supabase session token the same way.

## Trip planning

`src/services/routing/`: the network (`network.ts`) samples every route into points 75 m apart in
its direction of travel and links points on different routes within 200 m as walking transfers.
`planner.ts` runs a shortest-path search from the start pin to the destination (walk ~5 km/h,
jeep ~15 km/h, +5 min per transfer, at most 3 jeeps, at least 400 m on each jeep) and returns up to 5 options, each boarding a
different first jeep. The network is built in memory on first use (~0.7 s), rebuilt every 10
minutes, and immediately after an admin edits a route.

## Run locally

```bash
cp .env.example .env   # fill in the values
pnpm install
pnpm dev               # http://localhost:3000
```

For a phone or emulator, the API must be reachable from the device: use your Mac's LAN IP
(Android emulator: `http://10.0.2.2:3000`) as `EXPO_PUBLIC_API_URL` in the app.

## One-time setup

**Supabase**

1. Project Settings → API: copy the URL, anon key and service role key into `.env`.
2. Project Settings → Database → Connection string → _Transaction pooler_ (port 6543) → `DATABASE_URL`.
3. Authentication → Providers → Google: enable it and paste the Google client ID (and secret).
   This is what lets the backend turn a Google login into a Supabase session.

**Google Cloud Console** → Credentials → your _Web_ OAuth client → Authorized redirect URIs, add:

- `http://localhost:3000/auth/google/callback` (local)
- `https://<your-vercel-domain>/auth/google/callback` (production)

## Deploy to Vercel

1. Vercel → Add New Project → import this repo → set **Root Directory** to `backend`.
2. Add every variable from `.env.example` under Environment Variables.
   Set `API_URL` to the Vercel domain (no trailing slash).
3. Deploy. `vercel.json` pins the function to Singapore (`sin1`); change it if your
   Supabase project is in another region.

The code has no Vercel-specific logic beyond `api/index.ts`. To move to Railway, Fly or a
container later, run `pnpm start` (or add a Dockerfile that does) and point `API_URL` at it.
