import { MapPointsContext } from '@/context/map-context';
import { useActiveTrip } from '@/lib/tripTracking/tracker';
import { fitCamera } from '@/lib/util/fitCamera';
import { colors } from '@/theme';
import { LatLng } from '@/types/GeoTypes';
import { tripStops, walkLines } from './tripOverlays';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import {
  type ComponentProps,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Dimensions, Platform, StyleSheet, Text, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CameraMoveEvent = Parameters<
  NonNullable<ComponentProps<typeof GoogleMaps.View>['onCameraMove']>
>[0];

export interface NativeMapRef {
  getCurrentCenter: () => Promise<LatLng | null>;
  setLocationAtCenter: () => void;
  /** Animate the camera to a point, e.g. the user's current location. */
  moveTo: (point: LatLng) => void;
  /** Zoom and pan so every point is visible, clear of the route bar and bottom controls. */
  fitTo: (points: LatLng[]) => void;
}

// Room kept free around a fitted route, below the top safe area: the back button and route bar
// on top (two rows when the pills wrap), the swipe-up bar at the bottom.
const FIT_PADDING = { top: 120, bottom: 110, left: 32, right: 32 };

// Street-level zoom for focusing on a single point.
const FOCUS_ZOOM = 16;

// Landmarks stay visible for orientation, but tapping them must not open Apple's place card:
// taps on the map are for placing trip pins. While a trip is tracked, the rider's location dot
// shows too. Stable objects, so re-renders don't reconfigure the map.
const APPLE_MAP_PROPERTIES = { selectionEnabled: false };
const APPLE_MAP_PROPERTIES_TRACKING = { selectionEnabled: false, isMyLocationEnabled: true };

// Default camera: Cebu City. A stable object, so re-renders never reset the camera.
const INITIAL_CAMERA = {
  coordinates: { latitude: 10.3157, longitude: 123.8854 },
  zoom: 14,
};

type NativeMapProps = {
  /** Tap on the map itself (not a marker or landmark). */
  onMapPress?: () => void;
};

const NativeMap = forwardRef<NativeMapRef, NativeMapProps>(function NativeMap({ onMapPress }, ref) {
  const googleMapRef = useRef<GoogleMaps.MapView>(null);
  const appleMapRef = useRef<AppleMaps.MapView>(null);
  const {
    pointA,
    pointB,
    setPointA,
    setPointB,
    isPointAB,
    isPinPlacementEnabled,
    setIsPinPlacementEnabled,
    results,
    selectedRouteIndex,
    isRouteFromList,
    routes,
  } = useContext(MapPointsContext);
  const isTracking = useActiveTrip() !== null;
  const insets = useSafeAreaInsets();
  const [lastSelectedPoint, setLastSelectedPoint] = useState<'A' | 'B' | null>(null);
  const [currentCenter, setCurrentCenter] = useState<LatLng>({
    latitude: 10.3157,
    longitude: 123.8854,
  });

  // Camera that shows every point clear of the route bar and bottom controls
  const cameraToFit = (points: LatLng[]) => {
    const { width, height } = Dimensions.get('window');
    return fitCamera(points, width, height, {
      ...FIT_PADDING,
      top: insets.top + FIT_PADDING.top,
    });
  };

  // Routes already chosen before the map opens (e.g. from the Routes tab) start framed: a camera
  // move sent while the native map is still loading is dropped.
  const [initialCamera] = useState(
    () =>
      cameraToFit(
        routes
          .flatMap((r) => r.coordinates ?? [])
          .flatMap(({ latitude, longitude }) =>
            latitude != null && longitude != null ? [{ latitude, longitude }] : [],
          ),
      ) ?? INITIAL_CAMERA,
  );

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

  const moveCamera = (camera: { coordinates: LatLng; zoom: number }) => {
    const move =
      Platform.OS === 'android'
        ? googleMapRef.current?.setCameraPosition({ ...camera, duration: 600 })
        : appleMapRef.current?.setCameraPosition(camera);
    // An interrupted animation rejects (e.g. the user drags the map); nothing to recover.
    move?.catch(() => {});
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getCurrentCenter: async () => {
      return currentCenter;
    },
    moveTo: (point: LatLng) => {
      moveCamera({ coordinates: point, zoom: FOCUS_ZOOM });
    },
    fitTo: (points: LatLng[]) => {
      const camera = cameraToFit(points);
      if (camera) moveCamera(camera);
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

  // The trip being shown (a calculated result, not a route opened from the Routes tab)
  const shownTrip =
    !isRouteFromList && routes.length > 0 && selectedRouteIndex !== null
      ? results[selectedRouteIndex]
      : undefined;
  const stops = shownTrip ? tripStops(shownTrip) : [];
  const polylines = shownTrip ? [...routes, ...walkLines(shownTrip, pointA, pointB)] : routes;

  const googleMarkers: GoogleMaps.Marker[] = [
    ...(pointA ? [{ id: 'start', coordinates: pointA, title: 'Start' }] : []),
    ...(pointB ? [{ id: 'destination', coordinates: pointB, title: 'Destination' }] : []),
    ...stops.map((stop) => ({ id: stop.id, coordinates: stop.coordinates, title: stop.title })),
  ];

  // Apple Maps can show an SF Symbol in each marker: a bus where you board, a walker where you
  // get off to transfer.
  const appleMarkers: AppleMaps.Marker[] = [
    ...(pointA
      ? [{ id: 'start', coordinates: pointA, title: 'Start', tintColor: colors.origin }]
      : []),
    ...(pointB
      ? [
          {
            id: 'destination',
            coordinates: pointB,
            title: 'Destination',
            tintColor: colors.destination,
          },
        ]
      : []),
    ...stops.map((stop) => ({
      id: stop.id,
      coordinates: stop.coordinates,
      title: stop.title,
      systemImage: stop.kind === 'board' ? 'bus.fill' : 'figure.walk',
      tintColor: stop.kind === 'board' ? colors.text : colors.textSecondary,
    })),
  ];

  const commonUISettings = {
    mapToolbarEnabled: false,
    zoomControlsEnabled: false,
    compassEnabled: true,
  };

  if (Platform.OS === 'android') {
    return (
      <GoogleMaps.View
        ref={googleMapRef}
        style={styles.map}
        cameraPosition={initialCamera}
        uiSettings={commonUISettings}
        mapOptions={{
          mapId: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ID,
        }}
        properties={{
          isMyLocationEnabled: isTracking, // Rider's dot while a trip is tracked
          isTrafficEnabled: false,
        }}
        onCameraMove={handleCameraChange}
        onMapClick={() => onMapPress?.()}
        markers={googleMarkers}
        polylines={polylines}
      />
    );
  } else if (Platform.OS === 'ios') {
    return (
      <AppleMaps.View
        ref={appleMapRef}
        style={styles.map}
        properties={isTracking ? APPLE_MAP_PROPERTIES_TRACKING : APPLE_MAP_PROPERTIES}
        // The route bar spans the top of the screen where this button sits
        uiSettings={{ myLocationButtonEnabled: routes.length === 0 }}
        cameraPosition={initialCamera}
        onCameraMove={handleCameraChange}
        onMapClick={() => onMapPress?.()}
        markers={appleMarkers}
        polylines={polylines}
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
