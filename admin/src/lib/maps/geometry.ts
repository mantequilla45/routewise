export interface LatLng {
  lat: number;
  lng: number;
}

// Distance from a point to a line segment, in degrees (planar approximation).
export function distanceToSegment(point: LatLng, segmentStart: LatLng, segmentEnd: LatLng): number {
  const x = point.lng;
  const y = point.lat;
  const x1 = segmentStart.lng;
  const y1 = segmentStart.lat;
  const x2 = segmentEnd.lng;
  const y2 = segmentEnd.lat;

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;

  if (len_sq !== 0) {
    param = dot / len_sq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

// Index of the segment (path[i] -> path[i + 1]) closest to the point. The closing segment of a
// loop is never considered. Returns 0 when the path has fewer than two points.
export function findClosestSegmentIndex(path: LatLng[], point: LatLng): number {
  let minDistance = Infinity;
  let closestIndex = 0;

  const segmentsToCheck = path.length - 1;

  for (let i = 0; i < segmentsToCheck; i++) {
    const distance = distanceToSegment(point, path[i], path[i + 1]);

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
}

// True when the first and last points are exactly equal (a closed loop).
export function isClosedLoopPath(path: LatLng[]): boolean {
  return (
    path.length > 2 &&
    path[0].lat === path[path.length - 1].lat &&
    path[0].lng === path[path.length - 1].lng
  );
}
