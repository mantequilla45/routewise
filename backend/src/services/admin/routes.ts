import { query } from '../../lib/db';
import { badRequest, notFound } from '../../lib/http';

export type LngLatPair = [number, number];

export interface RouteInput {
  route_code: string;
  start_point_name: string;
  end_point_name: string;
  coordinates_forward: LngLatPair[];
}

// Validates the admin route payload. Coordinates are interpolated into WKT, so they
// must be finite numbers, never strings.
export function parseRouteInput(body: unknown): RouteInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const { route_code, start_point_name, end_point_name, coordinates_forward } = b;

  if (
    typeof route_code !== 'string' ||
    !route_code ||
    typeof start_point_name !== 'string' ||
    !start_point_name ||
    typeof end_point_name !== 'string' ||
    !end_point_name ||
    !Array.isArray(coordinates_forward)
  ) {
    throw badRequest('Missing required fields');
  }

  const coords = coordinates_forward.map((c): LngLatPair => {
    if (!Array.isArray(c) || c.length !== 2 || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) {
      throw badRequest('coordinates_forward must be [lng, lat] number pairs');
    }
    return [c[0], c[1]];
  });
  if (coords.length < 2) throw badRequest('A route needs at least two points');

  return { route_code, start_point_name, end_point_name, coordinates_forward: coords };
}

function toLineString(coords: LngLatPair[]) {
  return `LINESTRING(${coords.map(([lng, lat]) => `${lng} ${lat}`).join(', ')})`;
}

export async function listRoutesWithGeometry() {
  return query(`
    SELECT
      id,
      route_code,
      start_point_name,
      end_point_name,
      ST_AsGeoJSON(geom_forward)::json as forward_geojson,
      created_at,
      updated_at
    FROM jeepney_routes
    ORDER BY updated_at DESC NULLS LAST, created_at DESC;
  `);
}

export async function getRouteForAdmin(id: string) {
  const result = await query(
    `
    SELECT
      id,
      route_code,
      start_point_name,
      end_point_name,
      ST_AsGeoJSON(geom_forward)::json as forward_geojson
    FROM jeepney_routes
    WHERE id = $1;
  `,
    [id],
  );
  if (result.length === 0) throw notFound('Route not found');
  return result[0];
}

export async function addRoute(input: RouteInput) {
  const result = await query(
    `
    INSERT INTO jeepney_routes (route_code, start_point_name, end_point_name, geom_forward)
    VALUES ($1, $2, $3, ST_GeomFromText($4, 4326))
    RETURNING id, route_code, start_point_name, end_point_name;
  `,
    [
      input.route_code,
      input.start_point_name,
      input.end_point_name,
      toLineString(input.coordinates_forward),
    ],
  );
  return result[0];
}

export async function updateRoute(id: string, input: RouteInput) {
  const result = await query(
    `
    UPDATE jeepney_routes
    SET
      route_code = $1,
      start_point_name = $2,
      end_point_name = $3,
      geom_forward = ST_GeomFromText($4, 4326)
    WHERE id = $5::uuid
    RETURNING id, route_code, start_point_name, end_point_name,
      ST_AsGeoJSON(geom_forward)::json as forward_geojson;
  `,
    [
      input.route_code,
      input.start_point_name,
      input.end_point_name,
      toLineString(input.coordinates_forward),
      id,
    ],
  );
  if (result.length === 0) throw notFound('Route not found');
  return result[0];
}

export async function deleteRoute(id: string) {
  const result = await query(`DELETE FROM jeepney_routes WHERE id = $1 RETURNING id, route_code;`, [
    id,
  ]);
  if (result.length === 0) throw notFound('Route not found');
  return result[0];
}
