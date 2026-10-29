import { Hono } from 'hono';
import { POPULAR_PLACES } from '../data/popularPlaces';
import { autocomplete, placeDetails } from '../services/places';
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

// Curated destinations for the app's Home screen (before /:id so it isn't read as an id)
places.get('/popular', (c) => c.json(POPULAR_PLACES));

places.get('/:id', async (c) => {
  return c.json(await placeDetails(c.req.param('id'), c.req.query('session') || undefined));
});
