import { api, type PlacePhoto } from '@/lib/api';
import type { LatLng } from '@/types/GeoTypes';
import { useEffect, useState } from 'react';

// One lookup per point per app session (the backend and Vercel's edge cache the rest)
const cache = new Map<string, PlacePhoto | null>();
const keyFor = (p: LatLng, name: string) =>
  `${p.latitude.toFixed(4)},${p.longitude.toFixed(4)},${name}`;

/**
 * A photo of the place called `name` at `point`: undefined while looking, null if Google has no
 * photo of that place (or the lookup failed), else the photo. No name, no lookup.
 */
export default function usePlacePhoto(
  point: LatLng | null,
  name: string | null,
): PlacePhoto | null | undefined {
  const key = point && name ? keyFor(point, name) : null;
  const [result, setResult] = useState<{ key: string | null; photo: PlacePhoto | null }>(() => ({
    key,
    photo: key ? (cache.get(key) ?? null) : null,
  }));

  useEffect(() => {
    if (!key || cache.has(key)) return;
    // The point, rebuilt from its key, so the effect depends only on the key
    const [lat, lng, ...nameParts] = key.split(',');
    let ignore = false;
    api.places
      .photoNear({ latitude: Number(lat), longitude: Number(lng) }, nameParts.join(','))
      .then(({ photo }) => photo)
      .catch(() => null)
      .then((photo) => {
        cache.set(key, photo);
        if (!ignore) setResult({ key, photo });
      });
    return () => {
      ignore = true;
    };
  }, [key]);

  if (!key) return null;
  if (cache.has(key)) return cache.get(key) ?? null;
  return result.key === key ? result.photo : undefined;
}
