import { MapPointsContext } from '@/context/map-context';
import { LatLng } from '@/types/GeoTypes';
import { AppleMaps, Coordinates, GoogleMaps } from 'expo-maps';
import { GoogleMapsMarker } from 'expo-maps/build/google/GoogleMaps.types';
import { useContext } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';

export default function NativeMap() {

  const { pointA, pointB, setPointA, setPointB, isPointAB, isPinPlacementEnabled, routes } = useContext(MapPointsContext);

  const handleMapPress = (event: { coordinates: Coordinates }) => {
    console.log(isPinPlacementEnabled)
    if (!isPinPlacementEnabled) return;

    const { coordinates } = event;

    if (coordinates.latitude == null || coordinates.longitude == null) return;

    const point: LatLng = {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    };

    if (isPointAB) {
      setPointA(point);
    } else {
      setPointB(point);
    }
  };

  const markers: GoogleMapsMarker[] = [];

  if (pointA) {
    markers.push({ coordinates: pointA, title: 'Point A' });
  }

  if (pointB) {
    markers.push({ coordinates: pointB, title: 'Point B' });
  }

  const commonCamera = {
    coordinates: { latitude: 10.3157, longitude: 123.8854 },
    zoom: 14,
  };

  const commonUISettings = {
    mapToolbarEnabled: false,
    zoomControlsEnabled: false,
    compassEnabled: true,
  };

  if (Platform.OS === 'android') {
    return (

      <GoogleMaps.View
        style={styles.map}
        cameraPosition={commonCamera}
        uiSettings={commonUISettings}
        onMapClick={handleMapPress}
        markers={markers}
        polylines={routes ?? undefined}
      />
    );
  } else if (Platform.OS === 'ios') {
    return (
      <AppleMaps.View
        style={styles.map}
        cameraPosition={commonCamera}
        onMapClick={handleMapPress}
        markers={markers}
        polylines={routes ?? undefined}
      />
    );
  } else {
    return <Text>Maps are only available on Android and iOS</Text>;
  }
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});

