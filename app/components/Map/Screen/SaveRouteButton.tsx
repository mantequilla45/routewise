import { useSavedRouteStatus } from '@/components/Map/Screen/useSavedRouteStatus';
import { useAuth } from '@/context/auth';
import { MapPointsContext } from '@/context/map-context';
import { api } from '@/lib/api';
import { colors, elevation, radius } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

/**
 * Floating bookmark over the map that saves the selected calculated trip for the signed-in
 * user. Renders nothing unless a calculated trip (not a Routes-tab route) is shown.
 */
export default function SaveRouteButton() {
  const { user } = useAuth();
  const { pointA, pointB, results, selectedRouteIndex, isRouteFromList } =
    useContext(MapPointsContext);
  const { isRouteSaved, setIsRouteSaved } = useSavedRouteStatus(
    results,
    selectedRouteIndex,
    pointA,
    pointB,
  );
  const route =
    !isRouteFromList && selectedRouteIndex !== null ? results[selectedRouteIndex] : undefined;
  if (!route) return null;

  const handleSave = async () => {
    if (!route) return;

    try {
      if (!user) {
        Alert.alert('Error', 'Please login to save routes');
        return;
      }

      if (isRouteSaved) {
        Alert.alert('Info', 'Route unsaving not implemented yet');
        return;
      }

      const jeepneyCodes = route.legs.map((leg) => leg.routeCode);

      const routeData = {
        route_name: jeepneyCodes.join(' → '),
        start_location: `Pin A`, // You can geocode these later
        end_location: `Pin B`,
        start_lat: pointA?.latitude,
        start_lng: pointA?.longitude,
        end_lat: pointB?.latitude,
        end_lng: pointB?.longitude,
        jeepney_codes: jeepneyCodes,
        total_fare: route.fare,
        transfer_points: route.isTransfer
          ? {
              transferPoint: route.transferPoint,
              firstRoute: route.firstRoute,
              secondRoute: route.secondRoute,
            }
          : null,
      };

      await api.savedRoutes.create(routeData);
      setIsRouteSaved(true);
      Alert.alert('Success', 'Route saved successfully!');
    } catch (error) {
      console.error('Error saving route:', error);
      Alert.alert('Error', 'Failed to save route');
    }
  };

  return (
    <Pressable
      onPress={handleSave}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isRouteSaved ? 'Saved' : 'Save route'}
    >
      <Ionicons
        name={isRouteSaved ? 'bookmark' : 'bookmark-outline'}
        size={20}
        color={colors.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Same 44pt floating circle as the recenter button below it
  button: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.floating,
  },
  buttonPressed: {
    backgroundColor: colors.surface,
  },
});
