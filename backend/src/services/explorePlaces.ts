import { POPULAR_PLACES, type PlaceCategory } from '../data/popularPlaces';
import type { LatLng } from '../types/GeoTypes';
import { searchPlacesPage, type PlacePhoto } from './places';
import { getNetwork } from './routing/network';

// What to ask Google for, in order, per category. One search runs out after a few pages, so
// each category has several and the list moves on to the next; "all" goes through them all.
type Search = { query: string; category: PlaceCategory | null };
const SEARCHES_BY_CATEGORY: Record<PlaceCategory, string[]> = {
  mall: ['shopping malls in Cebu', 'supermarkets in Cebu City', 'public markets in Cebu City'],
  school: [
    'universities in Cebu City',
    'colleges in Cebu City',
    'high schools in Cebu City',
    'elementary schools in Cebu City',
  ],
  terminal: ['bus terminals in Cebu', 'ports and piers in Cebu City', 'jeepney terminals in Cebu'],
  hospital: ['hospitals in Cebu City', 'medical centers in Cebu', 'health centers in Cebu City'],
  landmark: [
    'tourist attractions in Cebu City',
    'churches in Cebu City',
    'parks in Cebu City',
    'museums in Cebu City',
  ],
};
const SEARCHES: Record<PlaceCategory | 'all', Search[]> = {
  ...(Object.fromEntries(
    Object.entries(SEARCHES_BY_CATEGORY).map(([category, queries]) => [
      category,
      queries.map((query) => ({ query, category: category as PlaceCategory })),
    ]),
  ) as Record<PlaceCategory, Search[]>),
  all: [
    { query: 'popular places in Cebu City', category: null },
    ...Object.entries(SEARCHES_BY_CATEGORY).flatMap(([category, queries]) =>
      queries.map((query) => ({ query, category: category as PlaceCategory })),
    ),
  ],
};

// The app's page token: which search, and Google's page token within it
const encodePage = (search: number, google: string | null) =>
  Buffer.from(JSON.stringify({ s: search, g: google })).toString('base64url');
function decodePage(token: string | undefined): { search: number; google: string | null } {
  if (!token) return { search: 0, google: null };
  try {
    const { s, g } = JSON.parse(Buffer.from(token, 'base64url').toString()) as {
      s?: number;
      g?: string | null;
    };
    return { search: Number.isInteger(s) && s! >= 0 ? s! : 0, google: g ?? null };
  } catch {
    return { search: 0, google: null };
  }
}

// Same reach as the trip planner: a place farther than this from every route can't be planned to
const ACCESS_RADIUS_M = 500;

export interface ExplorePlace {
  placeId: string;
  name: string;
  area: string;
  category: PlaceCategory | null;
  location: LatLng;
  photo: PlacePhoto | null;
}

const curatedIds = new Set(POPULAR_PLACES.map((p) => p.placeId));
// Google can list a curated place under another id (e.g. "Ayala Center Cebu"), so names count too
const simplify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const curatedNames = POPULAR_PLACES.map((p) => simplify(p.name));
const isCurated = (placeId: string, name: string) => {
  if (curatedIds.has(placeId)) return true;
  const n = simplify(name);
  return curatedNames.some((c) => n === c || n.startsWith(`${c} `) || c.startsWith(`${n} `));
};

/**
 * One page of more places for the Home list, past the curated ones: Google's results for the
 * category, minus curated places and anything a jeepney route doesn't come within walking
 * distance of. `nextPageToken` continues the list; null when Google has no more.
 */
export async function explorePlaces(
  category: PlaceCategory | 'all',
  pageToken: string | undefined,
): Promise<{ places: ExplorePlace[]; nextPageToken: string | null }> {
  const searches = SEARCHES[category];
  const at = decodePage(pageToken);
  const search = searches[at.search];
  if (!search) return { places: [], nextPageToken: null };

  const [page, net] = await Promise.all([
    searchPlacesPage(search.query, at.google ?? undefined),
    getNetwork(),
  ]);
  const places = page.places
    .filter((p) => !isCurated(p.placeId, p.name))
    .filter((p) => net.index.within(p.location, ACCESS_RADIUS_M).length > 0)
    .map((p) => ({ ...p, category: search.category }));

  // More pages of this search, else the next search, else the end
  const nextPageToken = page.nextPageToken
    ? encodePage(at.search, page.nextPageToken)
    : at.search + 1 < searches.length
      ? encodePage(at.search + 1, null)
      : null;
  return { places, nextPageToken };
}
