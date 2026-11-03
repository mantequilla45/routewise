import { colors } from '@/theme';
import type { LatLng, TripOption } from '@/types/GeoTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';
import { advance, type Fix, initialProgress, speedOf, type TripProgress } from './progress';
import {
  flushTripLog,
  logTripEnd,
  logTripEvent,
  logTripStart,
  newId,
  progressEvents,
} from './tripLog';

/**
 * Live tracking of the trip the rider confirmed. Location updates run as a background task, so
 * the "get off soon" alerts arrive as notifications with the phone locked or in a pocket. The
 * active trip is kept in AsyncStorage because iOS may relaunch the app in the background just
 * to deliver a location. Import this module at startup (the root layout does) so the task is
 * defined before any update arrives.
 */

const TASK = 'routewise-trip-tracking';
const STORAGE_KEY = 'activeTrip';
const CHANNEL_ID = 'trip-alerts';
// How often a tracked trip gets a location: every few meters (iOS), or every couple of seconds
// (Android), so the rider's marker, the camera and the progress bars move smoothly. Costs some
// battery while a trip runs.
const UPDATE_EVERY_M = 5;
const UPDATE_EVERY_MS = 2000;

export interface ActiveTrip {
  /** Made on the phone at the start, for the trip log (see tripLog.ts). */
  id: string;
  trip: TripOption;
  /** Where the trip was planned from, to redraw it when the journey is reopened. */
  start: LatLng | null;
  destination: LatLng;
  /** When tracking started (ms since epoch), for the elapsed time. */
  startedAt: number;
  progress: TripProgress;
  /** Latest known position of the rider. */
  position?: LatLng;
  /** Speed at that position in m/s, for the speed readout; null when unknown. */
  speed?: number | null;
  /** False when only foreground tracking was allowed: alerts need the app open. */
  background: boolean;
}

// ---- store ----------------------------------------------------------------------------------

let active: ActiveTrip | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function setActive(next: ActiveTrip | null) {
  active = next;
  listeners.forEach((l) => l());
  const write = next
    ? AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    : AsyncStorage.removeItem(STORAGE_KEY);
  write.catch((e) => console.warn('Could not save the active trip', e));
}

/** A trip saved by an older version: fill in fields added since, so a ride in progress survives. */
function upgrade(saved: ActiveTrip): ActiveTrip {
  return {
    ...saved,
    id: saved.id ?? newId(),
    start: saved.start ?? null,
    startedAt: saved.startedAt ?? Date.now(),
    progress: { ...initialProgress(saved.trip), ...saved.progress },
  };
}

async function load(): Promise<ActiveTrip | null> {
  if (hydrated) return active;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!hydrated) active = raw ? upgrade(JSON.parse(raw) as ActiveTrip) : null;
  } catch {
    active = null;
  }
  hydrated = true;
  listeners.forEach((l) => l());
  return active;
}
load();
// Trip data that couldn't be sent before (no signal, or the app was closed)
void flushTripLog();

/** The trip being tracked right now, outside React (e.g. in event handlers). */
export const getActiveTrip = () => active;

/** The trip being tracked, or null. */
export function useActiveTrip(): ActiveTrip | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => active,
  );
}

// ---- alerts ---------------------------------------------------------------------------------

Notifications.setNotificationHandler({
  // Show trip alerts as banners even while the app is open
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function notify(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
    },
    trigger: null,
  });
}

// ---- location updates -----------------------------------------------------------------------

let foregroundWatch: Location.LocationSubscription | null = null;

const toFix = (l: Location.LocationObject): Fix => ({
  position: { latitude: l.coords.latitude, longitude: l.coords.longitude },
  time: l.timestamp,
  speed: l.coords.speed,
});

async function onPositions(fixes: Fix[]) {
  let current = await load();
  for (const fix of fixes) {
    if (!current) return;
    const { position } = fix;
    // From the previous fix, before `advance` replaces it
    const speed = speedOf(fix, current.progress.last);
    const { progress, alerts } = advance(current.trip, current.destination, current.progress, fix);
    for (const event of progressEvents(current.trip, current.progress, progress)) {
      logTripEvent(current.id, { ...event, position, speed });
    }
    for (const alert of alerts) await notify(alert.title, alert.body);
    current = {
      ...current,
      progress,
      position: { latitude: position.latitude, longitude: position.longitude },
      speed,
    };
    setActive(current);
    if (progress.arrived) {
      await stopTrip();
      return;
    }
  }
}

TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TASK, async ({ data, error }) => {
  if (error || !data) return;
  if (!(await load())) {
    // A leftover task with no trip: stop it
    await Location.stopLocationUpdatesAsync(TASK).catch(() => {});
    return;
  }
  await onPositions(data.locations.map(toFix));
});

export type StartResult =
  { ok: true; background: boolean } | { ok: false; reason: 'location-denied' };

/**
 * Start tracking `trip`. Asks for location (and "Always", for alerts with the phone locked) and
 * notification permission. Without "Always" it still tracks while the app is open.
 */
export async function startTrip(
  trip: TripOption,
  start: LatLng | null,
  destination: LatLng,
): Promise<StartResult> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) return { ok: false, reason: 'location-denied' };
  const backgroundPermission = await Location.requestBackgroundPermissionsAsync().catch(() => null);
  await Notifications.requestPermissionsAsync().catch(() => null);
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Trip alerts',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 200, 300],
    });
  }

  await stopUpdates();
  const background = !!backgroundPermission?.granted;
  hydrated = true;
  const started: ActiveTrip = {
    id: newId(),
    trip,
    start,
    destination,
    startedAt: Date.now(),
    progress: initialProgress(trip),
    background,
  };
  setActive(started);
  logTripStart(started);

  if (background) {
    await Location.startLocationUpdatesAsync(TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: UPDATE_EVERY_M,
      timeInterval: UPDATE_EVERY_MS,
      activityType: Location.ActivityType.OtherNavigation,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Trip in progress',
        notificationBody: `Tracking your ride on ${trip.routeCode}`,
        notificationColor: colors.accent,
      },
    });
  } else {
    foregroundWatch = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: UPDATE_EVERY_M,
        timeInterval: UPDATE_EVERY_MS,
      },
      (l) => onPositions([toFix(l)]),
    );
  }
  return { ok: true, background };
}

async function stopUpdates() {
  foregroundWatch?.remove();
  foregroundWatch = null;
  if (await Location.hasStartedLocationUpdatesAsync(TASK).catch(() => false)) {
    await Location.stopLocationUpdatesAsync(TASK).catch(() => {});
  }
}

/** Stop tracking and forget the trip. */
export async function stopTrip() {
  const ending = active;
  if (ending) {
    const arrived = ending.progress.arrived;
    if (!arrived) logTripEvent(ending.id, { kind: 'ended', position: ending.position });
    logTripEnd(ending.id, arrived ? 'arrived' : 'ended');
  }
  hydrated = true;
  setActive(null);
  await stopUpdates();
}
