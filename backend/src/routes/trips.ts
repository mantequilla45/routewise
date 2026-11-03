import { Hono } from 'hono';
import { badRequest } from '../lib/http';
import { optionalAuth, type OptionalAuthVariables } from '../middleware/auth';
import {
  syncTrip,
  TRIP_EVENT_KINDS,
  type TripEvent,
  type TripEventKind,
  type TripSync,
} from '../services/trips';

// Tracked trips, for usage data. Open to signed-out riders (identified by a random device id);
// a signed-in rider's trips are linked to their account.
export const trips = new Hono<{ Variables: OptionalAuthVariables }>();

trips.use('*', optionalAuth);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// One trip's events are a handful; this only stops oversized bodies
const MAX_EVENTS = 200;

trips.put('/:id', async (c) => {
  const id = c.req.param('id');
  if (!UUID.test(id)) throw badRequest('Trip id must be a UUID');
  const body = (await c.req.json().catch(() => null)) as unknown;
  await syncTrip(id, parseTrip(body), c.get('profile')?.id ?? null);
  return c.body(null, 204);
});

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isText = (v: unknown, max = 200): v is string =>
  typeof v === 'string' && v.length > 0 && v.length <= max;
const isTime = (v: unknown): v is string => isText(v, 40) && !Number.isNaN(Date.parse(v));
const textOrNull = (v: unknown) => (isText(v) ? v : null);
const numOrNull = (v: unknown) => (isNum(v) ? v : null);

function parsePoint(v: unknown): { lat: number; lng: number } | null {
  return isRecord(v) && isNum(v.lat) && isNum(v.lng) ? { lat: v.lat, lng: v.lng } : null;
}

function parseTrip(body: unknown): TripSync {
  if (!isRecord(body)) throw badRequest('Invalid JSON body');
  const destination = parsePoint(body.destination);
  if (!isText(body.deviceId, 100)) throw badRequest('deviceId is required');
  if (!isText(body.routeId)) throw badRequest('routeId is required');
  if (!destination) throw badRequest('destination is required');
  if (!isTime(body.startedAt)) throw badRequest('startedAt must be a timestamp');
  if (!Array.isArray(body.events) || body.events.length > MAX_EVENTS) {
    throw badRequest(`events must be an array of at most ${MAX_EVENTS}`);
  }
  const outcome = body.outcome === 'arrived' || body.outcome === 'ended' ? body.outcome : null;

  return {
    deviceId: body.deviceId,
    routeId: body.routeId,
    routeCodes: Array.isArray(body.routeCodes) ? body.routeCodes.filter((c) => isText(c, 40)) : [],
    start: parsePoint(body.start),
    destination,
    fare: numOrNull(body.fare),
    startedAt: body.startedAt,
    endedAt: isTime(body.endedAt) ? body.endedAt : null,
    outcome,
    events: body.events.map(parseEvent),
  };
}

function parseEvent(v: unknown): TripEvent {
  if (!isRecord(v) || !isText(v.id) || !UUID.test(v.id)) {
    throw badRequest('Event id must be a UUID');
  }
  if (!TRIP_EVENT_KINDS.includes(v.kind as TripEventKind)) throw badRequest('Unknown event kind');
  if (!isTime(v.at)) throw badRequest('Event at must be a timestamp');
  return {
    id: v.id,
    kind: v.kind as TripEventKind,
    legIndex: isNum(v.legIndex) ? Math.trunc(v.legIndex) : null,
    routeCode: textOrNull(v.routeCode),
    placeId: textOrNull(v.placeId),
    placeName: textOrNull(v.placeName),
    lat: numOrNull(v.lat),
    lng: numOrNull(v.lng),
    speed: numOrNull(v.speed),
    at: v.at,
  };
}
