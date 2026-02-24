# RouteWise — Project Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Database Schema](#5-database-schema)
6. [Mobile App (Expo)](#6-mobile-app-expo)
7. [Admin Backend (Next.js)](#7-admin-backend-nextjs)
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

```
routewise/
├── admin/                          # Next.js Admin Panel & API Backend
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/                # REST API endpoints
│   │   │   │   ├── calculateRoutesV2/
│   │   │   │   ├── calculateRoutes/
│   │   │   │   ├── calculateMultiRoutes/
│   │   │   │   ├── adjustToRoad/
│   │   │   │   ├── routes/
│   │   │   │   └── users/
│   │   │   ├── dashboard/          # Admin dashboard pages
│   │   │   └── auth/               # Auth pages (login)
│   │   ├── services/
│   │   │   └── geo/
│   │   │       ├── routeCases/
│   │   │       │   ├── singleRoute/   # Cases 1, 3, 4, 5
│   │   │       │   └── multiRoute/    # Cases 6, 7, 8
│   │   │       └── bidirectionalRouteHandler.ts
│   │   ├── lib/
│   │   │   ├── db/                 # PostgreSQL connection
│   │   │   ├── fare/               # Fare calculation
│   │   │   └── supabase/           # Supabase client setup
│   │   └── types/
│   │       ├── GeoTypes.ts
│   │       └── database.ts
│   ├── middleware.ts               # Auth middleware (protects dashboard, not /api)
│   └── .env
│
├── app/                            # React Native Mobile App (Expo)
│   ├── app/
│   │   ├── (tabs)/                 # Tab-based navigation
│   │   │   ├── index.tsx           # Map tab
│   │   │   ├── routes.tsx          # Routes list tab
│   │   │   ├── saved.tsx           # Saved routes tab
│   │   │   └── account.tsx         # Account/profile tab
│   │   ├── (screens)/
│   │   │   └── MapScreen.tsx       # Main map screen
│   │   └── services/
│   │       ├── maps/               # Road adjustment, snap-to-road
│   │       └── routes/             # Route calculation client
│   ├── components/
│   │   └── Map/
│   │       ├── NativeMap.tsx
│   │       └── LocationSelector/
│   │           └── SelectorContent.tsx
│   ├── context/
│   │   ├── map-context.tsx         # Map state (pins, routes, selection)
│   │   └── hybrid-auth.tsx         # Auth state (Google OAuth)
│   ├── types/
│   │   └── GeoTypes.ts
│   └── lib/
│       └── supabase-client.ts
│
├── DOCUMENTATION.md
├── README.md
├── context.md
└── PRESENTATION.md
```

---

## 3. Technology Stack

### Mobile App

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React Native + Expo | RN 0.81.5, Expo 54.0.23 |
| Navigation | Expo Router | 6.0.14 |
| Language | TypeScript | 5.9.2 |
| Maps | expo-maps (Google Maps) | 0.12.8 |
| Auth | Supabase Auth | latest |
| Local Storage | AsyncStorage | — |
| Secure Storage | Expo Secure Store | 15.0.7 |
| Location | Expo Location | 19.0.7 |
| Gestures | React Native Gesture Handler | — |
| Animations | React Native Reanimated | — |

### Admin Panel & Backend

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js (App Router) | 15.5.4 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 4 |
| Maps | Google Maps JS API | 2.0.2 |
| Database Client | pg (node-postgres) | 8.16.3 |
| Auth | @supabase/ssr | 0.7.0 |
| Icons | Lucide React | 0.555.0 |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Supabase | PostgreSQL database + Auth |
| PostGIS | Spatial queries and geometry operations |
| Vercel | Admin panel hosting |
| Google Maps API | Map rendering, geocoding, road snapping |

---

## 4. Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│              Mobile App (Expo)                       │
│                                                      │
│  User places pins A & B on map                       │
│       ↓                                              │
│  calculatePossibleRoutes()                           │
│       ↓ Snap to road (Google Roads API)              │
│       ↓ POST /api/calculateRoutesV2                  │
└────────────────────┬─────────────────────────────────┘
                     │  HTTP (10.0.2.2:3000 in dev)
                     ↓
┌──────────────────────────────────────────────────────┐
│              Admin Backend (Next.js)                 │
│                                                      │
│  Route Calculation V2 Handler                        │
│       ↓                                              │
│  Case Handler Chain (1 → 5 → 8 → 7 → 6)            │
│       ↓                                              │
│  PostGIS Spatial Queries                             │
│       ↓                                              │
│  Returns: MappedGeoRouteResult[]                     │
└────────────────────┬─────────────────────────────────┘
                     │  SQL
                     ↓
┌──────────────────────────────────────────────────────┐
│       PostgreSQL + PostGIS (Supabase)                │
│                                                      │
│  jeepney_routes table with spatial geometry          │
│  geom_forward / geom_backward linestrings            │
└──────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **API routes are public** — Route calculation does not require a user account. Auth is only needed for saving routes.
- **Modular case handlers** — Each route scenario (normal, opposite side, transfer) has its own handler class. New cases can be added without touching existing code.
- **PostGIS for all spatial logic** — Distance checks, line interpolation, and point snapping all run at the database level for performance.
- **Next.js as combined backend** — The admin panel and the mobile app's API backend are the same Next.js app. The dashboard is protected by auth; the `/api` routes are open.

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

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | STRING | Unique email address |
| `full_name` | STRING | Display name |
| `avatar_url` | STRING | Profile picture URL |
| `google_id` | STRING | Google OAuth ID |
| `auth_provider` | STRING | `google` or `email` |
| `commuter_type` | STRING | User category |
| `is_admin` | BOOLEAN | Admin access flag |
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
Displays a list of all available jeepney routes. Allows the user to tap a route and view it on the map.

#### Saved Routes Tab (`app/(tabs)/saved.tsx`)
Shows routes the user has saved. Loads from AsyncStorage locally; syncs with Supabase when logged in.

#### Account Tab (`app/(tabs)/account.tsx`)
Profile view. Shows user info when logged in, Google sign-in button when logged out.

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

#### `HybridAuthContext` (`context/hybrid-auth.tsx`)

```typescript
{
    user: AuthUser | null
    signIn: () => Promise<void>
    signOut: () => Promise<void>
    isLoading: boolean
    error: string | null
    updateUser: (updates: any) => Promise<void>
    refreshProfile: () => Promise<void>
}
```

---

### Client-Side Route Calculation Flow

```
User confirms pin placement
    ↓
calculatePossibleRoutes(from, to)
    ↓
adjustToNearestRoad(from) + adjustToNearestRoad(to)   ← Google Roads API
    ↓ (falls back to original coords on failure)
POST http://10.0.2.2:3000/api/calculateRoutesV2
    ↓
Parse MappedGeoRouteResult[]
    ↓
Update MapPointsContext.results
    ↓
SelectorContent renders RouteCards
    ↓
NativeMap draws polylines
```

---

## 7. Admin Backend (Next.js)

### Auth Middleware

`middleware.ts` runs on all requests. It calls `updateSession()` which refreshes the Supabase session and:
- Redirects unauthenticated users to `/` (login page) for all **non-API** routes
- Allows all `/api/*` requests through without auth (API routes are public)

```typescript
// admin/src/lib/supabase/middleware.ts
if (pathname !== "/" && !user && !pathname.startsWith("/auth") && !pathname.startsWith("/api")) {
    redirect to "/"
}
```

### Database Connection (`src/lib/db/db.ts`)

Uses `node-postgres` with a connection pool:
- Prefers `DATABASE_POOLER_URL` (Supabase PgBouncer, port 6543) over `DATABASE_URL`
- Pool size: 10 max connections
- Statement timeout: 60s
- Auto-retry on connection errors (up to 3 attempts)

---

## 8. Route Calculation Engine

The engine lives in `admin/src/services/geo/routeCases/`. It uses a **chain of responsibility** pattern — handlers are tried in order, and all applicable results are collected.

### Handler Execution Order

```
POST /api/calculateRoutesV2
    ↓
Case 1  - Normal Forward          (most common)
Case 5  - Both Pins Opposite Side
Case 8  - Transfer + End Opposite
Case 7  - Transfer + Start Opposite
Case 6  - Simple 2-Jeep Transfer  (fallback)
    ↓
Collect all results → deduplicate by routeId → sort by distance
```

### Route Cases

#### Single-Route Cases

| Case | Name | Description |
|------|------|-------------|
| 1 | Normal Forward | Both pins on correct side, direct travel |
| 3 | Opposite Start | Origin pin is on the wrong side of the road |
| 4 | Opposite End | Destination pin is on the wrong side |
| 5 | Both Opposite | Both pins on opposite side of road |
| — | Loop Required | Destination appears before origin on the route — must loop around |

#### Multi-Route (Transfer) Cases

| Case | Name | Description |
|------|------|-------------|
| 6 | Simple Transfer | Take jeepney A to a transfer point, then jeepney B |
| 7 | Transfer + Start Opposite | Case 6 but origin is on wrong road side |
| 8 | Transfer + End Opposite | Case 6 but destination is on wrong road side |

### Base Handler Interface

```typescript
abstract class BaseHandler {
    abstract getCaseName(): string
    abstract canHandle(from: LatLng, to: LatLng): Promise<boolean>
    abstract calculate(from: LatLng, to: LatLng): Promise<RouteCalculationResult | null>

    protected calculateFare(distanceMeters: number): number
    protected parseGeoJson(geoJson: string): LatLng[]
}
```

### Key PostGIS Functions Used

| Function | Purpose |
|----------|---------|
| `ST_DWithin` | Find routes within N meters of a point |
| `ST_LineLocatePoint` | Get position (0–1) of a point along a line |
| `ST_LineSubstring` | Extract a segment of a linestring |
| `ST_Distance` | Calculate distance in meters (geography type) |
| `ST_ClosestPoint` | Find nearest point on a geometry to a given point |
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

---

## 9. Fare Calculation

Based on Cebu City Land Transportation Franchising and Regulatory Board (LTFRB) rates.

```typescript
// admin/src/lib/fare/fareCalculation.ts
function calculateFare(distanceMeters: number): number {
    const baseFare        = 13;    // PHP, covers first 3 km
    const increment       = 1.80;  // PHP per additional km
    const baseDistanceKm  = 3;

    const distanceKm = distanceMeters / 1000;
    const extraKm    = Math.max(0, Math.floor(distanceKm - baseDistanceKm));
    return baseFare + extraKm * increment;
}
```

**Examples:**

| Distance | Fare |
|----------|------|
| 1 km | ₱13.00 |
| 3 km | ₱13.00 |
| 5 km | ₱16.60 |
| 8 km | ₱22.00 |
| 10 km | ₱25.60 |

For transfer routes, fares are calculated per segment and summed.

---

## 10. Authentication

### Flow

1. User taps "Sign in with Google" in the Account tab
2. App opens Google OAuth via Expo's auth session
3. Google returns an access token
4. App calls Google's `userinfo` API to get profile data
5. App upserts the user record in Supabase `users` table
6. Session stored in Expo Secure Store

### Access Control

- **Route calculation** — No auth required. Public API.
- **Saved routes (read/write)** — Requires authenticated user (user_id FK).
- **Admin dashboard** — Requires Supabase admin session.

---

## 11. API Reference

All endpoints are on the admin Next.js server (default: `http://10.0.2.2:3000` from Android emulator).

### Route Calculation

#### `POST /api/calculateRoutesV2`
Primary route calculation endpoint.

**Request:**
```json
{
  "from": { "latitude": 10.3089, "longitude": 123.8932 },
  "to":   { "latitude": 10.3123, "longitude": 123.9169 }
}
```

**Response (200):** Array of route results
```json
[
  {
    "routeId": "uuid",
    "routeCode": "01A",
    "routeName": "Carbon - SM City",
    "coordinates": [{ "latitude": 10.3089, "longitude": 123.8932 }, ...],
    "distance": 3200,
    "fare": 13.00,
    "caseName": "Case1Normal",
    "isTransfer": false,
    "boardingWalk": 42,
    "alightingWalk": 38
  }
]
```

**Response (404):** No routes found
```json
{ "error": "No routes available" }
```

**Response (500):** Server/database error
```json
{ "error": "Failed to calculate route", "details": "..." }
```

---

#### `POST /api/calculateMultiRoutes`
Explicit 2-jeepney transfer calculation.

**Request:** Same as V2
**Response:** Same shape as V2 but all results have `isTransfer: true`

---

#### `POST /api/adjustToRoad`
Snaps a coordinate to the nearest road.

**Request:**
```json
{ "latitude": 10.3089, "longitude": 123.8932 }
```

**Response:**
```json
{ "latitude": 10.3087, "longitude": 123.8930 }
```

---

### Route Management

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/routes/all` | All jeepney routes |
| `GET` | `/api/routes/display/[id]` | Single route with full geometry |
| `POST` | `/api/routes/add` | Add a new route |
| `POST` | `/api/routes/[id]/update` | Update a route |
| `POST` | `/api/routes/nearest-point` | Nearest route point to a coordinate |
| `POST` | `/api/routes/contribute` | Submit a route contribution |

---

### User Management

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/users` | List all users (admin only) |
| `GET` | `/api/users/[id]` | Get user by ID |

---

## 12. Type Definitions

### `LatLng`
```typescript
interface LatLng {
    latitude: number
    longitude: number
}
```

### `MappedGeoRouteResult`
```typescript
interface MappedGeoRouteResult {
    routeId: string
    routeCode?: string
    routeName?: string
    fare: number
    distanceMeters?: number
    coordinates?: LatLng[]
    caseName?: string
    isTransfer?: boolean
    firstRoute?: RouteSegmentInfo     // Populated for transfer routes
    secondRoute?: RouteSegmentInfo    // Populated for transfer routes
    transferPoint?: LatLng
    boardingWalk?: number             // Meters from pin A to nearest stop
    alightingWalk?: number            // Meters from nearest stop to pin B
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

### `RouteCalculationResult` (internal, admin)
```typescript
interface RouteCalculationResult {
    caseName: string
    segments: RouteSegment[]
    debugInfo?: Record<string, unknown>
}
```

---

## 13. External Services

### Supabase
- **Database**: PostgreSQL 15+ with PostGIS extension
- **Auth**: Google OAuth, session management, JWT tokens
- **Connection**: Uses PgBouncer pooler (port 6543) for serverless compatibility
- **Project URL**: `https://xsddivvtndsljgcnwsve.supabase.co`

> **Note**: Free-tier Supabase projects pause after 1 week of inactivity. If route calculation returns "Tenant or user not found", check the Supabase dashboard and restore the project.

### Google Maps API (Key: `NEXT_PUBLIC_GMAPS_API`)
| API | Used For |
|-----|---------|
| Maps JavaScript API | Admin panel map rendering |
| Roads API | Snap-to-road (`roadAdjustment.ts`) |
| Geocoding API | Address ↔ coordinates |

### Expo Maps (Mobile)
Uses the `expo-maps` module which wraps the native Google Maps SDK on Android and Apple Maps on iOS.

---

## 14. Environment Variables

### Admin Panel (`admin/.env`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `DATABASE_URL` | Direct PostgreSQL connection (port 5432) |
| `DATABASE_POOLER_URL` | Supabase pooler connection (port 6543) — preferred |
| `NEXT_PUBLIC_GMAPS_API` | Google Maps API key |

### Mobile App (`app/.env` or `app.json` / `eas.json`)

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps key for Expo Maps |

---

## 15. Deployment

### Development

```bash
# Start admin server (API backend)
cd admin
npm run dev        # Runs on http://localhost:3000

# Start mobile app
cd app
npx expo start     # Android emulator connects to 10.0.2.2:3000
```

### Production

| Component | Platform | Notes |
|-----------|----------|-------|
| Admin Panel + API | Vercel | Auto-deploys from main branch |
| Database | Supabase | PostgreSQL + PostGIS |
| Mobile App | Expo EAS Build | Distributed via APK or app stores |

### Connection: Mobile → Backend

In development, the Android emulator uses `10.0.2.2` to reach the host machine's `localhost`. In production, both `calculatePossibleRoutes.ts` and `calculateMultiRoutes.ts` should point to the Vercel deployment URL instead of `http://10.0.2.2:3000`.

---

## 16. Feature Status

### Implemented

| Feature | Notes |
|---------|-------|
| Pin-to-pin route discovery | Place two pins, get jeepney options |
| Single-route calculation | Cases 1, 3, 4, 5 |
| Transfer route calculation | Cases 6, 7, 8 (2-jeepney) |
| Fare estimation | Cebu LTFRB rates |
| Walking distance to/from stops | `boardingWalk`, `alightingWalk` |
| Opposite-side detection | PostGIS-based, within 30m tolerance |
| Polyline rendering on map | Color-coded by route |
| Google Sign-In | Google OAuth via Expo |
| Saved routes | AsyncStorage + Supabase sync |
| Routes list / browse | View all available routes |
| Admin dashboard | Route management, user management |
| Public API access | No account needed for route calculation |

### Planned / Not Yet Implemented

| Feature | Notes |
|---------|-------|
| Real-time jeepney tracking | GPS from drivers |
| E-wallet / fare payment | GCash, Maya integration |
| Voice navigation | Turn-by-turn audio |
| Offline mode | Cached routes without internet |
| Route contribution (crowdsourcing) | API exists, UI pending |
| Admin analytics | Ridership stats, popular routes |
| Multi-language support | Filipino/Cebuano localization |
| iOS support | Currently Android-focused |
