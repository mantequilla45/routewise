import { latLongStringifier } from '@/lib/util/latLngStringifier';
import { LatLng } from '@/types/GeoTypes';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export type PlaceLabel = { title: string; subtitle?: string };

// Reverse geocoding is rate-limited by the OS; remember answers for points seen this session.
const cache = new Map<string, PlaceLabel>();
const keyFor = (p: LatLng) => `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`;

function toLabel(address: Location.LocationGeocodedAddress | undefined, point: LatLng): PlaceLabel {
  const street = [address?.streetNumber, address?.street].filter(Boolean).join(' ');
  // Apple returns a place or street in `name`; prefer it unless it's just the street again
  const title = address?.name || street || address?.district || address?.city;
  const subtitle = [address?.district, address?.city]
    .filter((part) => part && part !== title)
    .join(', ');
  return title
    ? { title, subtitle: subtitle || undefined }
    : { title: 'Pinned location', subtitle: latLongStringifier(point) };
}

async function lookUp(point: LatLng): Promise<PlaceLabel> {
  // Android's geocoder needs location permission; don't prompt just to label a pin
  if (Platform.OS === 'android') {
    const { granted } = await Location.getForegroundPermissionsAsync();
    if (!granted) return { title: 'Pinned location', subtitle: latLongStringifier(point) };
  }
  const [address] = await Location.reverseGeocodeAsync(point);
  return toLabel(address, point);
}

/**
 * A human label for a trip point: `knownName` when the point came from search or GPS,
 * otherwise the street/place from reverse geocoding (coordinates while it loads or on failure).
 */
export default function usePlaceLabel(point: LatLng | null, knownName?: string): PlaceLabel | null {
  const key = point ? keyFor(point) : null;
  const [resolved, setResolved] = useState<{ key: string; label: PlaceLabel } | null>(null);

  useEffect(() => {
    if (!point || !key || knownName || cache.has(key)) return;
    let ignore = false;
    lookUp(point)
      .catch((): PlaceLabel => ({ title: 'Pinned location', subtitle: latLongStringifier(point) }))
      .then((label) => {
        cache.set(key, label);
        if (!ignore) setResolved({ key, label });
      });
    return () => {
      ignore = true;
    };
  }, [point, key, knownName]);

  if (!point || !key) return null;
  if (knownName) return { title: knownName };
  const cached = cache.get(key) ?? (resolved?.key === key ? resolved.label : undefined);
  return cached ?? { title: 'Finding address…', subtitle: latLongStringifier(point) };
}
