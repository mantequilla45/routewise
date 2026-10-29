import type { LatLng } from '../types/GeoTypes';

export type PlaceCategory = 'mall' | 'school' | 'terminal' | 'hospital' | 'landmark';

export interface PopularPlace {
  /** Google Place ID (storable indefinitely under Google's terms), used to fetch a photo. */
  placeId: string;
  name: string;
  area: string;
  category: PlaceCategory;
  location: LatLng;
}

/**
 * Well-known Cebu City destinations shown on the app's Home screen. Coordinates come from
 * Google Places; each place has at least one jeepney route within 500 m (checked against the
 * network when added). SM Seaside City is left out: no route passes within 500 m of it yet.
 * Replace with real search/trip counts once those are tracked.
 */
export const POPULAR_PLACES: PopularPlace[] = [
  {
    category: 'mall',
    placeId: 'ChIJu5dH8GyZqTMRSC9ixmg-G7k',

    name: 'SM City Cebu',
    area: 'Mabolo',
    location: { latitude: 10.31142, longitude: 123.91782 },
  },
  {
    category: 'mall',
    placeId: 'ChIJw-AD_z6ZqTMRQLzh6M-SweI',

    name: 'Ayala Center Cebu',
    area: 'Cebu Business Park',
    location: { latitude: 10.318237, longitude: 123.905229 },
  },
  {
    category: 'mall',
    placeId: 'ChIJQXUbqWiZqTMRyCeJrDLlAw0',

    name: 'Robinsons Galleria',
    area: 'S. Osmeña Jr Blvd',
    location: { latitude: 10.3042, longitude: 123.91126 },
  },
  {
    category: 'mall',
    placeId: 'ChIJB5uWUk6ZqTMRr0lOEKGheTg',

    name: 'Robinsons Fuente',
    area: 'Fuente Osmeña',
    location: { latitude: 10.30944, longitude: 123.8939 },
  },
  {
    category: 'landmark',
    placeId: 'ChIJzQIV3CGZqTMRlWk_9p1F2hQ',

    name: 'Cebu IT Park',
    area: 'Lahug',
    location: { latitude: 10.33167, longitude: 123.90648 },
  },
  {
    category: 'landmark',
    placeId: 'ChIJ5Wmki06ZqTMRjBpyPwKxMHA',

    name: 'Fuente Osmeña Circle',
    area: 'Cebu City',
    location: { latitude: 10.31039, longitude: 123.89274 },
  },
  {
    category: 'landmark',
    placeId: 'ChIJJ1lXkeKbqTMR57n3HvmTgZo',

    name: 'Colon Street',
    area: 'Downtown',
    location: { latitude: 10.29674, longitude: 123.89903 },
  },
  {
    category: 'landmark',
    placeId: 'ChIJkw4YkuSbqTMRj-KNt73Rp_w',

    name: 'Carbon Market',
    area: 'Downtown',
    location: { latitude: 10.29144, longitude: 123.89913 },
  },
  {
    category: 'landmark',
    placeId: 'ChIJ1x1EHOGbqTMR5_q34HlTerk',

    name: 'Plaza Independencia',
    area: 'Pier area',
    location: { latitude: 10.29319, longitude: 123.90513 },
  },
  {
    category: 'terminal',
    placeId: 'ChIJUS73LlaZqTMRXPPNZsZ8Nbg',

    name: 'South Bus Terminal',
    area: 'N. Bacalso Ave',
    location: { latitude: 10.29826, longitude: 123.89315 },
  },
  {
    category: 'terminal',
    placeId: 'ChIJZ8wgqw6ZqTMRHqxQTfV-WvQ',

    name: 'North Bus Terminal',
    area: 'beside SM City Cebu',
    location: { latitude: 10.31077, longitude: 123.92125 },
  },
  {
    category: 'school',
    placeId: 'ChIJhcRHjPiZqTMRTmjIJd9cFOs',

    name: 'USC Downtown Campus',
    area: 'P. del Rosario St',
    location: { latitude: 10.29945, longitude: 123.89879 },
  },
  {
    category: 'school',
    placeId: 'ChIJJa620ZSYqTMRncUWk-m52cI',

    name: 'USC Talamban Campus',
    area: 'Talamban',
    location: { latitude: 10.35212, longitude: 123.91327 },
  },
  {
    category: 'school',
    placeId: 'ChIJQ3xGVcWYqTMRiGMnijK7ZO0',

    name: 'USJ-R Main',
    area: 'Downtown',
    location: { latitude: 10.294, longitude: 123.89751 },
  },
  {
    category: 'school',
    placeId: 'ChIJ5VLBVP2bqTMRoG2ZvfTzsvk',

    name: 'University of Cebu Main',
    area: 'Sanciangko St',
    location: { latitude: 10.29705, longitude: 123.89666 },
  },
  {
    category: 'school',
    placeId: 'ChIJOSe8brSeqTMRtHC5ejjuLMI',

    name: 'Cebu Normal University',
    area: 'Osmeña Blvd',
    location: { latitude: 10.30169, longitude: 123.89674 },
  },
  {
    category: 'school',
    placeId: 'ChIJf7QlQTqZqTMRqRfk_h8Sb9k',

    name: 'UP Cebu',
    area: 'Gorordo Ave',
    location: { latitude: 10.32229, longitude: 123.8982 },
  },
  {
    category: 'hospital',
    placeId: 'ChIJ40MeAk6ZqTMRbqk9ZVmqeoE',

    name: 'Vicente Sotto Medical Center',
    area: 'B. Rodriguez St',
    location: { latitude: 10.30801, longitude: 123.89159 },
  },
  {
    category: 'hospital',
    placeId: 'ChIJ55Q5ekmZqTMR7nLs2XqB7W0',

    name: 'Cebu Doctors’ University Hospital',
    area: 'Osmeña Blvd',
    location: { latitude: 10.31446, longitude: 123.89203 },
  },
  {
    category: 'hospital',
    placeId: 'ChIJd65ggk6ZqTMR57jr_PQCALs',

    name: 'Chong Hua Hospital',
    area: 'Fuente Osmeña',
    location: { latitude: 10.30983, longitude: 123.89095 },
  },
  {
    category: 'hospital',
    placeId: 'ChIJE4rQCUeZqTMRNvQDEK_GkBU',

    name: 'Perpetual Succour Hospital',
    area: 'Gorordo Ave',
    location: { latitude: 10.31512, longitude: 123.89982 },
  },
];
