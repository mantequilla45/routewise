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

export interface PlacePhoto {
  /** Google's photo resource name. Must not be stored long term; fetch it fresh. */
  name: string;
  /** Who took it. Google requires this to be shown with the photo. */
  attribution: string;
}

type PhotosResponse = {
  photos?: { name: string; authorAttributions?: { displayName?: string }[] }[];
};

/** The first photo of a place and its author, or null when it has none. */
export async function placePhoto(placeId: string): Promise<PlacePhoto | null> {
  const data = await placesFetch<PhotosResponse>(
    `/places/${encodeURIComponent(placeId)}`,
    { method: 'GET' },
    'photos',
  );
  const photo = data.photos?.[0];
  if (!photo) return null;
  return {
    name: photo.name,
    attribution: photo.authorAttributions?.[0]?.displayName ?? 'Google Maps contributor',
  };
}

/** A photo resource name: `places/{placeId}/photos/{photoId}`. */
export const PHOTO_NAME = /^places\/[\w-]+\/photos\/[\w-]+$/;

/**
 * A short-lived image URL for a photo, sized to `maxWidthPx`. The URL carries no API key, so the
 * app can load it directly.
 */
export async function photoUrl(photoName: string, maxWidthPx: number): Promise<string> {
  const data = await placesFetch<{ photoUri?: string }>(
    `/${photoName}/media?maxWidthPx=${maxWidthPx}&skipHttpRedirect=true`,
    { method: 'GET' },
  );
  if (!data.photoUri) throw notFound('Photo not found');
  return data.photoUri;
}

type SearchPhotosResponse = {
  places?: {
    displayName?: { text: string };
    location?: { latitude: number; longitude: number };
    types?: string[];
    photos?: { name: string; authorAttributions?: { displayName?: string }[] }[];
  }[];
};

// A result must be this close to the saved point to be the same place
const SAME_PLACE_RADIUS_M = 200;
// Results that are only a road or an address: their "photos" are of whatever stands nearby
const NOT_A_PLACE = new Set(['route', 'street_address', 'intersection', 'premise', 'plus_code']);

const words = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);

/** True when two place names share most of their words ("Ayala Center" vs "Ayala Center Cebu"). */
function sameName(a: string, b: string): boolean {
  const wa = words(a);
  const wb = new Set(words(b));
  if (wa.length === 0 || wb.size === 0) return false;
  const shared = wa.filter((w) => wb.has(w)).length;
  return shared / Math.min(wa.length, wb.size) >= 0.6;
}

function metersBetween(a: LatLng, b: LatLng): number {
  const k = 111320;
  const dx = (b.longitude - a.longitude) * k * Math.cos((a.latitude * Math.PI) / 180);
  const dy = (b.latitude - a.latitude) * k;
  return Math.hypot(dx, dy);
}

/**
 * A photo of the place named `name` at `point` (e.g. a saved route's destination, stored as
 * coordinates and a name only). Only a result with a matching name, close to the point, and that
 * is a real place rather than a road or address counts; otherwise null, so the app shows its
 * placeholder instead of a photo of whatever happens to be nearby.
 */
export async function photoOfPlace(name: string, point: LatLng): Promise<PlacePhoto | null> {
  const data = await placesFetch<SearchPhotosResponse>(
    '/places:searchText',
    {
      method: 'POST',
      body: JSON.stringify({
        textQuery: name,
        locationBias: {
          circle: {
            center: { latitude: point.latitude, longitude: point.longitude },
            radius: SAME_PLACE_RADIUS_M,
          },
        },
        maxResultCount: 3,
      }),
    },
    'places.displayName,places.location,places.types,places.photos',
  );
  const match = data.places?.find(
    (p) =>
      p.photos?.length &&
      p.location &&
      metersBetween(point, p.location) <= SAME_PLACE_RADIUS_M &&
      !p.types?.some((t) => NOT_A_PLACE.has(t)) &&
      sameName(name, p.displayName?.text ?? ''),
  );
  const photo = match?.photos?.[0];
  if (!photo) return null;
  return {
    name: photo.name,
    attribution: photo.authorAttributions?.[0]?.displayName ?? 'Google Maps contributor',
  };
}

type SearchPageResponse = {
  places?: {
    id: string;
    displayName?: { text: string };
    shortFormattedAddress?: string;
    location?: { latitude: number; longitude: number };
    photos?: { name: string; authorAttributions?: { displayName?: string }[] }[];
  }[];
  nextPageToken?: string;
};

/** One page (up to 20) of a text search around Metro Cebu, with each place's first photo. */
export async function searchPlacesPage(
  query: string,
  pageToken: string | undefined,
): Promise<{
  places: {
    placeId: string;
    name: string;
    area: string;
    location: LatLng;
    photo: PlacePhoto | null;
  }[];
  nextPageToken: string | null;
}> {
  const data = await placesFetch<SearchPageResponse>(
    '/places:searchText',
    {
      method: 'POST',
      body: JSON.stringify({
        textQuery: query,
        pageSize: 20,
        ...(pageToken && { pageToken }),
        locationBias: {
          circle: {
            center: { latitude: CEBU.latitude, longitude: CEBU.longitude },
            radius: BIAS_RADIUS_M,
          },
        },
      }),
    },
    'places.id,places.displayName,places.shortFormattedAddress,places.location,places.photos,nextPageToken',
  );
  return {
    places: (data.places ?? []).flatMap((p) => {
      if (!p.location || !p.displayName?.text) return [];
      const photo = p.photos?.[0];
      // The area: the address minus the street, e.g. "Mabolo, Cebu City"
      const parts = (p.shortFormattedAddress ?? '').split(',').map((s) => s.trim());
      return [
        {
          placeId: p.id,
          name: p.displayName.text,
          area: parts.slice(-2).join(', ') || 'Cebu',
          location: { latitude: p.location.latitude, longitude: p.location.longitude },
          photo: photo
            ? {
                name: photo.name,
                attribution:
                  photo.authorAttributions?.[0]?.displayName ?? 'Google Maps contributor',
              }
            : null,
        },
      ];
    }),
    nextPageToken: data.nextPageToken ?? null,
  };
}
