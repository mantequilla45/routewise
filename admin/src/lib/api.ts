import { createClient } from '@/lib/supabase/component';

// The only place the dashboard talks to the backend. Auth is the signed-in admin's
// Supabase access token, sent as a bearer; the backend checks users.is_admin.

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export type LngLatPair = [number, number];

export interface LineStringGeoJson {
  type: 'LineString';
  coordinates: LngLatPair[];
}

export interface RouteRow {
  id: string;
  route_code: string;
  start_point_name: string;
  end_point_name: string;
  forward_geojson?: LineStringGeoJson;
  created_at?: string;
  updated_at?: string;
}

export interface RouteInput {
  route_code: string;
  start_point_name: string;
  end_point_name: string;
  coordinates_forward: LngLatPair[];
}

export interface ContributionInput {
  route_code: string;
  contributor_name: string;
  contributor_email?: string;
  coordinates_forward: LngLatPair[];
}

export type ReviewStatus = 'approved' | 'rejected' | 'needs_revision';

export interface ApiErrorBody {
  error?: string;
  details?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody,
  ) {
    super(body?.error ?? `Request failed (${status})`);
  }
}

async function accessToken(): Promise<string | null> {
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token ?? null;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.auth ?? true) {
    const token = await accessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = { error: text };
  }

  if (!res.ok) throw new ApiError(res.status, (body ?? {}) as ApiErrorBody);
  return body as T;
}

// Backend responses carry success; on failure the body has an error message.
type Ok<T> = ({ success: true } & T) | { success: false; error?: string };

export const api = {
  routes: {
    // Public listing with geometry, for the browse page.
    catalog: <T = RouteRow>() => apiFetch<Ok<{ routes: T[] }>>('/routes/catalog', { auth: false }),
    list: <T = RouteRow>() => apiFetch<Ok<{ routes: T[] }>>('/admin/routes'),
    get: <T = RouteRow>(id: string) => apiFetch<Ok<{ route: T }>>(`/admin/routes/${id}`),
    add: (input: RouteInput) =>
      apiFetch<Ok<{ route: RouteRow }>>('/admin/routes', { method: 'POST', body: input }),
    update: (id: string, input: RouteInput) =>
      apiFetch<Ok<{ route: RouteRow }>>(`/admin/routes/${id}`, { method: 'PUT', body: input }),
    remove: (id: string) =>
      apiFetch<Ok<{ deleted: Pick<RouteRow, 'id' | 'route_code'> }>>(`/admin/routes/${id}`, {
        method: 'DELETE',
      }),
  },

  contributions: {
    submit: (input: ContributionInput) =>
      apiFetch<Ok<{ message: string; contribution: { id: string } }>>('/contributions', {
        method: 'POST',
        body: input,
      }),
    list: <T>(status = 'pending') =>
      apiFetch<Ok<{ contributions: T[] }>>(`/admin/contributions?status=${status}`),
    review: (
      id: string,
      body: { status: ReviewStatus; review_notes?: string; transferred_route_id?: string },
    ) =>
      apiFetch<Ok<{ contribution: { id: string; status: ReviewStatus } }>>(
        `/admin/contributions/${id}`,
        { method: 'PATCH', body },
      ),
  },

  users: {
    list: <T>() => apiFetch<T[]>('/admin/users'),
    create: <T>(user: Partial<T>) => apiFetch<T>('/admin/users', { method: 'POST', body: user }),
    update: <T>(id: string, user: Partial<T>) =>
      apiFetch<T>(`/admin/users/${id}`, { method: 'PUT', body: user }),
    remove: (id: string) => apiFetch<{ success: true }>(`/admin/users/${id}`, { method: 'DELETE' }),
  },

  database: {
    tables: <T>() => apiFetch<Ok<T>>('/admin/database/tables'),
  },
};
