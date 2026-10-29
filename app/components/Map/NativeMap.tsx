import { MapPointsContext } from '@/context/map-context';
import { LatLng } from '@/types/GeoTypes';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import {
  type ComponentProps,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { Platform, StyleSheet, Text, Vibration } from 'react-native';

type CameraMoveEvent = Parameters<
  NonNullable<ComponentProps<typeof GoogleMaps.View>['onCameraMove']>
>[0];

export interface NativeMapRef {
  getCurrentCenter: () => Promise<LatLng | null>;
  setLocationAtCenter: () => void;
}

const NativeMap = forwardRef<NativeMapRef>(function NativeMap(_props, ref) {
  const {
    pointA,
    pointB,
    setPointA,
    setPointB,
    isPointAB,
    isPinPlacementEnabled,
    setIsPinPlacementEnabled,
    routes,
  } = useContext(MapPointsContext);
  const [lastSelectedPoint, setLastSelectedPoint] = useState<'A' | 'B' | null>(null);
  const [currentCenter, setCurrentCenter] = useState<LatLng>({
    latitude: 10.3157,
    longitude: 123.8854,
  });

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
  const handleCameraChange = (event: CameraMoveEvent) => {
    const { latitude, longitude } = event.coordinates ?? {};
    if (latitude != null && longitude != null) {
      setCurrentCenter({
        latitude,
        longitude,
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

      // Just set the point without snapping - we'll snap when calculating routes
      if (isPointAB) {
        setPointA(currentCenter);
        setLastSelectedPoint('A');
      } else {
        setPointB(currentCenter);
        setLastSelectedPoint('B');
      }

      // Disable pin placement after selecting a location
      setIsPinPlacementEnabled(false);
    },
  }));

  const markers: GoogleMaps.Marker[] = [];

  if (pointA) {
    markers.push({
      coordinates: pointA,
      title: 'Starting Point',
      snippet: 'Your journey begins here',
    });
  }

  if (pointB) {
    markers.push({
      coordinates: pointB,
      title: 'Destination',
      snippet: 'Your journey ends here',
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
    if (routes && routes.length > 0) {
    }
  }, [routes]);

  if (Platform.OS === 'android') {
    return (
      <GoogleMaps.View
        style={styles.map}
        cameraPosition={commonCamera}
        uiSettings={commonUISettings}
        mapOptions={{
          mapId: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ID,
        }}
        properties={{
          isMyLocationEnabled: false, // Requires location permissions
          isTrafficEnabled: false,
        }}
        onCameraMove={handleCameraChange}
        markers={markers}
        polylines={routes.length > 0 ? routes : []}
      />
    );
  } else if (Platform.OS === 'ios') {
    return (
      <AppleMaps.View
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
  map: { flex: 1 },
});

export default NativeMap;
