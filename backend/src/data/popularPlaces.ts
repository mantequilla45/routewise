import type { LatLng } from '../types/GeoTypes';

export type PlaceCategory = 'mall' | 'school' | 'terminal' | 'hospital' | 'landmark';

export interface PopularPlace {
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
    name: 'SM City Cebu',
    area: 'Mabolo',
    location: { latitude: 10.31142, longitude: 123.91782 },
  },
  {
    category: 'mall',
    name: 'Ayala Center Cebu',
    area: 'Cebu Business Park',
    location: { latitude: 10.318237, longitude: 123.905229 },
  },
  {
    category: 'mall',
    name: 'Robinsons Galleria',
    area: 'S. Osmeña Jr Blvd',
    location: { latitude: 10.3042, longitude: 123.91126 },
  },
  {
    category: 'mall',
    name: 'Robinsons Fuente',
    area: 'Fuente Osmeña',
    location: { latitude: 10.30944, longitude: 123.8939 },
  },
  {
    category: 'landmark',
    name: 'Cebu IT Park',
    area: 'Lahug',
    location: { latitude: 10.33167, longitude: 123.90648 },
  },
  {
    category: 'landmark',
    name: 'Fuente Osmeña Circle',
    area: 'Cebu City',
    location: { latitude: 10.31039, longitude: 123.89274 },
  },
  {
    category: 'landmark',
    name: 'Colon Street',
    area: 'Downtown',
    location: { latitude: 10.29674, longitude: 123.89903 },
  },
  {
    category: 'landmark',
    name: 'Carbon Market',
    area: 'Downtown',
    location: { latitude: 10.29144, longitude: 123.89913 },
  },
  {
    category: 'landmark',
    name: 'Plaza Independencia',
    area: 'Pier area',
    location: { latitude: 10.29319, longitude: 123.90513 },
  },
  {
    category: 'terminal',
    name: 'South Bus Terminal',
    area: 'N. Bacalso Ave',
    location: { latitude: 10.29826, longitude: 123.89315 },
  },
  {
    category: 'terminal',
    name: 'North Bus Terminal',
    area: 'beside SM City Cebu',
    location: { latitude: 10.31077, longitude: 123.92125 },
  },
  {
    category: 'school',
    name: 'USC Downtown Campus',
    area: 'P. del Rosario St',
    location: { latitude: 10.29945, longitude: 123.89879 },
  },
  {
    category: 'school',
    name: 'USC Talamban Campus',
    area: 'Talamban',
    location: { latitude: 10.35212, longitude: 123.91327 },
  },
  {
    category: 'school',
    name: 'USJ-R Main',
    area: 'Downtown',
    location: { latitude: 10.294, longitude: 123.89751 },
  },
  {
    category: 'school',
    name: 'University of Cebu Main',
    area: 'Sanciangko St',
    location: { latitude: 10.29705, longitude: 123.89666 },
  },
  {
    category: 'school',
    name: 'Cebu Normal University',
    area: 'Osmeña Blvd',
    location: { latitude: 10.30169, longitude: 123.89674 },
  },
  {
    category: 'school',
    name: 'UP Cebu',
    area: 'Gorordo Ave',
    location: { latitude: 10.32229, longitude: 123.8982 },
  },
  {
    category: 'hospital',
    name: 'Vicente Sotto Medical Center',
    area: 'B. Rodriguez St',
    location: { latitude: 10.30801, longitude: 123.89159 },
  },
  {
    category: 'hospital',
    name: 'Cebu Doctors’ University Hospital',
    area: 'Osmeña Blvd',
    location: { latitude: 10.31446, longitude: 123.89203 },
  },
  {
    category: 'hospital',
    name: 'Chong Hua Hospital',
    area: 'Fuente Osmeña',
    location: { latitude: 10.30983, longitude: 123.89095 },
  },
  {
    category: 'hospital',
    name: 'Perpetual Succour Hospital',
    area: 'Gorordo Ave',
    location: { latitude: 10.31512, longitude: 123.89982 },
  },
];
