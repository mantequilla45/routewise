export interface Coordinate {
  lat: number;
  lng: number;
  label?: string;
}

const LOOP_TOLERANCE = 0.000001;

// True when the first and last points coincide (within a tiny tolerance), i.e. a closed loop.
export function isClosedLoop(coords: Coordinate[]): boolean {
  return (
    coords.length > 2 &&
    Math.abs(coords[0].lat - coords[coords.length - 1].lat) < LOOP_TOLERANCE &&
    Math.abs(coords[0].lng - coords[coords.length - 1].lng) < LOOP_TOLERANCE
  );
}

function relabel(coords: Coordinate[]): Coordinate[] {
  return coords.map((coord, i) => ({
    ...coord,
    label: `Point ${i + 1}`,
  }));
}

// Inserts a new point after `afterIndex` and re-labels every point.
export function insertPointAfter(
  coords: Coordinate[],
  afterIndex: number,
  lat: number,
  lng: number,
): Coordinate[] {
  const newPointIndex = afterIndex + 1;
  const newPoint = { lat, lng, label: '' };
  return relabel([...coords.slice(0, newPointIndex), newPoint, ...coords.slice(newPointIndex)]);
}

// Moves the point at `index`. On a closed loop, moving the first or last point moves both so the
// loop stays closed.
export function movePoint(coords: Coordinate[], index: number, lat: number, lng: number) {
  const updatedCoords = [...coords];

  if (isClosedLoop(coords) && (index === 0 || index === coords.length - 1)) {
    updatedCoords[0] = { ...updatedCoords[0], lat, lng };
    updatedCoords[coords.length - 1] = { ...updatedCoords[coords.length - 1], lat, lng };
  } else {
    updatedCoords[index] = { ...updatedCoords[index], lat, lng };
  }

  return updatedCoords;
}

// Appends a point at the end, or before the closing point when the route is a closed loop.
export function appendPoint(coords: Coordinate[], lat: number, lng: number): Coordinate[] {
  if (coords.length === 0) {
    return [{ lat, lng, label: 'Point 1' }];
  }

  if (isClosedLoop(coords)) {
    const newPoint = { lat, lng, label: '' };
    const updatedCoords = [
      ...coords.slice(0, coords.length - 1),
      newPoint,
      coords[coords.length - 1],
    ];
    return updatedCoords.map((coord, i) => ({
      ...coord,
      label:
        i === updatedCoords.length - 1
          ? `Point ${updatedCoords.length} (Loop Close)`
          : `Point ${i + 1}`,
    }));
  }

  return [...coords, { lat, lng, label: `Point ${coords.length + 1}` }];
}

// Removes the point at `index` and re-labels the rest.
export function removePoint(coords: Coordinate[], index: number): Coordinate[] {
  return relabel(coords.filter((_, i) => i !== index));
}

// Appends a copy of the first point so the route becomes a closed loop.
export function closeLoop(coords: Coordinate[]): Coordinate[] {
  const closingPoint = {
    ...coords[0],
    label: `Point ${coords.length + 1} (Loop Close)`,
  };
  return [...coords, closingPoint];
}
