import { useAuth } from '@/context/auth';
import { MapPointsContext } from '@/context/map-context';
import { api } from '@/lib/api';
import { MappedGeoRouteResult } from '@/types/GeoTypes';
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';

type Props = {
  route: MappedGeoRouteResult;
  isRouteSaved: boolean;
  onSaved: () => void;
};

/** Bookmark icon that saves the selected calculated route for the signed-in user. */
export default function SaveRouteButton({ route, isRouteSaved, onSaved }: Props) {
  const { user } = useAuth();
  const { pointA, pointB } = useContext(MapPointsContext);

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

      const jeepneyCodes = route.isTransfer
        ? [route.firstRoute?.routeCode, route.secondRoute?.routeCode].filter(
            (c): c is string => !!c,
          )
        : [route.routeCode].filter((c): c is string => !!c);

      const routeData = {
        route_name: jeepneyCodes.join(' → '),
        start_location: `Pin A`, // You can geocode these later
        end_location: `Pin B`,
        start_lat: pointA?.latitude,
        start_lng: pointA?.longitude,
        end_lat: pointB?.latitude,
        end_lng: pointB?.longitude,
        jeepney_codes: jeepneyCodes,
        total_fare: route.fare || route.totalFare,
        transfer_points: route.isTransfer
          ? {
              transferPoint: route.transferPoint,
              firstRoute: route.firstRoute,
              secondRoute: route.secondRoute,
            }
          : null,
      };

      await api.savedRoutes.create(routeData);
      onSaved();
      Alert.alert('Success', 'Route saved successfully!');
    } catch (error) {
      console.error('Error saving route:', error);
      Alert.alert('Error', 'Failed to save route');
    }
  };

  return (
    <TouchableOpacity onPress={handleSave} style={styles.button}>
      <Ionicons
        name={isRouteSaved ? 'bookmark' : 'bookmark-outline'}
        size={24}
        color={isRouteSaved ? '#FF6B6B' : '#666'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    marginLeft: 10,
  },
});
