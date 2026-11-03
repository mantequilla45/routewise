import { HttpError } from '../lib/http';
import { log } from '../lib/log';
import { supabaseAdmin } from '../lib/supabase';

export const TRIP_EVENT_KINDS = [
  'boarded',
  'get_off_soon',
  'transferred',
  'passed_place',
  'arrived',
  'ended',
] as const;
export type TripEventKind = (typeof TRIP_EVENT_KINDS)[number];

export interface TripEvent {
  id: string;
  kind: TripEventKind;
  legIndex: number | null;
  routeCode: string | null;
  placeId: string | null;
  placeName: string | null;
  lat: number | null;
  lng: number | null;
  speed: number | null;
  at: string;
}

export interface TripSync {
  deviceId: string;
  routeId: string;
  routeCodes: string[];
  start: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number };
  fare: number | null;
  startedAt: string;
  endedAt: string | null;
  outcome: 'arrived' | 'ended' | null;
  events: TripEvent[];
}

/**
 * Records a tracked trip and its events, idempotently: the app sends the same trip again as it
 * goes (start, each event, the end) and resends after failures. The trip belongs to the device
 * that created it; `userId` is kept once known (signing in mid-trip attaches it).
 */
export async function syncTrip(id: string, trip: TripSync, userId: string | null) {
  const { data: existing, error: readError } = await supabaseAdmin
    .from('trips')
    .select('device_id, user_id, ended_at')
    .eq('id', id)
    .maybeSingle();
  if (readError) throw failed('Error reading trip:', readError);
  if (existing && existing.device_id !== trip.deviceId) {
    throw new HttpError(404, { error: 'Trip not found' });
  }

  const row = {
    id,
    device_id: trip.deviceId,
    user_id: userId ?? existing?.user_id ?? null,
    route_id: trip.routeId,
    route_codes: trip.routeCodes,
    start_lat: trip.start?.lat ?? null,
    start_lng: trip.start?.lng ?? null,
    end_lat: trip.destination.lat,
    end_lng: trip.destination.lng,
    fare: trip.fare,
    started_at: trip.startedAt,
    // An ended trip stays ended
    ended_at: existing?.ended_at ?? trip.endedAt,
    ...(trip.outcome && { outcome: trip.outcome }),
  };
  const { error: tripError } = await supabaseAdmin.from('trips').upsert(row);
  if (tripError) throw failed('Error saving trip:', tripError);

  if (trip.events.length === 0) return;
  const events = trip.events.map((e) => ({
    id: e.id,
    trip_id: id,
    kind: e.kind,
    leg_index: e.legIndex,
    route_code: e.routeCode,
    place_id: e.placeId,
    place_name: e.placeName,
    lat: e.lat,
    lng: e.lng,
    speed: e.speed,
    at: e.at,
  }));
  const { error: eventsError } = await supabaseAdmin
    .from('trip_events')
    .upsert(events, { ignoreDuplicates: true });
  if (eventsError) throw failed('Error saving trip events:', eventsError);
}

function failed(message: string, error: unknown) {
  log.error(message, error);
  return new HttpError(500, { error: 'Failed to save trip' });
}
