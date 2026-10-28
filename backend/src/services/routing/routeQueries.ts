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

export async function findNearestRoutePoint(point: LatLng, maxDistance: number) {
  const { latitude, longitude } = point;
  const nearestQuery = `
        WITH route_distances AS (
            SELECT
                r.id as route_id,
                r.route_code,
                r.start_point_name,
                r.end_point_name,
                ST_Distance(
                    r.geom_forward::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                ) as distance_meters,
                ST_LineLocatePoint(
                    r.geom_forward,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)
                ) as position_on_route,
                ST_AsGeoJSON(
                    ST_ClosestPoint(
                        r.geom_forward,
                        ST_SetSRID(ST_MakePoint($1, $2), 4326)
                    )
                ) as nearest_point_geojson
            FROM jeepney_routes r
            WHERE ST_DWithin(
                r.geom_forward::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                $3
            )
            ORDER BY distance_meters
            LIMIT 1
        )
        SELECT
            route_id,
            route_code,
            start_point_name,
            end_point_name,
            distance_meters,
            position_on_route,
            nearest_point_geojson
        FROM route_distances;
    `;

  const result = await query(nearestQuery, [longitude, latitude, maxDistance]);

  if (!result || result.length === 0) {
    return {
      found: false,
      original: { latitude, longitude },
      message: 'No route points found within maximum distance',
    };
  }

  const nearest = result[0];
  let nearestLat = latitude;
  let nearestLng = longitude;
  try {
    const pointGeoJson = JSON.parse(nearest.nearest_point_geojson);
    if (pointGeoJson.type === 'Point' && pointGeoJson.coordinates) {
      nearestLng = pointGeoJson.coordinates[0];
      nearestLat = pointGeoJson.coordinates[1];
    }
  } catch (e) {
    console.error('Error parsing nearest point GeoJSON:', e);
  }

  return {
    found: true,
    original: { latitude, longitude },
    nearest: {
      route_id: nearest.route_id,
      route_code: nearest.route_code,
      route_name: `${nearest.start_point_name} - ${nearest.end_point_name}`,
      latitude: nearestLat,
      longitude: nearestLng,
      distance: nearest.distance_meters,
      position_on_route: nearest.position_on_route,
    },
    snapped: nearest.distance_meters < 15, // Snap if within 15 meters
  };
}
