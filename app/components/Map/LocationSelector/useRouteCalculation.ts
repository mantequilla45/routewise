import calculatePossibleRoutes from '@/services/routes/calculatePossibleRoutes';
import { MapPointsContext } from '@/context/map-context';
import { useCallback, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { LatLng } from '@/types/GeoTypes';
import { buildPolylines } from './buildPolylines';

/**
 * Runs the A→B route calculation and stores the ranked results and their polylines in the map
 * context. `onCalculate(from, to)` takes the points explicitly so a caller can search right
 * after setting a point, before context state has updated. A saved trip's jeeps
 * (`preferredCodes`) go along, so that trip is among the results.
 */
export default function useRouteCalculation() {
  const {
    pointA,
    pointB,
    setRoutes,
    setAllRoutes,
    setResults,
    setSelectedRouteIndex,
    setSelectedRouteInfo,
    preferredCodes,
  } = useContext(MapPointsContext);
  const [isCalculating, setIsCalculating] = useState(false);

  const onCalculate = useCallback(
    async (from: LatLng | null = pointA, to: LatLng | null = pointB) => {
      try {
        if (!from || !to) {
          console.warn('Both points must be set');
          return;
        }

        // Clear existing results first
        setResults([]);
        setRoutes([]);
        setAllRoutes([]);
        setSelectedRouteIndex(null);
        setSelectedRouteInfo(null);

        setIsCalculating(true);
        const routes = await calculatePossibleRoutes(from, to, preferredCodes ?? undefined);

        if (Array.isArray(routes) && routes.length > 0) {
          // The backend returns results already ranked.
          setResults(routes);

          // Build polylines for ALL routes to maintain consistent indexing
          setAllRoutes(buildPolylines(routes));

          // Don't display any route initially - wait for user selection
          setRoutes([]);
          setSelectedRouteIndex(null);
          setSelectedRouteInfo(null);
        } else if (routes && 'error' in routes) {
          console.warn('Server error:', routes.error);
          Alert.alert('Route Not Available', routes.error, [{ text: 'OK', style: 'default' }]);
          setRoutes([]);
          setSelectedRouteIndex(null);
        } else {
          console.warn('No routes returned');
          Alert.alert('No Routes Found', 'No jeepney routes available between these locations.', [
            { text: 'OK', style: 'default' },
          ]);
        }
      } catch (error) {
        console.error('Error calculating routes:', error);
        Alert.alert(
          'Connection Error',
          'Unable to calculate routes. Please check your connection and try again.',
          [{ text: 'OK', style: 'default' }],
        );
      } finally {
        setIsCalculating(false);
      }
    },
    [
      pointA,
      pointB,
      setResults,
      setRoutes,
      setAllRoutes,
      setSelectedRouteIndex,
      setSelectedRouteInfo,
      preferredCodes,
    ],
  );

  return { isCalculating, onCalculate };
}
