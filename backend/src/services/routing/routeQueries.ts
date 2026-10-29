import { query } from '../../lib/db';
import { notFound } from '../../lib/http';
import type { LatLng } from '../../types/GeoTypes';

export interface RouteSummary {
  id: string;
  route_id: string;
  route_code: string;
  route_color: string;
  created_at: string;
}

export async function listRoutes(): Promise<RouteSummary[]> {
  const sql = `
        SELECT
            id,
            route_code as route_id,
            CONCAT(start_point_name, ' - ', end_point_name) as route_code,
            '#33ff00' as route_color,
            created_at
        FROM jeepney_routes
        ORDER BY route_code ASC;
    `;
  return query<RouteSummary>(sql);
}

export async function getRouteForDisplay(id: string) {
  const sql = `
        SELECT
            id,
            route_code as route_id,
            CONCAT(start_point_name, ' - ', end_point_name) as route_code,
            '#33ff00' as route_color,
            ST_AsGeoJSON(geom_forward)::json as geojson
        FROM jeepney_routes
        WHERE id = $1;
    `;
  const result = await query(sql, [id]);
  if (!result || result.length === 0) {
    throw notFound('Route not found');
  }

  const route = result[0];
  let coordinates: LatLng[] = [];
  if (route.geojson?.coordinates) {
    const geomCoords = route.geojson.coordinates;
    if (route.geojson.type === 'LineString') {
      coordinates = geomCoords.map((coord: number[]) => ({
        latitude: coord[1],
        longitude: coord[0],
      }));
    } else if (route.geojson.type === 'MultiLineString' || route.geojson.type === 'Polygon') {
      coordinates = geomCoords[0].map((coord: number[]) => ({
        latitude: coord[1],
        longitude: coord[0],
      }));
    }
  }

  return { ...route, coordinates };
}
