import { LatLng, TripOption } from '@/types/GeoTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

/** Whether the currently selected calculated route is already saved; re-checked when it changes. */
export function useSavedRouteStatus(
  results: TripOption[],
  selectedRouteIndex: number | null,
  pointA: LatLng | null,
  pointB: LatLng | null,
) {
  const [isRouteSaved, setIsRouteSaved] = useState(false);

  useEffect(() => {
    const checkIfRouteSaved = async () => {
      if (selectedRouteIndex !== null && results && results[selectedRouteIndex]) {
        const route = results[selectedRouteIndex];
        const routeKey = `${route.routeId}_${pointA?.latitude}_${pointA?.longitude}_${pointB?.latitude}_${pointB?.longitude}`;

        try {
          const existingSaved = await AsyncStorage.getItem('savedRoutes');
          const savedList = existingSaved ? JSON.parse(existingSaved) : [];
          setIsRouteSaved(savedList.includes(routeKey));
        } catch (error) {
          console.error('Error checking saved status:', error);
        }
      }
    };

    checkIfRouteSaved();
  }, [selectedRouteIndex, results, pointA, pointB]);

  return { isRouteSaved, setIsRouteSaved };
}
