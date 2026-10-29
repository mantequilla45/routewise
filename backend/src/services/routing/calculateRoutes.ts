import { log } from '../../lib/log';
import { query } from '../../lib/db';
import { HttpError, notFound } from '../../lib/http';
import type { LatLng } from '../../types/GeoTypes';
import { Case1NormalHandler } from '../../services/geo/routeCases/singleRoute/Case1NormalHandler';
import { Case5BothOppositeHandler } from '../../services/geo/routeCases/singleRoute/Case5BothOppositeHandler';
import { Case6SimpleTransferHandler } from '../../services/geo/routeCases/multiRoute/Case6SimpleTransferHandler';
import { Case7TransferStartOppositeHandler } from '../../services/geo/routeCases/multiRoute/Case7TransferStartOppositeHandler';
import { Case8TransferEndOppositeHandler } from '../../services/geo/routeCases/multiRoute/Case8TransferEndOppositeHandler';

// Type for database query results
interface RouteInfo {
  id: string;
  route_code: string;
  route_name: string;
  start_pos: number;
  end_pos: number;
  start_dist: number;
  end_dist: number;
}

// Type for processed routes
interface RouteSegmentInfo {
  routeId: string;
  routeCode: string;
  routeName: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
  distance: number;
  fare: number;
}

interface ProcessedRoute {
  routeId: string;
  routeCode: string;
  routeName: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
  distance: number;
  fare: number;
  caseName: string;
  isTransfer?: boolean;
  firstRoute?: RouteSegmentInfo;
  secondRoute?: RouteSegmentInfo;
  requiresLoop?: boolean;
  optimized?: boolean;
  boardingWalk?: number;
  alightingWalk?: number;
  estimatedMinutes?: number;
  debugInfo?: Record<string, unknown>;
}

