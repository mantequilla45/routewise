import type { GoogleMapsPolyline } from '@/context/map-context';
import { LatLng } from '@/types/GeoTypes';
import { Platform } from 'react-native';

// Arrow size and spacing on screen (points on iOS, pixels on Android, which are ~3x denser), so
// they look the same at every zoom.
const DENSITY = Platform.OS === 'ios' ? 1 : 3;
const SPACING = 90 * DENSITY;
const ARM = 5 * DENSITY;
const ARROW_WIDTH = 2 * DENSITY;
// Most arrows on one line; past this they spread out, so long routes zoomed in stay smooth
const MAX_PER_LINE = 120;
const ARROW_COLOR = '#FFFFFF';
// Arrows only from about street level in (zoom ~15.5): zoomed out they'd be clutter
const MAX_METERS_PER_POINT = 3;

const M_PER_DEG = 111_320;
const EQUATOR_M = 40_075_017;
// Google draws the world 256 px wide at zoom 0; expo-maps on iOS stretches it across the view
// (see fitCamera)
const GOOGLE_WORLD_SIZE = 256;

type Point = { latitude: number; longitude: number };

/** Meters per screen point (iOS) / pixel (Android) at this zoom and latitude. */
export function metersPerUnit(zoom: number, latitude: number, viewWidth: number) {
  const worldSize = Platform.OS === 'ios' ? viewWidth : GOOGLE_WORLD_SIZE;
  return (EQUATOR_M * Math.cos((latitude * Math.PI) / 180)) / (worldSize * 2 ** zoom);
}

/** Whether the map is zoomed in far enough, at this latitude, for the route arrows to show. */
export const arrowsVisible = (zoom: number, latitude: number, viewWidth: number) =>
  metersPerUnit(zoom, latitude, viewWidth) * DENSITY <= MAX_METERS_PER_POINT;

/** Offset a point by meters east (dx) and north (dy). */
function offset(p: Point, dx: number, dy: number, cosLat: number): LatLng {
  return {
    latitude: p.latitude + dy / M_PER_DEG,
    longitude: p.longitude + dx / (M_PER_DEG * cosLat),
  };
}

/** A ">" pointing along a → b with its tip at `tip`. */
function chevron(tip: Point, a: Point, b: Point, arm: number): LatLng[] {
  const cosLat = Math.cos((tip.latitude * Math.PI) / 180);
  const ex = (b.longitude - a.longitude) * M_PER_DEG * cosLat;
  const ny = (b.latitude - a.latitude) * M_PER_DEG;
  const length = Math.hypot(ex, ny) || 1;
  const [ux, uy] = [ex / length, ny / length]; // direction of travel
  const [px, py] = [-uy, ux]; // to its left
  return [
    offset(tip, (-ux + px) * arm, (-uy + py) * arm, cosLat),
    { latitude: tip.latitude, longitude: tip.longitude },
    offset(tip, (-ux - px) * arm, (-uy - py) * arm, cosLat),
  ];
}

const segmentMeters = (a: Point, b: Point) => {
  const cosLat = Math.cos((((a.latitude + b.latitude) / 2) * Math.PI) / 180);
  return Math.hypot(
    (b.longitude - a.longitude) * M_PER_DEG * cosLat,
    (b.latitude - a.latitude) * M_PER_DEG,
  );
};

/**
 * Small white arrows along each line, pointing the way the jeep goes (the order of its points),
 * spaced and sized for the current zoom. None until zoomed in to about street level.
 */
export function routeArrows(
  lines: GoogleMapsPolyline[],
  zoom: number,
  viewWidth: number,
): GoogleMapsPolyline[] {
  return lines.flatMap((line) => {
    const first = line.coordinates?.[0];
    if (first?.latitude == null || !arrowsVisible(zoom, first.latitude, viewWidth)) return [];
    const points = (line.coordinates ?? []).filter(
      (p): p is Point => p.latitude != null && p.longitude != null,
    );
    if (points.length < 2) return [];

    const seg = points.slice(1).map((p, i) => segmentMeters(points[i], p));
    const total = seg.reduce((sum, m) => sum + m, 0);
    const unit = metersPerUnit(zoom, points[0].latitude, viewWidth);
    const spacing = Math.max(SPACING * unit, total / MAX_PER_LINE);
    const arm = ARM * unit;

    const arrows: GoogleMapsPolyline[] = [];
    let next = spacing / 2; // distance along the line of the next arrow
    let start = 0; // distance along the line where segment i starts
    for (let i = 0; i < seg.length && next < total; i++) {
      const a = points[i];
      const b = points[i + 1];
      while (next <= start + seg[i] && next < total) {
        const t = seg[i] ? (next - start) / seg[i] : 0;
        const tip = {
          latitude: a.latitude + (b.latitude - a.latitude) * t,
          longitude: a.longitude + (b.longitude - a.longitude) * t,
        };
        arrows.push({
          id: `${line.id}-arrow-${arrows.length}`,
          coordinates: chevron(tip, a, b, arm),
          color: ARROW_COLOR,
          width: ARROW_WIDTH,
        });
        next += spacing;
      }
      start += seg[i];
    }
    return arrows;
  });
}
