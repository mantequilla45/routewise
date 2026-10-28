import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants';
import { LatLng } from '@/types/GeoTypes';

// ---------------------------------------------------------------------------
// Types mirrored from backend/src
// ---------------------------------------------------------------------------

export type AuthUser = {
    id: string;
    email: string;
    name: string | null;
    picture: string | null;
    email_verified?: boolean;
    provider?: string;
    commuter?: string | null;
};

export type Session = {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at?: number;
    user: AuthUser;
};

export type SignupResult =
    | { session: Session; requiresConfirmation: false }
    | { session: null; requiresConfirmation: true };

export type SavedRouteRow = {
    id: string;
    user_id: string;
    route_name: string;
    start_location: string;
    end_location: string;
    start_lat: number;
    start_lng: number;
    end_lat: number;
    end_lng: number;
    jeepney_codes: string[];
    total_fare: number;
    transfer_points: any;
    created_at: string;
};

export type NewSavedRoute = Omit<SavedRouteRow, 'id' | 'user_id' | 'created_at'>;

export type RouteSummary = {
    id: string;
    route_id: string;
    route_code: string;
    route_color: string;
    created_at: string;
};

export type NearestPointResult = {
    found: boolean;
    original: LatLng;
    snapped?: boolean;
    nearest?: LatLng & {
        route_id: string;
        route_code: string;
        route_name: string;
        distance: number;
        position_on_route: number;
    };
};

export class ApiError extends Error {
    constructor(
        public status: number,
        public body: Record<string, any>,
    ) {
        super(typeof body?.error === 'string' ? body.error : `Request failed (${status})`);
    }
}

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

export const tokens = {
    async get() {
        const [access, refresh] = await Promise.all([
            SecureStore.getItemAsync(ACCESS_KEY),
            SecureStore.getItemAsync(REFRESH_KEY),
        ]);
        return { access, refresh };
    },
    async set(session: Pick<Session, 'access_token' | 'refresh_token'>) {
        await Promise.all([
            SecureStore.setItemAsync(ACCESS_KEY, session.access_token),
            SecureStore.setItemAsync(REFRESH_KEY, session.refresh_token),
        ]);
    },
    async clear() {
        await Promise.all([
            SecureStore.deleteItemAsync(ACCESS_KEY),
            SecureStore.deleteItemAsync(REFRESH_KEY),
        ]);
    },
};

// Called when a refresh fails, so the auth context can drop the user.
let onSessionExpired: (() => void) | null = null;
export function setOnSessionExpired(handler: (() => void) | null) {
    onSessionExpired = handler;
}

// ---------------------------------------------------------------------------
// Fetch wrapper with bearer auth and one automatic refresh+retry on 401
// ---------------------------------------------------------------------------

type RequestOptions = {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    auth?: boolean; // default true: attach the access token when we have one
};

async function rawRequest(path: string, options: RequestOptions, accessToken: string | null) {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    return fetch(`${API_URL}${path}`, {
        method: options.method ?? 'GET',
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
}

async function parseBody(res: Response) {
    if (res.status === 204) return undefined;
    const text = await res.text();
    if (!text) return undefined;
    try {
        return JSON.parse(text);
    } catch {
        return { error: text };
    }
}

// Concurrent 401s share one refresh call instead of racing each other.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
        const { refresh } = await tokens.get();
        if (!refresh) return null;
        try {
            const res = await rawRequest('/auth/refresh', { method: 'POST', body: { refresh_token: refresh } }, null);
            if (!res.ok) return null;
            const session = (await parseBody(res)) as Session;
            await tokens.set(session);
            return session.access_token;
        } catch {
            return null;
        }
    })();

    try {
        return await refreshInFlight;
    } finally {
        refreshInFlight = null;
    }
}

export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const useAuth = options.auth ?? true;
    let accessToken = useAuth ? (await tokens.get()).access : null;

    let res = await rawRequest(path, options, accessToken);

    if (res.status === 401 && useAuth && accessToken) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            res = await rawRequest(path, options, refreshed);
        } else {
            await tokens.clear();
            onSessionExpired?.();
        }
    }

    const body = await parseBody(res);
    if (!res.ok) {
        throw new ApiError(res.status, body ?? {});
    }
    return body as T;
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export const api = {
    auth: {
        login: (email: string, password: string) =>
            apiFetch<Session>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),

        signup: async (email: string, password: string): Promise<SignupResult> => {
            const data = await apiFetch<Session | { requires_confirmation: true }>('/auth/signup', {
                method: 'POST',
                body: { email, password },
                auth: false,
            });
            if ('requires_confirmation' in data) return { session: null, requiresConfirmation: true };
            return { session: data, requiresConfirmation: false };
        },

        logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),

        // Opened in the system browser; the backend redirects to `redirectUri` with tokens.
        googleAuthorizeUrl: (redirectUri: string, state: string) =>
            `${API_URL}/auth/google/authorize?` +
            new URLSearchParams({ redirect_uri: redirectUri, state, scope: 'openid email profile' }).toString(),
    },

    me: {
        get: () => apiFetch<AuthUser>('/me'),
        update: (updates: { name?: string; commuter?: string }) =>
            apiFetch<AuthUser>('/me', { method: 'PATCH', body: updates }),
    },

    savedRoutes: {
        list: () => apiFetch<SavedRouteRow[]>('/saved-routes'),
        // Partial because pin coordinates are optional on the client; the backend rejects missing ones.
        create: (route: Partial<NewSavedRoute>) =>
            apiFetch<SavedRouteRow>('/saved-routes', { method: 'POST', body: route }),
        remove: (id: string) => apiFetch<void>(`/saved-routes/${id}`, { method: 'DELETE' }),
    },

    routes: {
        list: () => apiFetch<RouteSummary[]>('/routes', { auth: false }),
        get: (id: string) => apiFetch<RouteSummary & { coordinates: LatLng[] }>(`/routes/${id}`, { auth: false }),
        nearestPoint: (point: LatLng, maxDistance: number) =>
            apiFetch<NearestPointResult>('/routes/nearest-point', {
                method: 'POST',
                body: { ...point, maxDistance },
                auth: false,
            }),
        calculate: (from: LatLng, to: LatLng) =>
            apiFetch<any[]>('/routes/calculate', { method: 'POST', body: { from, to }, auth: false }),
        calculateMulti: (from: LatLng, to: LatLng) =>
            apiFetch<any[]>('/routes/calculate-multi', { method: 'POST', body: { from, to }, auth: false }),
    },
};
