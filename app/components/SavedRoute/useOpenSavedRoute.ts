import { MapPointsContext } from '@/context/map-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useContext } from 'react';

export type SavedTripPoints = {
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
};

/**
 * Opens a saved route on the trip map: sets both points, clears old results, and flags the
 * map to search as soon as it mounts (see useRouteCalculation).
 */
export default function useOpenSavedRoute() {
  const router = useRouter();
  const { setPointA, setPointB, setResults, setRoutes } = useContext(MapPointsContext);

  return async (route: SavedTripPoints) => {
    setResults([]);
    setRoutes([]);
    if (route.startLat != null && route.startLng != null) {
      setPointA({ latitude: route.startLat, longitude: route.startLng });
    }
    if (route.endLat != null && route.endLng != null) {
      setPointB({ latitude: route.endLat, longitude: route.endLng });
    }
    await AsyncStorage.setItem('shouldCalculateRoute', 'true');
    router.push('/trip');
  };
}
