# RouteWise — Project Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Database Schema](#5-database-schema)
6. [Mobile App (Expo)](#6-mobile-app-expo)
7. [Admin Dashboard (Next.js)](#7-admin-dashboard-nextjs)
8. [Route Calculation Engine](#8-route-calculation-engine)
9. [Fare Calculation](#9-fare-calculation)
10. [Authentication](#10-authentication)
11. [API Reference](#11-api-reference)
12. [Type Definitions](#12-type-definitions)
13. [External Services](#13-external-services)
14. [Environment Variables](#14-environment-variables)
15. [Deployment](#15-deployment)
16. [Feature Status](#16-feature-status)

---

## 1. Project Overview

**RouteWise** is a jeepney navigation app for Cebu City, Philippines. It helps commuters find the best jeepney routes between two locations, handles route transfers, and estimates fares — all without requiring a user account.

**Core problem it solves**: Jeepney routes in Cebu are complex, bidirectional, and not well-documented. RouteWise maps these routes spatially using PostGIS, then calculates optimal paths from any origin to any destination.

**Target users**: Daily commuters in Cebu City who ride jeepneys.

---

## 2. Repository Structure

Three independent projects in one repo (no workspace linking — each has its own `package.json`, lockfile and `node_modules`).

```
routewise/
├── backend/                        # API for the mobile app and admin (Hono on Node, deployed to Vercel)
│   ├── api/index.ts                # Vercel entry point
│   ├── src/
│   │   ├── app.ts                  # Hono app, route mounting, error handling
│   │   ├── server.ts               # Local / container entry point
│   │   ├── routes/
│   │   │   ├── auth.ts             # Email + Google sign-in, refresh, logout
│   │   │   ├── me.ts               # Profile
│   │   │   ├── savedRoutes.ts      # Saved routes
│   │   │   ├── routes.ts           # Jeepney routes, nearest point, calculation
│   │   │   ├── contributions.ts    # Submit a route for review (any signed-in user)
│   │   │   └── admin.ts            # /admin/* — routes, contribution review, users, database
│   │   ├── middleware/
│   │   │   ├── auth.ts             # requireAuth: Bearer token check (Supabase session)
│   │   │   └── admin.ts            # requireAdmin: requireAuth + users.is_admin
│   │   ├── services/
│   │   │   ├── users.ts            # users table access
│   │   │   ├── admin/              # routes, contributions, users, database (dashboard data)
│   │   │   ├── routing/            # calculateRoutes, calculateMultiRoutes, queries
│   │   │   └── geo/routeCases/
│   │   │       ├── singleRoute/    # Cases 1, 3, 4, 5
│   │   │       └── multiRoute/     # Cases 6, 7, 8
│   │   ├── lib/                    # db (pg pool), supabase clients, HttpError, log
│   │   └── types/GeoTypes.ts
│   ├── db/                         # SQL for the PostGIS functions
│   ├── vercel.json                 # Region sin1; rewrites every path to api/index.ts
│   └── .env
│
├── admin/                          # Admin dashboard (Next.js), frontend only
│   ├── src/
│   │   ├── app/
│   │   │   ├── (dashboard)/        # dashboard, routes, users, database, analytics, settings
│   │   │   ├── contribute/         # Route contribution pages (browse, routes)
│   │   │   └── page.tsx            # Login (Supabase Auth in the browser)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api.ts              # The only place that talks to the backend
│   │   │   ├── maps/               # Google Maps JS loader, geometry, styles
│   │   │   ├── routes/             # KML import, point helpers, types
│   │   │   └── supabase/           # Browser client + session middleware (login only)
│   │   └── types/
│   ├── middleware.ts               # Redirects signed-out users to the login page
│   └── .env
│
├── app/                            # React Native mobile app (Expo), frontend only
│   ├── app/
│   │   ├── (tabs)/                 # Tab-based navigation
│   │   │   ├── index.tsx           # Map tab
│   │   │   ├── routes.tsx          # Routes list tab
│   │   │   ├── saved.tsx           # Saved routes tab
│   │   │   └── account.tsx         # Account/profile tab
│   │   ├── (screens)/
│   │   │   └── MapScreen.tsx       # Main map screen
│   │   └── services/
│   │       ├── maps/               # Snap-to-road via the API
│   │       └── routes/             # Route calculation via the API
│   ├── components/
│   │   └── Map/
│   │       ├── NativeMap.tsx
│   │       └── LocationSelector/
│   │           └── SelectorContent.tsx
│   ├── context/
│   │   ├── map-context.tsx         # Map state (pins, routes, selection)
│   │   └── auth.tsx                # Auth state (email + Google via the API)
│   ├── lib/
│   │   └── api.ts                  # The only place that talks to the backend
│   ├── types/
│   │   └── GeoTypes.ts
│   └── .env                        # EXPO_PUBLIC_API_URL
│
├── docs/
│   ├── DOCUMENTATION.md
│   ├── PRESENTATION.md
│   ├── context.md
│   └── task-list.md
└── README.md
```

---

## 3. Technology Stack

### Mobile App

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React Native + Expo | RN 0.81.5, Expo 54.0.23 |
| Navigation | Expo Router | 6.0.14 |
| Language | TypeScript | 5.9.2 |
| Maps | expo-maps (Google Maps on Android, Apple Maps on iOS) | 0.12.8 |
| Auth | Backend sessions (Supabase Auth via the API); no Supabase SDK in the app | — |
| OAuth browser | Expo Web Browser | 15.0.9 |
| Secure Storage | Expo Secure Store (tokens, cached profile) | 15.0.7 |
| Local Storage | AsyncStorage (UI flags only) | 2.2.0 |
| Location | Expo Location | 19.0.7 |
| Gestures | React Native Gesture Handler | 2.28.0 |
| Animations | React Native Reanimated | 4.1.1 |

### Backend API

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Hono (`@hono/node-server` locally, `hono/vercel` on Vercel) | 4.7.0 |
| Runtime | Node | 22 |
| Language | TypeScript (run with tsx) | 5.8.0 / tsx 4.19.0 |
| Database Client | pg (node-postgres) | 8.14.0 |
| Auth / Supabase | @supabase/supabase-js (anon + service-role clients) | 2.49.0 |

### Admin Dashboard

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js (App Router) | 15.5.9 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 4 |
| Maps | Google Maps JS API (`@googlemaps/js-api-loader`) | 2.0.2 |
| Auth | @supabase/ssr + @supabase/supabase-js (login only) | 0.7.0 / 2.76.1 |
| Icons | Lucide React | 0.555.0 |

### Tooling

| Tool | Notes |
|------|-------|
| pnpm | Package manager in all three projects and at the repo root |
| Prettier 3.5 | 2 spaces, single quotes, semicolons, 100 columns; `pnpm format` at the root |
| ESLint 9 (app, admin) / 10 (backend) | `console.log` and explicit `any` are errors |
| TypeScript `strict` | `pnpm typecheck` at the root runs `tsc` in all three projects |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Supabase | PostgreSQL database + Auth |
| PostGIS | Spatial queries and geometry operations |
| Vercel | Backend API hosting (region `sin1`) and admin dashboard hosting |
| Expo EAS | Mobile app builds |
| Google Maps | Map rendering (admin map editor; native map in the mobile app) |

---

## 4. Architecture Overview

```
┌──────────────────────────────┐   ┌──────────────────────────────┐
│      Mobile App (Expo)       │   │   Admin Dashboard (Next.js)  │
│      frontend only           │   │   frontend only              │
│                              │   │                              │
│  lib/api.ts                  │   │  src/lib/api.ts              │
│  Bearer: session from /auth  │   │  Bearer: Supabase session    │
└──────────────┬───────────────┘   └──────────────┬───────────────┘
               │ HTTPS (EXPO_PUBLIC_API_URL)      │ HTTPS (NEXT_PUBLIC_API_URL)
               ↓                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│            Backend API (Hono on Node, Vercel sin1)              │
│                                                                 │
│  /auth/*  /me  /saved-routes  /routes/*  /contributions  /admin/*│
│  requireAuth (Supabase token) · requireAdmin (users.is_admin)   │
│                                                                 │
│  POST /routes/calculate                                         │
│       ↓                                                         │
│  Case Handler Chain (1 → 5 → 8 → 7 → 6)                         │
│       ↓                                                         │
│  PostGIS Spatial Queries                                        │
│       ↓                                                         │
│  Returns: route results (see §11)                               │
└──────────────┬──────────────────────────────────┬───────────────┘
               │ SQL (pg, transaction pooler)     │ Supabase Auth +
               ↓                                  ↓ service-role client
┌─────────────────────────────────────────────────────────────────┐
│              Supabase: PostgreSQL + PostGIS, Auth                │
│                                                                 │
│  jeepney_routes (geom_forward / geom_backward linestrings)      │
│  users · saved_routes · route_contributions                     │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Route calculation is public** — `POST /routes/calculate` does not require a user account. Auth is only needed for the profile, saved routes, contributions and admin.
- **Frontends hold no secrets** — Neither the mobile app nor the admin dashboard has a database connection, service-role key or Google client secret. Every data request goes through the backend; the only key in a frontend is the public Supabase key the admin uses to sign in.
- **One backend for both frontends** — The mobile app and the admin dashboard call the same Hono API. Admin-only endpoints live under `/admin/*` behind `requireAdmin`.
- **Modular case handlers** — Each route scenario (normal, opposite side, transfer) has its own handler class. New cases can be added without touching existing code.
- **PostGIS for all spatial logic** — Distance checks, line interpolation, and point snapping all run at the database level for performance.

---

## 5. Database Schema

### `jeepney_routes`

The main table storing all jeepney route geometries.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `route_code` | VARCHAR(10) | Short route identifier (e.g. "01A") |
| `start_point_name` | VARCHAR(255) | Human-readable start terminal |
| `end_point_name` | VARCHAR(255) | Human-readable end terminal |
| `geom_forward` | GEOMETRY(LineString, 4326) | Forward direction geometry |
| `geom_backward` | GEOMETRY(LineString, 4326) | Reverse direction geometry (optional) |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

**Spatial indexes:**
```sql
CREATE INDEX idx_routes_geom_forward  ON jeepney_routes USING GIST(geom_forward);
CREATE INDEX idx_routes_geom_backward ON jeepney_routes USING GIST(geom_backward);
```

### `users`

App-level profile row. Its `id` is what `saved_routes.user_id` references — it is **not** the Supabase auth uid. The backend creates the row on first sign-in (`ensureProfile`).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | STRING | Unique email address |
| `full_name` | STRING | Display name |
| `avatar_url` / `picture` | STRING | Profile picture URL |
| `google_id` | STRING | Google OAuth ID |
| `auth_provider` | STRING | `google` or `email` |
| `commuter` | STRING | User category (set via `PATCH /me`) |
| `is_admin` | BOOLEAN | Admin access flag — checked by `requireAdmin` |
| `login_count` | INTEGER | Total logins |
| `last_login` | TIMESTAMP | Most recent login |
| `created_at` | TIMESTAMP | Account creation |
| `updated_at` | TIMESTAMP | Last update |

### `saved_routes`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users |
| `route_name` | STRING | User-defined name |
| `start_location` | STRING | Origin label |
| `end_location` | STRING | Destination label |
| `start_lat` / `start_lng` | DOUBLE | Origin coordinates |
| `end_lat` / `end_lng` | DOUBLE | Destination coordinates |
| `jeepney_codes` | STRING[] | Route codes used |
| `total_fare` | DOUBLE | Estimated total fare |
| `transfer_points` | JSON | Transfer coordinates |
| `created_at` | TIMESTAMP | Save time |
| `updated_at` | TIMESTAMP | Last modification |

### `route_contributions`

Routes submitted for review (`POST /contributions`), reviewed under `/admin/contributions`.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `route_code` | STRING | Proposed route code |
| `contributor_name` / `contributor_email` | STRING | Who submitted it |
| `forward_geojson` | JSONB | LineString of `[lng, lat]` pairs |
| `start_point_name` / `end_point_name` | STRING | Terminal labels |
| `status` | STRING | `pending`, `approved`, `rejected`, `needs_revision` |
| `review_notes` | STRING | Reviewer comment |
| `reviewed_at` / `transferred_at` | TIMESTAMP | Review / approval time |
| `transferred_route_id` | UUID | `jeepney_routes` row created on approval |
| `created_at` | TIMESTAMP | Submission time |

---

## 6. Mobile App (Expo)

### Screens

#### Map Tab (`app/(tabs)/index.tsx`)
Entry point for the main map experience. Renders `MapScreen`.

#### MapScreen (`app/(screens)/MapScreen.tsx`)
The primary UI. Responsibilities:
- Renders the interactive Google Map (`NativeMap`)
- Manages pin placement mode (animated crosshair)
- Shows/hides the location selector modal (bottom sheet)
- Handles swipe gestures via `PanResponder`
- Fires `onCalculate` when both pins are placed

#### Routes Tab (`app/(tabs)/routes.tsx`)
Displays a list of all available jeepney routes (`GET /routes`). Allows the user to tap a route and view it on the map (`GET /routes/:id`).

#### Saved Routes Tab (`app/(tabs)/saved.tsx`)
Shows the signed-in user's saved routes from `GET /saved-routes`; the backend scopes results to the caller. Signed-out users see an empty list.

#### Account Tab (`app/(tabs)/account.tsx`)
Profile view. Shows user info when logged in; otherwise a login modal with email/password and Google sign-in.

---

### Key Components

#### `NativeMap.tsx`
Wraps `expo-maps` `GoogleMaps`. Handles:
- Rendering Point A and Point B markers
- Drawing polylines for calculated routes (green = single, green+red = transfer)
- Capturing the map center coordinate for pin placement

#### `SelectorContent.tsx`
Bottom sheet modal. Responsibilities:
- Activating pin placement mode for A and B
- Triggering route calculation
- Rendering `RouteCard` for each result
- Showing fare and distance summaries

#### `RouteCard.tsx`
Displays a single route option with route code, distance, estimated fare, and transfer info.

---

### State Management (Context)

#### `MapPointsContext` (`context/map-context.tsx`)

```typescript
{
    pointA: LatLng | null
    pointB: LatLng | null
    setPointA: (p: LatLng) => void
    setPointB: (p: LatLng) => void
    isPointAB: boolean                     // true = selecting A, false = selecting B
    isPinPlacementEnabled: boolean
    routes: GoogleMapsPolyline[]           // Polylines shown on map
    results: MappedGeoRouteResult[]        // Calculated route results
    selectedRouteIndex: number | null
    isRouteFromList: boolean
    selectedRouteInfo: { id: string; name: string } | null
}
```

#### `AuthContext` (`context/auth.tsx`)

```typescript
{
    user: AuthUser | null
    isLoading: boolean
    error: string | null
    signIn: () => Promise<void>                                   // Google, via the system browser
    signInWithEmail: (email: string, password: string) => Promise<void>
    signUpWithEmail: (email: string, password: string) => Promise<{ requiresConfirmation: boolean }>
    signOut: () => Promise<void>
    updateUser: (updates: Partial<AuthUser>) => Promise<void>
    refreshProfile: () => Promise<void>
}
```

Tokens live in Expo Secure Store (`lib/api.ts` `tokens`), alongside a cached copy of the profile so the account screen renders on cold start while `/me` is re-fetched.

---

### Client-Side Route Calculation Flow

```
User confirms pin placement
    ↓
calculatePossibleRoutes(from, to)
    ↓
adjustToNearestRoad(from) + adjustToNearestRoad(to)   ← POST /routes/nearest-point
    ↓ (falls back to original coords on failure)
api.routes.calculate(from, to)                        ← POST /routes/calculate
    ↓
Parse MappedGeoRouteResult[]
    ↓
Update MapPointsContext.results
    ↓
SelectorContent renders RouteCards
    ↓
NativeMap draws polylines
```

All requests go through `lib/api.ts` (`apiFetch`), which prefixes `EXPO_PUBLIC_API_URL`, attaches the bearer token when one is stored, and retries once after a token refresh on `401`.

---

## 7. Admin Dashboard (Next.js)

The dashboard is a frontend only. It has no API routes and no database connection; every read and write goes to the backend's `/admin/*` endpoints (plus the public `/routes/catalog` and the signed-in `/contributions` for the contribute pages).

### Auth Middleware

`middleware.ts` runs on all requests. It calls `updateSession()` which refreshes the Supabase cookie session and:
- Redirects signed-out users to `/` (login page) for every path except `/` and `/auth/*`
- Redirects signed-in users from `/` to `/dashboard`

```typescript
// admin/src/lib/supabase/middleware.ts
if (pathname !== '/' && !user && !pathname.startsWith('/auth')) {
    redirect to "/"
}
if (pathname === '/' && user) {
    redirect to "/dashboard"
}
```

This only gates the pages. Authorisation happens on the backend: a signed-in user whose `users.is_admin` is false gets `403` from every `/admin/*` call.

### Backend Access (`src/lib/api.ts`)

The only place the dashboard talks to the backend. `apiFetch` reads the signed-in user's Supabase `access_token` from the browser client (`lib/supabase/component.ts`), sends it as `Authorization: Bearer`, and throws `ApiError` on non-2xx responses. Endpoints are grouped as `api.routes`, `api.contributions`, `api.users` and `api.database` (see §11).

---

## 8. Route Calculation Engine

The engine lives in `backend/src/services/geo/routeCases/`, driven by `backend/src/services/routing/calculateRoutes.ts` (`POST /routes/calculate`). It uses a **chain of responsibility** pattern — handlers are tried in order, and all applicable results are collected.

`backend/src/services/routing/calculateMultiRoutes.ts` (`POST /routes/calculate-multi`) is a separate, handler-free search that pairs every route near the origin with every route near the destination and returns the five shortest two-jeep combinations.

### Handler Execution Order

```
POST /routes/calculate
    ↓
Case 1  - Normal Forward          (most common)
Case 5  - Both Pins Opposite Side
Case 8  - Transfer + End Opposite
Case 7  - Transfer + Start Opposite
Case 6  - Simple 2-Jeep Transfer  (fallback)
    ↓
Collect all results → sort by distance → deduplicate by routeId (keep the shorter)
```

### Route Cases

#### Single-Route Cases

| Case | Name | Description |
|------|------|-------------|
| 1 | Normal Forward | Both pins on correct side, direct travel |
| 3 | Opposite Start | Origin pin is on the wrong side of the road |
| 4 | Opposite End | Destination pin is on the wrong side |
| 5 | Both Opposite | Both pins on opposite side of road |
| — | Loop Required | Destination appears before origin on the route — must loop around (`requiresLoop`) |

Cases 3 and 4 have handlers in `singleRoute/` but are not currently in the chain above.

#### Multi-Route (Transfer) Cases

| Case | Name | Description |
|------|------|-------------|
| 6 | Simple Transfer | Take jeepney A to a transfer point, then jeepney B |
| 7 | Transfer + Start Opposite | Case 6 but origin is on wrong road side |
| 8 | Transfer + End Opposite | Case 6 but destination is on wrong road side |

### Base Handler Interface

```typescript
// backend/src/services/geo/routeCases/BaseHandler.ts
abstract class BaseRouteHandler {
    protected FARE_PER_KM = 2.2
    protected MINIMUM_FARE = 13

    abstract getCaseName(): string
    abstract canHandle(from: LatLng, to: LatLng): Promise<boolean>
    abstract calculate(from: LatLng, to: LatLng): Promise<RouteCalculationResult | null>

    protected calculateFare(distanceInMeters: number): number
    protected parseGeoJson(geoJson: string): LatLng[]
    protected detectSidesForRoutes(from, to, maxDistance = 100): Promise<SideDetectionResult[]>
    protected detectMultiplePasses(point, routeId)       // routes that pass a point more than once
    protected findNearestRoutes(point, maxDistance = 50)
}
```

Handlers run SQL through `lib/db.ts` (`query`). SQL for the helper PostGIS functions some handlers call is in `backend/db/`.

### Key PostGIS Functions Used

| Function | Purpose |
|----------|---------|
| `ST_DWithin` | Find routes within N meters of a point |
| `ST_LineLocatePoint` | Get position (0–1) of a point along a line |
| `ST_LineInterpolatePoint` | Get the point at a position (0–1) along a line |
| `ST_LineSubstring` | Extract a segment of a linestring |
| `ST_Distance` / `ST_Length` | Distance and segment length in meters (geography type) |
| `ST_ClosestPoint` | Find nearest point on a geometry to a given point |
| `ST_Azimuth` | Bearing between two points — used for road-side detection |
| `ST_AsGeoJSON` | Return a segment as GeoJSON for the client |
| `ST_MakePoint` | Create a point from longitude/latitude |
| `ST_SetSRID` | Assign coordinate reference system (4326 = WGS84) |

### Route Search Algorithm (Case 1)

```sql
SELECT DISTINCT
    r.id,
    r.route_code,
    CONCAT(r.start_point_name, ' - ', r.end_point_name) as route_name,
    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($lon_a, $lat_a), 4326)) as start_pos,
    ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($lon_b, $lat_b), 4326)) as end_pos,
    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($lon_a, $lat_a), 4326)::geography) as start_dist,
    ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($lon_b, $lat_b), 4326)::geography) as end_dist
FROM jeepney_routes r
WHERE
    ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($lon_a, $lat_a), 4326)::geography, 500)
    AND ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($lon_b, $lat_b), 4326)::geography, 500)
ORDER BY route_code;
```

Routes are considered valid when `start_pos < end_pos` (origin appears before destination on the route). Otherwise, the "opposite side" or "loop" cases apply.

With `LOG_LEVEL=debug` the backend prints the full handler trace (routes found, each handler's results, final ordering).

---

## 9. Fare Calculation

Based on Cebu City Land Transportation Franchising and Regulatory Board (LTFRB) rates: a minimum fare, then a per-kilometre rate rounded up to the next peso.

```typescript
// backend/src/services/geo/routeCases/BaseHandler.ts
// (routing/calculateMultiRoutes.ts has the same formula as a local function)
protected FARE_PER_KM  = 2.2;   // PHP per km
protected MINIMUM_FARE = 13;    // PHP

protected calculateFare(distanceInMeters: number): number {
    const distanceInKm = distanceInMeters / 1000;
    return Math.max(this.MINIMUM_FARE, Math.ceil(distanceInKm * this.FARE_PER_KM));
}
```

**Examples:**

| Distance | Fare |
|----------|------|
| 1 km | ₱13.00 |
| 5 km | ₱13.00 |
| 6 km | ₱14.00 |
| 8 km | ₱18.00 |
| 10 km | ₱22.00 |

For transfer routes, fares are calculated per segment and summed (`totalFare`).

---

## 10. Authentication

Both frontends end up with a **Supabase Auth session**; only the backend talks to Supabase with the anon or service-role key. Sessions look like `{ access_token, refresh_token, expires_in, expires_at, user }`.

### Mobile: Email / Password

1. `LoginForm` / `SignupForm` call `api.auth.login` or `api.auth.signup` (`POST /auth/login`, `POST /auth/signup`)
2. The backend calls Supabase `signInWithPassword` / `signUp` with the anon key and ensures a `users` row exists
3. The session is returned to the app; tokens go into Expo Secure Store
4. If email confirmation is on, signup returns `202 { requires_confirmation: true }` and no session

### Mobile: Google

1. User taps "Sign in with Google" in the Account tab
2. `context/auth.tsx` opens `GET /auth/google/authorize?redirect_uri=routewise://&state=…` in the system browser (`expo-web-browser`)
3. Google redirects to the backend's `/auth/google/callback`, which exchanges the code server-side (client secret stays on the backend)
4. The backend turns the Google `id_token` into a Supabase session (`signInWithIdToken`) and upserts the `users` row (name, picture, `google_id`)
5. The backend deep-links back to `routewise://?access_token=…&refresh_token=…`; the app stores the tokens and fetches `/me`

The `routewise` scheme is set in `app.json` and must be listed in the backend's `ALLOWED_REDIRECT_URIS`.

### Mobile: Session Handling

- `lib/api.ts` attaches `Authorization: Bearer <access_token>` to every request unless `auth: false`
- On `401` it calls `POST /auth/refresh` once (concurrent 401s share one refresh) and retries; if the refresh fails it clears the tokens and signs the user out
- `POST /auth/logout` revokes the session server-side; the app clears Secure Store either way

### Backend: `requireAuth` / `requireAdmin`

- `requireAuth` (`middleware/auth.ts`) validates the bearer token with `supabaseAdmin.auth.getUser`, loads or creates the caller's `users` row, and sets `profile`, `authUser` and `accessToken` on the context. `profile.id` is the app user id, not the Supabase auth uid.
- `requireAdmin` (`middleware/admin.ts`) runs `requireAuth` and then requires `profile.is_admin`, else `403`.

### Admin Dashboard

1. The login page (`src/app/page.tsx`) calls Supabase `signInWithPassword` in the browser with the **public** URL and publishable key; `@supabase/ssr` keeps the session in cookies
2. `middleware.ts` keeps signed-out browsers on the login page
3. `src/lib/api.ts` sends the session's `access_token` as a bearer to the backend; `/admin/*` additionally requires `users.is_admin`

### Access Control

- **Route calculation, route listing, nearest point** — No auth required. Public API.
- **Profile, saved routes, contributions** — Requires a signed-in user (bearer token).
- **`/admin/*`** — Requires a signed-in user with `users.is_admin = true` (`403` otherwise).
- **Admin dashboard pages** — Requires a Supabase session in the browser; data access is still gated by the backend.

---

## 11. API Reference

All endpoints are on the backend (`backend/`). The base URL is `EXPO_PUBLIC_API_URL` in the mobile app and `NEXT_PUBLIC_API_URL` in the admin dashboard — `http://localhost:3000` when running locally, the Vercel domain in production.

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
| POST           | `/routes/nearest-point`                                    | –      | `{ latitude, longitude, maxDistance? }`                               |
| POST           | `/routes/calculate`                                        | –      | `{ from, to }` → single and transfer route options                    |
| POST           | `/routes/calculate-multi`                                  | –      | `{ from, to }` → two-jeep combinations                                |
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

Send `Authorization: Bearer <access_token>` on protected routes; `401` means refresh and retry, `403` means the caller is not an admin. Errors are JSON: `{ "error": "<message>", ... }`.

### Route Calculation

#### `POST /routes/calculate`
Primary route calculation endpoint (handler chain, §8).

**Request:**
```json
{
  "from": { "latitude": 10.3089, "longitude": 123.8932 },
  "to":   { "latitude": 10.3123, "longitude": 123.9169 }
}
```

**Response (200):** Array of route results, shortest first
```json
[
  {
    "routeId": "uuid",
    "routeCode": "01A",
    "routeName": "Carbon - SM City",
    "coordinates": [{ "latitude": 10.3089, "longitude": 123.8932 }, ...],
    "distance": 3200,
    "fare": 13,
    "caseName": "Case1Normal",
    "isTransfer": false,
    "requiresLoop": false,
    "optimized": false,
    "debugInfo": { "coordinateCount": 212 }
  }
]
```

Transfer results (Cases 6–8) also carry `isTransfer: true`, `firstRoute`, `secondRoute`, `boardingWalk` and `alightingWalk`.

**Response (400):** `{ "error": "Missing coordinates" }`

**Response (404):** No routes found
```json
{ "error": "No routes available", "debugInfo": { "triedHandlers": ["Case1Normal", ...] } }
```

**Response (500):** Server/database error
```json
{ "error": "Failed to calculate route", "details": "..." }
```

---

#### `POST /routes/calculate-multi`
Explicit 2-jeepney transfer calculation (no handler chain; up to 5 combinations, shortest first).

**Request:** Same as `/routes/calculate`

**Response (200):**
```json
[
  {
    "routeId": "01A-04L",
    "routeName": "01A to 04L",
    "distanceMeters": 5400,
    "isTransfer": true,
    "firstRoute":  { "routeId": "01A", "routeName": "Carbon - SM City", "coordinates": [...], "distance": 2100, "fare": 13 },
    "secondRoute": { "routeId": "04L", "routeName": "...",              "coordinates": [...], "distance": 3300, "fare": 13 },
    "transferPoint": { "latitude": 10.31, "longitude": 123.90 },
    "totalFare": 26,
    "transferDistance": 12.4
  }
]
```

**Response (404):** `{ "error": "No routes available for journey" }`

---

#### `POST /routes/nearest-point`
Snaps a coordinate to the nearest point on any route (PostGIS). The mobile app calls this before `/routes/calculate`.

**Request:**
```json
{ "latitude": 10.3089, "longitude": 123.8932, "maxDistance": 50 }
```

**Response:**
```json
{
  "found": true,
  "snapped": true,
  "original": { "latitude": 10.3089, "longitude": 123.8932 },
  "nearest": { "latitude": 10.3087, "longitude": 123.8930, "route_id": "uuid", "route_code": "01A", "route_name": "...", "distance": 18.2, "position_on_route": 0.42 }
}
```

---

### Saved Routes

`POST /saved-routes` takes the `saved_routes` columns minus `id`, `user_id` and `created_at`; `start_lat`, `start_lng`, `end_lat` and `end_lng` are required numbers. `user_id` always comes from the bearer token. `DELETE /saved-routes/:id` returns `204`, or `404` if the route is not the caller's.

### Admin

`/admin/routes` and `/admin/contributions` responses are wrapped: `{ "success": true, "routes": [...] }`, `{ "success": true, "route": {...} }`, `{ "success": true, "contributions": [...] }`. Route input is `{ route_code, start_point_name, end_point_name, coordinates_forward: [[lng, lat], ...] }`. `/admin/users` returns plain rows.

---

## 12. Type Definitions

### `LatLng`
```typescript
interface LatLng {
    latitude: number
    longitude: number
}
```

### `MappedGeoRouteResult` (`app/types/GeoTypes.ts`)
```typescript
interface MappedGeoRouteResult {
    routeId: string
    routeCode?: string
    routeName?: string
    fare: number
    totalFare?: number                // Transfer routes
    distance?: number                 // /routes/calculate
    distanceMeters?: number           // /routes/calculate-multi
    coordinates?: LatLng[]
    caseName?: string
    isTransfer?: boolean
    firstRoute?: RouteSegmentInfo     // Populated for transfer routes
    secondRoute?: RouteSegmentInfo    // Populated for transfer routes
    transferPoint?: LatLng
    requiresLoop?: boolean
    optimized?: boolean
    boardingWalk?: number             // Meters from pin A to nearest stop
    alightingWalk?: number            // Meters from nearest stop to pin B
    debugInfo?: Record<string, unknown>
}
```

### `RouteSegmentInfo`
```typescript
interface RouteSegmentInfo {
    routeId: string
    routeCode: string
    routeName: string
    coordinates: LatLng[]
    distance: number
    fare: number
    startPosition?: number    // 0–1, position along route line
    endPosition?: number
}
```

### `RouteCalculationResult` (internal, backend)
```typescript
// backend/src/services/geo/routeCases/BaseHandler.ts
interface RouteCalculationResult {
    caseName: string
    segments: RouteSegment[]
    totalDistance: number
    totalFare: number
    transferPoints?: LatLng[]
    confidence: number
    debugInfo?: Record<string, unknown>
}
```

### `AuthUser` / `Session` (`app/lib/api.ts`, mirrored from `backend/src/services/users.ts`)
```typescript
type AuthUser = {
    id: string                // users.id (app user id)
    email: string
    name: string | null
    picture: string | null
    email_verified?: boolean
    provider?: string         // 'email' | 'google'
    commuter?: string | null
}

type Session = {
    access_token: string
    refresh_token: string
    expires_in: number
    expires_at?: number
    user: AuthUser
}
```

---

## 13. External Services

### Supabase
- **Database**: PostgreSQL 15+ with PostGIS extension
- **Auth**: Email/password and Google (the Google provider must be enabled in Supabase Auth with the backend's client ID). Sessions are Supabase JWTs; the mobile app obtains them through the backend, the admin dashboard directly with the public key.
- **Connection**: The backend uses the transaction pooler (port 6543) as `DATABASE_URL`, with a small `pg` pool (max 3) per function instance. The service-role key never leaves the backend.
- **Project URL**: `https://xsddivvtndsljgcnwsve.supabase.co`

> **Note**: Free-tier Supabase projects pause after 1 week of inactivity. If route calculation returns "Tenant or user not found", check the Supabase dashboard and restore the project.

### Google
| API / Key | Used For |
|-----------|---------|
| Maps JavaScript API (`NEXT_PUBLIC_GMAPS_API`) | Admin map editor (`@googlemaps/js-api-loader`) |
| Maps SDK for Android (`app.json` → `android.config.googleMaps.apiKey`) | Native map in the mobile app via `expo-maps` |
| OAuth Web client (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, backend only) | Google sign-in; `<API_URL>/auth/google/callback` must be an authorised redirect URI |

Snap-to-road is done by `POST /routes/nearest-point` in PostGIS — the Roads and Geocoding APIs are not used.

### Expo Maps (Mobile)
Uses the `expo-maps` module which wraps the native Google Maps SDK on Android and Apple Maps on iOS. It needs a development client (`expo-dev-client`); the app does not run in Expo Go.

---

## 14. Environment Variables

Each project has a `.env.example`; copy it to `.env`. The backend holds every secret.

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Anon key — used for sign-in / refresh calls |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — token verification and table access (bypasses RLS) |
| `DATABASE_URL` | Supabase **transaction pooler** connection string (port 6543) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth web client |
| `API_URL` | Public URL of this API, no trailing slash; builds the Google redirect URI |
| `ALLOWED_REDIRECT_URIS` | Comma-separated deep-link URIs the Google callback may redirect to (`routewise://`) |
| `PORT` | Local dev port (default `3000`) |
| `LOG_LEVEL` | `debug` \| `info` \| `warn` \| `error` (default: `info` in production, `debug` otherwise) |

### Admin Dashboard (`admin/.env`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL, no trailing slash |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (login only) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (login only; public by design) |
| `NEXT_PUBLIC_GMAPS_API` | Google Maps JS API key for the map editor (browser key, restrict by HTTP referrer) |

### Mobile App (`app/.env`)

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend base URL — the app's only environment variable |

---

## 15. Deployment

### Development

All three projects use pnpm. Run `pnpm install` once at the repo root as well (Prettier and the root check scripts).

```bash
# Backend API
cd backend
cp .env.example .env    # fill in the values
pnpm install
pnpm dev                # http://localhost:3000

# Admin dashboard (Next picks the next free port if 3000 is taken)
cd admin
cp .env.example .env
pnpm install
pnpm dev

# Mobile app — development client, not Expo Go
cd app
cp .env.example .env    # set EXPO_PUBLIC_API_URL
pnpm install
pnpm ios                # or: pnpm android — first native build takes a few minutes
pnpm start              # after that; rebuild only for native changes
```

Before committing, from the repo root:

```bash
pnpm format        # Prettier, whole repo
pnpm lint          # ESLint in all three projects
pnpm typecheck     # tsc in all three projects
pnpm check         # all of the above
```

### Production

| Component | Platform | Notes |
|-----------|----------|-------|
| Backend API | Vercel (region `sin1`) | Root Directory `backend`; every variable from `backend/.env.example`; `API_URL` = the Vercel domain; add `<API_URL>/auth/google/callback` to the Google OAuth client |
| Admin Dashboard | Vercel | Root Directory `admin`; `NEXT_PUBLIC_*` variables only |
| Database | Supabase | PostgreSQL + PostGIS; use the transaction pooler URL in the backend |
| Mobile App | Expo EAS Build | Profiles `development`, `preview`, `production` in `eas.json`; `EXPO_PUBLIC_API_URL` = the backend's Vercel domain |

The backend has no Vercel-specific logic beyond `api/index.ts`; `pnpm start` runs the same app on any Node host.

### Connection: Mobile → Backend

The app reads `EXPO_PUBLIC_API_URL` (`app/constants.ts`) and nothing else. Set it per environment as listed in `app/.env.example`: `http://localhost:3000` for the iOS simulator with a local backend, the emulator's host alias for the Android emulator, your Mac's LAN IP for a physical device, and the Vercel domain for production. The backend must be reachable from the device, and `API_URL` on the backend must be the same public URL for Google sign-in to redirect correctly.

---

## 16. Feature Status

### Implemented

| Feature | Notes |
|---------|-------|
| Pin-to-pin route discovery | Place two pins, get jeepney options |
| Single-route calculation | Cases 1, 5 in the chain (3, 4 handlers exist, not wired) |
| Transfer route calculation | Cases 6, 7, 8 (2-jeepney), plus `/routes/calculate-multi` |
| Fare estimation | ₱13 minimum, ₱2.20/km rounded up |
| Walking distance to/from stops | `boardingWalk`, `alightingWalk` |
| Opposite-side detection | PostGIS-based, within 30m tolerance |
| Polyline rendering on map | Color-coded by route |
| Email/password sign-in | `/auth/signup`, `/auth/login` via the backend |
| Google Sign-In | Google OAuth through the backend; Supabase session |
| Saved routes | `/saved-routes` on the backend, per user |
| Routes list / browse | View all available routes |
| Admin dashboard | Route management (add/edit/delete, KML import), contribution review, user management, database browser |
| Route contribution (crowdsourcing) | Submit from the dashboard's Contribute pages (`POST /contributions`); mobile UI pending |
| Public API access | No account needed for route calculation |

### Planned / Not Yet Implemented

| Feature | Notes |
|---------|-------|
| Real-time jeepney tracking | GPS from drivers |
| E-wallet / fare payment | GCash, Maya integration |
| Voice navigation | Turn-by-turn audio |
| Offline mode | Cached routes without internet |
| Admin analytics | Ridership stats, popular routes |
| Multi-language support | Filipino/Cebuano localization |
| iOS support | Currently Android-focused |
