import { MapPointsContext } from '@/context/map-context';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import useNewTripGuard from '@/lib/tripTracking/useNewTripGuard';

export type SavedTripPoints = {
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  /** The jeeps it was saved with (codes, riding order); that option is selected when found. */
  jeepCodes?: string[] | null;
};

/**
 * Opens a saved route on the trip map: starts clean (no route from the Routes tab or earlier
 * results left over), sets both points and the saved jeeps, which tells the map to search once
 * as it opens (MapScreen). The result riding the saved jeeps is then selected (SelectorContent).
 */
export default function useOpenSavedRoute() {
  const router = useRouter();
  const guard = useNewTripGuard();
  const { setPointA, setPointB, setPreferredCodes, resetTrip } = useContext(MapPointsContext);

  const open = (route: SavedTripPoints) => {
    resetTrip();
    // Never null here: an empty list still marks this as a saved route (search, nothing to select)
    setPreferredCodes(route.jeepCodes ?? []);
    if (route.startLat != null && route.startLng != null) {
      setPointA({ latitude: route.startLat, longitude: route.startLng });
    }
    if (route.endLat != null && route.endLng != null) {
      setPointB({ latitude: route.endLat, longitude: route.endLng });
    }
    router.push('/trip');
  };
  return (route: SavedTripPoints) => guard(() => open(route));
}
