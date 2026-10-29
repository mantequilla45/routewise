import type { LatLng } from '../../types/GeoTypes';

const EARTH_RADIUS_M = 6371000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in meters. */
export function metersBetween(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Cumulative distance along a polyline: result[i] is the meters from the start to point i. */
export function cumulativeDistances(line: LatLng[]): number[] {
  const out = [0];
  for (let i = 1; i < line.length; i++) out.push(out[i - 1] + metersBetween(line[i - 1], line[i]));
  return out;
}

/** The point `distance` meters along the line (clamped to its ends). */
export function pointAt(line: LatLng[], cum: number[], distance: number): LatLng {
  if (distance <= 0) return line[0];
  const total = cum[cum.length - 1];
  if (distance >= total) return line[line.length - 1];
  // Binary search for the segment containing `distance`
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= distance) lo = mid;
    else hi = mid;
  }
  const span = cum[hi] - cum[lo] || 1;
  const t = (distance - cum[lo]) / span;
  return {
    latitude: line[lo].latitude + (line[hi].latitude - line[lo].latitude) * t,
    longitude: line[lo].longitude + (line[hi].longitude - line[lo].longitude) * t,
  };
}

/**
 * The part of the line between two distances along it, following the original vertices. On a
 * loop, `to < from` means the ride passes the line's start and continues from the beginning.
 */
export function sliceLine(
  line: LatLng[],
  cum: number[],
  from: number,
  to: number,
  isLoop: boolean,
): LatLng[] {
  const total = cum[cum.length - 1];
  if (to < from && isLoop) {
    return [
      ...sliceLine(line, cum, from, total, false),
      ...sliceLine(line, cum, 0, to, false).slice(1),
    ];
  }
  const out: LatLng[] = [pointAt(line, cum, from)];
  for (let i = 0; i < line.length; i++) {
    if (cum[i] > from && cum[i] < to) out.push(line[i]);
  }
  out.push(pointAt(line, cum, to));
  return out;
}

/**
 * Buckets points into a lat/lng grid so "everything within N meters" doesn't scan every point.
 * Cells are ~cellMeters wide; a query checks the cells overlapping the search radius.
 */
export class GridIndex<T extends LatLng> {
  private cells = new Map<string, T[]>();
  private readonly cellDeg: number;

  constructor(cellMeters: number) {
    this.cellDeg = cellMeters / 111320;
  }

  private key(lat: number, lng: number) {
    return `${Math.floor(lat / this.cellDeg)}:${Math.floor(lng / this.cellDeg)}`;
  }

  add(item: T) {
    const k = this.key(item.latitude, item.longitude);
    const bucket = this.cells.get(k);
    if (bucket) bucket.push(item);
    else this.cells.set(k, [item]);
  }

  /**
   * Items within `radius` meters of `center`, with their distance. Uses a flat-earth
   * approximation: at these short distances it's within a meter of the great-circle value and
   * much cheaper, which matters when building transfer links for every node.
   */
  within(center: LatLng, radius: number): { item: T; distance: number }[] {
    const reach = Math.ceil(radius / 111320 / this.cellDeg);
    const row = Math.floor(center.latitude / this.cellDeg);
    const col = Math.floor(center.longitude / this.cellDeg);
    const mPerDegLat = 111320;
    const mPerDegLng = 111320 * Math.cos(toRad(center.latitude));
    const radiusSq = radius * radius;
    const found: { item: T; distance: number }[] = [];
    for (let r = row - reach; r <= row + reach; r++) {
      for (let c = col - reach; c <= col + reach; c++) {
        for (const item of this.cells.get(`${r}:${c}`) ?? []) {
          const dy = (item.latitude - center.latitude) * mPerDegLat;
          const dx = (item.longitude - center.longitude) * mPerDegLng;
          const distSq = dx * dx + dy * dy;
          if (distSq <= radiusSq) found.push({ item, distance: Math.sqrt(distSq) });
        }
      }
    }
    return found;
  }
}

/** Minimal binary min-heap keyed by a number, for Dijkstra. */
export class MinHeap<T> {
  private items: { key: number; value: T }[] = [];

  get size() {
    return this.items.length;
  }

  push(key: number, value: T) {
    const items = this.items;
    items.push({ key, value });
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (items[parent].key <= items[i].key) break;
      [items[parent], items[i]] = [items[i], items[parent]];
      i = parent;
    }
  }

  pop(): { key: number; value: T } | undefined {
    const items = this.items;
    if (items.length === 0) return undefined;
    const top = items[0];
    const last = items.pop()!;
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let smallest = i;
        if (l < items.length && items[l].key < items[smallest].key) smallest = l;
        if (r < items.length && items[r].key < items[smallest].key) smallest = r;
        if (smallest === i) break;
        [items[smallest], items[i]] = [items[i], items[smallest]];
        i = smallest;
      }
    }
    return top;
  }
}
