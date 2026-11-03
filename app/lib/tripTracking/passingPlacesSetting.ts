import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

// Whether a trip pops up the popular places the rider passes ("Passing SM City Cebu").
// Kept on the device; on until turned off.
const STORAGE_KEY = 'showPassingPlaces';

let enabled = true;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

AsyncStorage.getItem(STORAGE_KEY)
  .then((stored) => {
    if (stored !== null) {
      enabled = stored === 'true';
      notify();
    }
  })
  .catch(() => {});

export function setShowPassingPlaces(value: boolean) {
  enabled = value;
  notify();
  AsyncStorage.setItem(STORAGE_KEY, String(value)).catch(() => {});
}

/** The setting, kept in sync across screens. */
export function useShowPassingPlaces(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => enabled,
  );
}

// "Hide for this trip": the start time of the trip whose place pop-ups were hidden. A new trip
// has a new start time, so pop-ups come back on their own.
let mutedTrip: number | null = null;

export function hidePassingPlacesForTrip(tripStartedAt: number) {
  mutedTrip = tripStartedAt;
  notify();
}

/** Whether place pop-ups show for the trip that started at `tripStartedAt`. */
export function usePassingPlacesShownFor(tripStartedAt: number): boolean {
  const on = useShowPassingPlaces();
  const muted = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => mutedTrip === tripStartedAt,
  );
  return on && !muted;
}
