import { api, type ExplorePlace, type PlaceCategory } from '@/lib/api';
import { useState } from 'react';

type Category = PlaceCategory | 'all';

interface Pages {
  places: ExplorePlace[];
  nextPage: string | null;
  done: boolean;
  /** The last load failed; scrolling won't retry it, a deliberate pull-up does. */
  failed: boolean;
}

// A page that adds fewer new places than this (most were unreachable or already listed) is
// followed straight away by the next one, up to MAX_CHAINED pages, so the list visibly grows.
const MIN_NEW_PER_LOAD = 5;
const MAX_CHAINED = 3;

// Loaded pages and in-flight loads, per category, shared by every user of the hook and kept for
// the app session. A module-level in-flight map (not React state) is what stops a burst of
// scroll events from sending the same request several times.
const loaded = new Map<Category, Pages>();
const inflight = new Map<Category, Promise<void>>();
const empty: Pages = { places: [], nextPage: null, done: false, failed: false };

async function loadPages(category: Category): Promise<void> {
  let added = 0;
  for (let i = 0; i < MAX_CHAINED; i++) {
    const before = loaded.get(category) ?? empty;
    if (before.done) return;
    const { places, nextPageToken } = await api.places.explore(
      category,
      before.nextPage ?? undefined,
    );
    const seen = new Set(before.places.map((p) => p.placeId));
    const fresh = places.filter((p) => !seen.has(p.placeId));
    loaded.set(category, {
      places: [...before.places, ...fresh],
      nextPage: nextPageToken,
      done: !nextPageToken,
      failed: false,
    });
    added += fresh.length;
    if (added >= MIN_NEW_PER_LOAD) return;
  }
}

/**
 * More places for Home's list past the curated ones, a page at a time for the chosen category.
 * Call `loadMore` freely (on every scroll event): it starts at most one load per category, and
 * after a failure waits for `loadMore({ retry: true })` (the user pulling up) rather than
 * retrying on every scroll.
 */
export default function useMorePlaces(category: Category) {
  const [, setVersion] = useState(0); // re-render when pages land
  const pages = loaded.get(category) ?? empty;

  const loadMore = ({ retry = false }: { retry?: boolean } = {}) => {
    if (pages.done || inflight.has(category) || (pages.failed && !retry)) return;
    const load = loadPages(category)
      .catch((e) => {
        console.warn('Could not load more places:', e);
        loaded.set(category, { ...(loaded.get(category) ?? empty), failed: true });
      })
      .finally(() => {
        inflight.delete(category);
        setVersion((v) => v + 1);
      });
    inflight.set(category, load);
    setVersion((v) => v + 1); // show the loading rows
  };

  return {
    places: pages.places,
    loading: inflight.has(category),
    done: pages.done,
    failed: pages.failed,
    loadMore,
  };
}
