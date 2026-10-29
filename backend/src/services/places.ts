import { env } from '../env';
import { HttpError, notFound } from '../lib/http';
import { log } from '../lib/log';
import type { LatLng } from '../types/GeoTypes';

// Google Places API (New). The key stays on the server; the app only sees these shapes.
const PLACES_URL = 'https://places.googleapis.com/v1';

// Without a location from the app, bias results to Metro Cebu.
const CEBU: LatLng = { latitude: 10.3157, longitude: 123.8854 };
const BIAS_RADIUS_M = 30000;

export interface PlaceSuggestion {
  placeId: string;
  name: string;
  address: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  location: LatLng;
}

function requireKey(): string {
  if (!env.googleMapsServerKey) {
    throw new HttpError(503, { error: 'Place search is not configured' });
  }
  return env.googleMapsServerKey;
}

async function placesFetch<T>(path: string, init: RequestInit, fieldMask?: string): Promise<T> {
  const res = await fetch(`${PLACES_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': requireKey(),
      ...(fieldMask ? { 'X-Goog-FieldMask': fieldMask } : {}),
      ...init.headers,
    },
  });
  if (res.status === 404) throw notFound('Place not found');
  if (!res.ok) {
    log.error('Places API error', res.status, await res.text());
    throw new HttpError(502, { error: 'Place search failed' });
  }
  return (await res.json()) as T;
}

type AutocompleteResponse = {
  suggestions?: {
    placePrediction?: {
      placeId: string;
      text?: { text: string };
      structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
    };
  }[];
};

/**
 * Place suggestions for a partial query, biased around `near` (or Cebu) and limited to the
 * Philippines. `sessionToken` groups the keystrokes and the final details call into one
 * billed session.
 */
export async function autocomplete(
  input: string,
  sessionToken: string | undefined,
  near: LatLng | undefined,
): Promise<PlaceSuggestion[]> {
  const center = near ?? CEBU;
  const data = await placesFetch<AutocompleteResponse>('/places:autocomplete', {
    method: 'POST',
    body: JSON.stringify({
      input,
      sessionToken,
      includedRegionCodes: ['ph'],
      locationBias: {
        circle: {
          center: { latitude: center.latitude, longitude: center.longitude },
          radius: BIAS_RADIUS_M,
        },
      },
    }),
  });

  return (data.suggestions ?? []).flatMap(({ placePrediction: p }) =>
    p
      ? [
          {
            placeId: p.placeId,
            name: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
            address: p.structuredFormat?.secondaryText?.text ?? '',
          },
        ]
      : [],
  );
}

type DetailsResponse = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
};

export async function placeDetails(
  placeId: string,
  sessionToken: string | undefined,
): Promise<PlaceDetails> {
  const query = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : '';
  const data = await placesFetch<DetailsResponse>(
    `/places/${encodeURIComponent(placeId)}${query}`,
    { method: 'GET' },
    'id,displayName,formattedAddress,location',
  );
  if (!data.location) throw notFound('Place has no location');

  return {
    placeId: data.id,
    name: data.displayName?.text ?? data.formattedAddress ?? 'Selected place',
    address: data.formattedAddress ?? '',
    location: { latitude: data.location.latitude, longitude: data.location.longitude },
  };
}
