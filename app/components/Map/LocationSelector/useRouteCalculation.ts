import calculatePossibleRoutes from '@/app/services/routes/calculatePossibleRoutes';
import { MapPointsContext } from '@/context/map-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { buildPolylines, sortRoutesByDistance } from './buildPolylines';

/**
 * Runs the A→B route calculation, stores sorted results and their polylines in the map
 * context, and auto-triggers a calculation when the `shouldCalculateRoute` AsyncStorage flag
 * is set (used by the saved-routes screen).
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
  } = useContext(MapPointsContext);
  const [isCalculating, setIsCalculating] = useState(false);

  const onCalculate = useCallback(async () => {
    try {
      if (!pointA || !pointB) {
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
      const routes = await calculatePossibleRoutes(pointA, pointB);

      if (Array.isArray(routes) && routes.length > 0) {
        const sortedRoutes = sortRoutesByDistance(routes);
        setResults(sortedRoutes);

        // Build polylines for ALL routes to maintain consistent indexing
        setAllRoutes(buildPolylines(sortedRoutes));

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
  }, [
    pointA,
    pointB,
    setResults,
    setRoutes,
    setAllRoutes,
    setSelectedRouteIndex,
    setSelectedRouteInfo,
  ]);

  // Check if we should auto-calculate (from saved route)
  const checkForAutoCalculate = useCallback(async () => {
    try {
      const shouldCalculate = await AsyncStorage.getItem('shouldCalculateRoute');

      if (shouldCalculate === 'true' && pointA && pointB) {
        await AsyncStorage.removeItem('shouldCalculateRoute'); // Clear flag
        setTimeout(() => {
          onCalculate(); // Trigger calculation
        }, 500); // Small delay to ensure UI is ready
      }
    } catch (error) {
      console.error('Error checking auto-calculate:', error);
    }
  }, [pointA, pointB, onCalculate]);

  // Check on mount
  useEffect(() => {
    checkForAutoCalculate();
  }, [checkForAutoCalculate]);

  // Check if we should auto-calculate when points change
  useEffect(() => {
    if (pointA && pointB) {
      checkForAutoCalculate();
    }
  }, [pointA, pointB, checkForAutoCalculate]);

  return { isCalculating, onCalculate };
}
