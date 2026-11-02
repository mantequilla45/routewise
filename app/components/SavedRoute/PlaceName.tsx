import usePlaceLabel from '@/components/Map/LocationSelector/usePlaceLabel';
import type { StyleProp, TextStyle } from 'react-native';
import { Text } from 'react-native';

// Names stored by older versions of the app, before saving looked up real place names
const PLACEHOLDER_NAMES = new Set(['Pin A', 'Pin B']);

/**
 * The name of a saved route end: as saved, or looked up from its coordinates for an older save
 * that only stored "Pin A" / "Pin B". Null while that lookup runs.
 */
export function useSavedPlaceName(
  name: string,
  lat?: number | null,
  lng?: number | null,
): string | null {
  const needsLookup = PLACEHOLDER_NAMES.has(name) && lat != null && lng != null;
  const label = usePlaceLabel(needsLookup ? { latitude: lat, longitude: lng } : null);
  return needsLookup ? (label?.title ?? null) : name;
}

/** A saved route end's name as text (see useSavedPlaceName). */
export default function PlaceName({
  name,
  lat,
  lng,
  style,
  numberOfLines = 1,
  prefix = '',
}: Readonly<{
  name: string;
  lat?: number | null;
  lng?: number | null;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  /** Text before the name, e.g. "from ". */
  prefix?: string;
}>) {
  const resolved = useSavedPlaceName(name, lat, lng);
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {prefix}
      {resolved ?? '…'}
    </Text>
  );
}
