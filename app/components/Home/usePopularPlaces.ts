import { api, type PopularPlace } from '@/lib/api';
import { useEffect, useState } from 'react';

// Fetched once per app session and shared by the Home list and the search shortcuts.
let cache: PopularPlace[] | null = null;
let inflight: Promise<PopularPlace[]> | null = null;

function fetchPopular(): Promise<PopularPlace[]> {
  inflight ??= api.places
    .popular()
    .then((rows) => (cache = rows))
    .catch((error) => {
      console.warn('Could not load popular places:', error);
      inflight = null; // allow a retry next time
      return [];
    });
  return inflight;
}

/** Curated popular destinations (null while loading). */
export default function usePopularPlaces(): PopularPlace[] | null {
  const [places, setPlaces] = useState<PopularPlace[] | null>(cache);

  useEffect(() => {
    if (cache) return;
    let ignore = false;
    fetchPopular().then((rows) => {
      if (!ignore) setPlaces(rows);
    });
    return () => {
      ignore = true;
    };
  }, []);

  return places;
}
