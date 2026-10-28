import type { LatLng } from '@/lib/maps/geometry';

function isLatLngObject(coord: object): coord is LatLng {
  return 'lat' in coord && 'lng' in coord;
}

// Converts route coordinates to Google Maps {lat, lng} literals, dropping and warning about any
// invalid entries. Accepts both [lng, lat] tuples and {lat, lng} objects.
export function normalizeCoordinates(coordinates: readonly unknown[]): LatLng[] {
  return coordinates
    .filter((coord) => {
      if (!coord) {
        console.warn('Invalid coordinate: null or undefined');
        return false;
      }

      if (typeof coord === 'object' && coord && isLatLngObject(coord)) {
        if (!isFinite(coord.lat) || !isFinite(coord.lng)) {
          console.warn('Non-finite coordinate values:', coord);
          return false;
        }
        return true;
      }

      if (Array.isArray(coord) && coord.length === 2) {
        const [lng, lat] = coord;
        if (!isFinite(lat) || !isFinite(lng)) {
          console.warn('Non-finite coordinate values:', coord);
          return false;
        }
        return true;
      }

      console.warn('Invalid coordinate format:', coord);
      return false;
    })
    .map((coord): LatLng | null => {
      if (typeof coord === 'object' && coord && isLatLngObject(coord)) {
        return { lat: coord.lat, lng: coord.lng };
      } else if (Array.isArray(coord)) {
        return { lat: coord[1], lng: coord[0] };
      }
      return null;
    })
    .filter((coord): coord is LatLng => coord !== null);
}