// Straight-line meters between two points (haversine). Good enough for walking estimates.
function metersBetween(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Walk from the start pin to where the jeep is boarded, and from where it's left to the
// destination pin. Uses the ridden segment's ends, the same for every handler.
function withWalkingDistances(route: ProcessedRoute, from: LatLng, to: LatLng): ProcessedRoute {
  const first = route.isTransfer ? route.firstRoute?.coordinates : route.coordinates;
  const last = route.isTransfer ? route.secondRoute?.coordinates : route.coordinates;
  const boardAt = first?.[0];
  const alightAt = last?.[last.length - 1];
  return {
    ...route,
    boardingWalk: boardAt ? Math.round(metersBetween(from, boardAt)) : undefined,
    alightingWalk: alightAt ? Math.round(metersBetween(alightAt, to)) : undefined,
  };
}

const totalWalk = (r: ProcessedRoute) => (r.boardingWalk ?? 0) + (r.alightingWalk ?? 0);

// Rough door-to-door speeds in meters per minute: walking ~5 km/h, a jeepney in city traffic
// ~15 km/h. Used to rank results and shown to the user as an estimate.
const WALK_M_PER_MIN = 83;
const JEEP_M_PER_MIN = 250;

const estimateMinutes = (r: ProcessedRoute) =>
  Math.round(totalWalk(r) / WALK_M_PER_MIN + r.distance / JEEP_M_PER_MIN);

export async function calculateRoutes(from: LatLng, to: LatLng): Promise<ProcessedRoute[]> {
  try {
    log.debug('Route calculation - starting');
    log.debug('From:', from);
    log.debug('To:', to);

    // First, find ALL routes within 500m of both points
    const allRoutesQuery = `
            SELECT DISTINCT
                r.id,
                r.route_code,
                CONCAT(r.start_point_name, ' - ', r.end_point_name) as route_name,
                ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as start_pos,
                ST_LineLocatePoint(r.geom_forward, ST_SetSRID(ST_MakePoint($3, $4), 4326)) as end_pos,
                ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as start_dist,
                ST_Distance(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography) as end_dist
            FROM jeepney_routes r
            WHERE 
                ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 500)
                AND ST_DWithin(r.geom_forward::geography, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 500)
            ORDER BY route_code;
        `;

    const foundRoutes = (await query(allRoutesQuery, [
      from.longitude,
      from.latitude,
      to.longitude,
      to.latitude,
    ])) as RouteInfo[];

    log.debug(`Found ${foundRoutes.length} routes within 500m of both points:`);
    foundRoutes.forEach((r) => {
      log.debug(
        `  ${r.route_code}: Start ${r.start_dist.toFixed(1)}m, End ${r.end_dist.toFixed(1)}m (${(r.start_pos * 100).toFixed(1)}% → ${(r.end_pos * 100).toFixed(1)}%)`,
      );
    });

    // Try handlers and collect all possible routes
    // Order matters - more specific cases should run first
    const handlers = [
      new Case1NormalHandler(), // Case 1: Normal forward travel
      new Case5BothOppositeHandler(), // Case 5: Both pins on opposite sides
      new Case8TransferEndOppositeHandler(), // Case 8: Transfer with end opposite (run before Case 6)
      new Case7TransferStartOppositeHandler(), // Case 7: Transfer with start opposite
      new Case6SimpleTransferHandler(), // Case 6: Two-jeep transfer (run last as fallback)
    ];

    // Collect ALL routes from ALL handlers
    const allRoutes: ProcessedRoute[] = [];
    const handlerSummary: Array<{ handler: string; routeCount: number }> = [];

    // Collect results from all applicable handlers
    for (const handler of handlers) {
      const canHandle = await handler.canHandle(from, to);

      if (canHandle) {
        try {
          const result = await handler.calculate(from, to);

          if (result && result.segments.length > 0) {
            log.debug(`${handler.getCaseName()} calculated:`);
            log.debug(`  Found ${result.segments.length} route(s)`);

            // Add all routes from this handler
            result.segments.forEach((segment) => {
              // Handle transfer routes differently
              if (segment.isTransfer) {
                allRoutes.push({
                  routeId: segment.routeId,
                  routeCode: segment.routeCode,
                  routeName: segment.routeName,
                  coordinates: segment.coordinates,
                  distance: segment.totalDistance || segment.distance,
                  fare: segment.totalFare || segment.fare,
                  caseName: result.caseName,
                  isTransfer: true,
                  firstRoute: segment.firstRoute,
                  secondRoute: segment.secondRoute,
                  boardingWalk: segment.boardingWalk,
                  alightingWalk: segment.alightingWalk,
                  debugInfo: {
                    ...result.debugInfo,
                    coordinateCount: segment.coordinates.length,
                  },
                });
              } else {
                allRoutes.push({
                  routeId: segment.routeId,
                  routeCode: segment.routeCode,
                  routeName: segment.routeName,
                  coordinates: segment.coordinates,
                  distance: segment.distance,
                  fare: segment.fare,
                  caseName: result.caseName,
                  requiresLoop: segment.requiresLoop || false,
                  optimized: segment.optimized || false,
                  debugInfo: {
                    ...result.debugInfo,
                    coordinateCount: segment.coordinates.length,
                  },
                });
              }
            });

            handlerSummary.push({
              handler: handler.getCaseName(),
              routeCount: result.segments.length,
            });
          }
        } catch (calcError) {
          log.debug(
            `${handler.getCaseName()} failed:`,
            calcError instanceof Error ? calcError.message : 'Unknown error',
          );
        }
      }
    }

    if (allRoutes.length === 0) {
      log.debug('No routes found');
      throw notFound('No routes available', {
        debugInfo: {
          triedHandlers: handlers.map((h) => h.getCaseName()),
        },
      });
    }

    // Sort all routes by distance
    allRoutes.sort((a, b) => a.distance - b.distance);

    // Remove duplicates (same route code from different handlers)
    const uniqueRoutes = new Map<string, ProcessedRoute>();
    allRoutes.forEach((route) => {
      const key = route.routeId;
      // Keep the shorter route if we have duplicates
      const existing = uniqueRoutes.get(key);
      if (!existing || existing.distance > route.distance) {
        uniqueRoutes.set(key, route);
      }
    });

    const finalRoutes = Array.from(uniqueRoutes.values())
      .map((route) => withWalkingDistances(route, from, to))
      .map((route) => ({ ...route, estimatedMinutes: estimateMinutes(route) }))
      // Fastest estimated door-to-door time first; less walking breaks ties.
      .sort((a, b) => a.estimatedMinutes - b.estimatedMinutes || totalWalk(a) - totalWalk(b));

    log.debug('\n📊 Final results:');
    log.debug(`  Total unique routes: ${finalRoutes.length}`);
    log.debug(
      `  Routes by handler: ${handlerSummary.map((h) => `${h.handler}(${h.routeCount})`).join(', ')}`,
    );

    // Log each route with its case handler and polyline status
    finalRoutes.forEach((route, index) => {
      const hasPolyline = route.coordinates && route.coordinates.length > 0;
      log.debug(
        `  [${index}] ${route.routeCode}: ${route.caseName} - ${(route.distance / 1000).toFixed(2)}km, walk ${route.boardingWalk}m + ${route.alightingWalk}m, ~${route.estimatedMinutes} min ${hasPolyline ? `(${route.coordinates.length} points)` : 'NO POLYLINE'}`,
      );
      if (!hasPolyline) {
        log.debug(`    ⚠️ Missing polyline data for ${route.routeCode}`);
      }
    });

    return finalRoutes;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    log.error('Route calculation error:', error);
    throw new HttpError(500, {
      error: 'Failed to calculate route',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
