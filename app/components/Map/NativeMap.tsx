import { MapPointsContext } from '@/context/map-context';
import { LatLng } from '@/types/GeoTypes';
import { AppleMaps, Coordinates, GoogleMaps } from 'expo-maps';
import { GoogleMapsMarker } from 'expo-maps/build/google/GoogleMaps.types';
import { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, Vibration } from 'react-native';

export interface NativeMapRef {
  getCurrentCenter: () => Promise<LatLng | null>;
  setLocationAtCenter: () => void;
}

const NativeMap = forwardRef<NativeMapRef>((props, ref) => {
  const { pointA, pointB, setPointA, setPointB, isPointAB, isPinPlacementEnabled, setIsPinPlacementEnabled, routes } = useContext(MapPointsContext);
  const [lastSelectedPoint, setLastSelectedPoint] = useState<'A' | 'B' | null>(null);
  const [currentCenter, setCurrentCenter] = useState<LatLng>({ latitude: 10.3157, longitude: 123.8854 });
  const mapRef = useRef<any>(null);

  // Provide haptic feedback when a pin is placed
  useEffect(() => {
    if (lastSelectedPoint) {
      // Small vibration to confirm pin placement
      if (Platform.OS !== 'web') {
        Vibration.vibrate(50);
      }
      setLastSelectedPoint(null);
    }
  }, [lastSelectedPoint]);

  // Update center when camera moves
  const handleCameraChange = (event: any) => {
    if (event.coordinates) {
      setCurrentCenter({
        latitude: event.coordinates.latitude,
        longitude: event.coordinates.longitude
      });
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getCurrentCenter: async () => {
      return currentCenter;
    },
    setLocationAtCenter: () => {
      if (!isPinPlacementEnabled) return;

      console.log('Setting location at center:', currentCenter);

      // Set the point at the current center (crosshair position)
      if (isPointAB) {
        setPointA(currentCenter);
        setLastSelectedPoint('A');
        console.log('Set point A at crosshair:', currentCenter);
      } else {
        setPointB(currentCenter);
        setLastSelectedPoint('B');
        console.log('Set point B at crosshair:', currentCenter);
      }

      // Disable pin placement after selecting a location
      setIsPinPlacementEnabled(false);
    }
  }));

  const markers: GoogleMapsMarker[] = [];

  if (pointA) {
    markers.push({
      coordinates: pointA,
      title: 'Starting Point',
      snippet: 'Your journey begins here',
      pinColor: '#4CAF50' // Green for start
    });
  }

  if (pointB) {
    markers.push({
      coordinates: pointB,
      title: 'Destination',
      snippet: 'Your journey ends here',
      pinColor: '#F44336' // Red for destination
    });
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

  // Debug routes
  useEffect(() => {
    console.log('NativeMap routes update:', routes?.length ?? 0, 'polylines');
    if (routes && routes.length > 0) {
      console.log('First route:', routes[0]);
    }
  }, [routes]);

  if (Platform.OS === 'android') {
    return (
      <GoogleMaps.View
        ref={mapRef}
        style={styles.map}
        cameraPosition={commonCamera}
        uiSettings={commonUISettings}
        onCameraMove={handleCameraChange}
        markers={markers}
        polylines={routes.length > 0 ? routes : []}
      />
    );
  } else if (Platform.OS === 'ios') {
    return (
      <AppleMaps.View
        ref={mapRef}
        style={styles.map}
        cameraPosition={commonCamera}
        onCameraMove={handleCameraChange}
        markers={markers}
        polylines={routes.length > 0 ? routes : []}
      />
    );
  } else {
    return <Text>Maps are only available on Android and iOS</Text>;
  }
});

const styles = StyleSheet.create({
  map: { flex: 1, },
});

export default NativeMap;