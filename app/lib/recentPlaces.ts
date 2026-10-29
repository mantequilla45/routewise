import { LatLng } from '@/types/GeoTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export type RecentPlace = { name: string; location: LatLng };

const STORAGE_KEY = 'recentPlaces';
const MAX_RECENT = 8;

// One in-memory copy shared by every screen; persisted to the device on change.
let recent: RecentPlace[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function emit(next: RecentPlace[]) {
  recent = next;
  listeners.forEach((listener) => listener());
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error) =>
    console.warn('Could not save recent places:', error),
  );
}

function load() {
  if (loaded) return;
  loaded = true;
  AsyncStorage.getItem(STORAGE_KEY)
    .then((raw) => {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        recent = parsed.filter(
          (p): p is RecentPlace =>
            typeof p?.name === 'string' &&
            Number.isFinite(p?.location?.latitude) &&
            Number.isFinite(p?.location?.longitude),
        );
        listeners.forEach((listener) => listener());
      }
    })
    .catch((error) => console.warn('Could not load recent places:', error));
}

const samePlace = (a: RecentPlace, b: RecentPlace) =>
  a.name === b.name ||
  (Math.abs(a.location.latitude - b.location.latitude) < 1e-5 &&
    Math.abs(a.location.longitude - b.location.longitude) < 1e-5);

/** Remember a chosen place (newest first, no duplicates). */
export function addRecentPlace(place: RecentPlace) {
  emit([place, ...recent.filter((p) => !samePlace(p, place))].slice(0, MAX_RECENT));
}

export function clearRecentPlaces() {
  emit([]);
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Recently chosen places, newest first; updates live across screens. */
export function useRecentPlaces(): RecentPlace[] {
  return useSyncExternalStore(subscribe, () => recent);
}
