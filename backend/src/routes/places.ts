import { Hono } from 'hono';
import { POPULAR_PLACES } from '../data/popularPlaces';
import {
  autocomplete,
  PHOTO_NAME,
  photoOfPlace,
  photoUrl,
  placeDetails,
  placePhoto,
} from '../services/places';
import { explorePlaces } from '../services/explorePlaces';
import type { PlaceCategory } from '../data/popularPlaces';
import type { LatLng } from '../types/GeoTypes';

// Place search for the app's start/destination pickers. Public: works before sign-in.
export const places = new Hono();

function parseNear(lat: string | undefined, lng: string | undefined): LatLng | undefined {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!lat || !lng || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  return { latitude, longitude };
}

places.get('/autocomplete', async (c) => {
  const q = (c.req.query('q') ?? '').trim();
  if (q.length < 2 || q.length > 100) {
    return c.json({ error: 'q must be 2-100 characters' }, 400);
  }
  const suggestions = await autocomplete(
    q,
    c.req.query('session') || undefined,
    parseNear(c.req.query('lat'), c.req.query('lng')),
  );
  return c.json(suggestions);
});

// Vercel's edge keeps these for a day, so Google is asked about once a day per region rather
// than on every Home screen load. Photo names may only be kept briefly, which a day respects.
const EDGE_CACHE_DAY = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400';

// Width requested from Google. Photos are landscape, so this keeps the height above 168 px,
// enough for a sharp 56pt square thumbnail at 3x.
const THUMB_WIDTH_PX = 400;

// Curated destinations for the app's Home screen, each with a current photo and its author
// (Google requires showing the author). A place whose photo lookup fails is listed without one.
// Registered before /:id so these paths aren't read as place ids.
places.get('/popular', async (c) => {
  const photos = await Promise.allSettled(POPULAR_PLACES.map((p) => placePhoto(p.placeId)));
  const withPhotos = POPULAR_PLACES.map((place, i) => {
    const result = photos[i];
    const photo = result.status === 'fulfilled' ? result.value : null;
    return {
      ...place,
      photo: photo
        ? {
            path: `/places/photo?name=${encodeURIComponent(photo.name)}`,
            attribution: photo.attribution,
          }
        : null,
    };
  });
  c.header('Cache-Control', EDGE_CACHE_DAY);
  return c.json(withPhotos);
});

const CATEGORIES = new Set(['all', 'mall', 'school', 'terminal', 'hospital', 'landmark']);

// More places for Home's list once the curated ones run out, a page at a time; only places a
// jeepney route reaches. Each page is edge-cached for a day like the popular list.
places.get('/explore', async (c) => {
  const category = c.req.query('category') ?? 'all';
  if (!CATEGORIES.has(category)) return c.json({ error: 'Unknown category' }, 400);
  const { places: found, nextPageToken } = await explorePlaces(
    category as PlaceCategory | 'all',
    c.req.query('page') || undefined,
  );
  c.header('Cache-Control', EDGE_CACHE_DAY);
  return c.json({
    places: found.map((p) => ({
      ...p,
      photo: p.photo
        ? {
            path: `/places/photo?name=${encodeURIComponent(p.photo.name)}`,
            attribution: p.photo.attribution,
          }
        : null,
    })),
    nextPageToken,
  });
});

// A photo of a named place at a point (a saved route's destination has a name and coordinates,
// not a place id); null unless Google has that same place there. Coordinates are rounded to
// ~10 m so repeat requests share one edge-cached answer.
places.get('/photo-near', async (c) => {
  const near = parseNear(c.req.query('lat'), c.req.query('lng'));
  const name = (c.req.query('name') ?? '').trim();
  if (!near || !name || name.length > 120) {
    return c.json({ error: 'lat, lng and name are required' }, 400);
  }
  const round = (n: number) => Math.round(n * 1e4) / 1e4;
  const photo = await photoOfPlace(name, {
    latitude: round(near.latitude),
    longitude: round(near.longitude),
  });
  c.header('Cache-Control', EDGE_CACHE_DAY);
  return c.json({
    photo: photo
      ? {
          path: `/places/photo?name=${encodeURIComponent(photo.name)}`,
          attribution: photo.attribution,
        }
      : null,
  });
});

// The image itself: a redirect to Google's keyless image URL, so the server key stays here.
places.get('/photo', async (c) => {
  const name = c.req.query('name') ?? '';
  if (!PHOTO_NAME.test(name)) return c.json({ error: 'Invalid photo name' }, 400);
  const url = await photoUrl(name, THUMB_WIDTH_PX);
  c.header('Cache-Control', EDGE_CACHE_DAY);
  return c.redirect(url, 302);
});

places.get('/:id', async (c) => {
  return c.json(await placeDetails(c.req.param('id'), c.req.query('session') || undefined));
});
