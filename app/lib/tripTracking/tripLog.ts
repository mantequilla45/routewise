import { api, type TripEventBody, type TripEventKind, type TripSyncBody } from '@/lib/api';
import type { LatLng, TripOption } from '@/types/GeoTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TripProgress } from './progress';
import type { ActiveTrip } from './tracker';

/**
 * Tracked trips and their status events (boarded, get off soon, transferred, passed a place,
 * arrived or ended), sent to the backend for usage data. Signed-out riders are identified only
 * by a random per-install id. Everything waits in a queue in AsyncStorage until the backend has
 * it, so a ride without signal, or tracked in the background, still arrives later.
 */

const QUEUE_KEY = 'tripLogQueue';
const DEVICE_KEY = 'deviceId';

// Per trip id: the trip, with only the events not yet sent
type Queue = Record<string, TripSyncBody>;

/** A random v4 UUID (ids are made on the phone, so events can be queued offline). */
export function newId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

let deviceId: Promise<string> | null = null;
function getDeviceId(): Promise<string> {
  deviceId ??= AsyncStorage.getItem(DEVICE_KEY)
    .then(async (saved) => {
      if (saved) return saved;
      const id = newId();
      await AsyncStorage.setItem(DEVICE_KEY, id);
      return id;
    })
    .catch(() => newId());
  return deviceId;
}

async function readQueue(): Promise<Queue> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY).catch(() => null);
  try {
    return raw ? (JSON.parse(raw) as Queue) : {};
  } catch {
    return {};
  }
}

const writeQueue = (queue: Queue) =>
  AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch((e) =>
    console.warn('Could not save the trip log', e),
  );

// Changes and sends run one at a time, so two can't overwrite each other's queue
let chain: Promise<void> = Promise.resolve();
function serially(task: () => Promise<void>) {
  chain = chain.then(task).catch((e) => console.warn('Trip log failed', e));
  return chain;
}

async function change(update: (queue: Queue) => void) {
  const queue = await readQueue();
  update(queue);
  await writeQueue(queue);
}

/** Send whatever is queued; what fails stays for the next try (the next event, or app start). */
export function flushTripLog() {
  return serially(async () => {
    const queue = await readQueue();
    for (const [id, trip] of Object.entries(queue)) {
      try {
        await api.trips.sync(id, trip);
      } catch {
        continue; // offline or the backend is down: keep it
      }
      // Anything added while this was sending stays queued
      const sent = new Set(trip.events.map((e) => e.id));
      await change((latest) => {
        const now = latest[id];
        if (!now) return;
        now.events = now.events.filter((e) => !sent.has(e.id));
        if (now.endedAt && trip.endedAt && now.events.length === 0) delete latest[id];
      });
    }
  });
}

const toPoint = (p: LatLng | null | undefined) =>
  p ? { lat: p.latitude, lng: p.longitude } : null;

/** A trip just started tracking. */
export function logTripStart(active: ActiveTrip) {
  const { id, trip, start, destination, startedAt } = active;
  void serially(async () => {
    const body: TripSyncBody = {
      deviceId: await getDeviceId(),
      routeId: trip.routeId,
      routeCodes: trip.legs.map((leg) => leg.routeCode),
      start: toPoint(start),
      destination: { lat: destination.latitude, lng: destination.longitude },
      fare: trip.totalFare ?? trip.fare ?? null,
      startedAt: new Date(startedAt).toISOString(),
      endedAt: null,
      outcome: null,
      events: [],
    };
    await change((queue) => {
      queue[id] = body;
    });
  });
  void flushTripLog();
}

export type TripEventInput = {
  kind: TripEventKind;
  legIndex?: number;
  routeCode?: string;
  placeId?: string;
  placeName?: string;
  position?: LatLng;
  speed?: number | null;
};

/** Something happened on the trip with id `tripId`. */
export function logTripEvent(tripId: string, event: TripEventInput) {
  const body: TripEventBody = {
    id: newId(),
    kind: event.kind,
    legIndex: event.legIndex ?? null,
    routeCode: event.routeCode ?? null,
    placeId: event.placeId ?? null,
    placeName: event.placeName ?? null,
    lat: event.position?.latitude ?? null,
    lng: event.position?.longitude ?? null,
    speed: event.speed ?? null,
    at: new Date().toISOString(),
  };
  void serially(() =>
    change((queue) => {
      queue[tripId]?.events.push(body);
    }),
  );
  void flushTripLog();
}

/** The trip ended: at the destination, or by the rider. */
export function logTripEnd(tripId: string, outcome: 'arrived' | 'ended') {
  void serially(() =>
    change((queue) => {
      const trip = queue[tripId];
      if (!trip) return;
      trip.endedAt = new Date().toISOString();
      trip.outcome = outcome;
    }),
  );
  void flushTripLog();
}

/**
 * The events between two progress states from one location fix: boarding a jeep, the alert
 * before its stop, moving on to the next jeep, arriving. Steps skipped over (a missed transfer
 * caught up later) aren't reported as boarded or alerted.
 */
export function progressEvents(
  trip: TripOption,
  before: TripProgress,
  after: TripProgress,
): TripEventInput[] {
  const events: TripEventInput[] = [];
  const leg = after.legIndex;
  const routeCode = trip.legs[leg]?.routeCode;
  if (after.legIndex > before.legIndex) {
    events.push({ kind: 'transferred', legIndex: leg, routeCode });
  }
  if (!before.boarded[leg] && after.boarded[leg]) {
    events.push({ kind: 'boarded', legIndex: leg, routeCode });
  }
  if (!before.alerted[leg] && after.alerted[leg] && after.boarded[leg]) {
    events.push({ kind: 'get_off_soon', legIndex: leg, routeCode });
  }
  if (!before.arrived && after.arrived) events.push({ kind: 'arrived', legIndex: leg });
  return events;
}
