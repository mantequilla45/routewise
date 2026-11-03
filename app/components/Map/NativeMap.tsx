import { useAuth } from '@/context/auth';
import { MapPointsContext } from '@/context/map-context';
import { journeyCamera } from '@/lib/tripTracking/camera';
import { metersBetween } from '@/lib/tripTracking/progress';
import { useActiveTrip } from '@/lib/tripTracking/tracker';
import { fitCamera } from '@/lib/util/fitCamera';
import { colors, elevation } from '@/theme';
import { LatLng } from '@/types/GeoTypes';
import { arrowsVisible, metersPerUnit, routeArrows } from './routeArrows';
import { dashed, journeyLines, tripStops, walkLines } from './tripOverlays';
import { Ionicons } from '@expo/vector-icons';
import { Image, useImage } from 'expo-image';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import {
  type ComponentProps,
  forwardRef,
  useContext,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Dimensions, Platform, StyleSheet, Text, Vibration, View } from 'react-native';
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

// Street-level zoom while following the rider.
const FOLLOW_ZOOM = 16.5;
// Camera moves within this long of the end of one the app made are the app's own, not the user
// panning.
const OWN_MOVE_MS = 1500;
// Following, the camera glides to each new fix at constant speed for about as long as the gap
// since the last one, a little longer so it is still moving when the next comes in (continuous,
// no stop and start).
const GLIDE_STRETCH = 1.15;
const MIN_GLIDE_MS = 300;
const MAX_GLIDE_MS = 3000;
// A followed camera that settles this far from the rider was moved by the user (a glide stopped
// partway is within one fix's travel of it)
const PANNED_AWAY_M = 60;

// Room kept free around a fitted route, below the top safe area: the back button on top, the
// bottom bar or route card (and the hint above it) at the bottom.
const FIT_PADDING = { top: 90, bottom: 170, left: 32, right: 32 };

// Street-level zoom for focusing on a single point.
const FOCUS_ZOOM = 16;

// Place names (shops, landmarks) are hidden unless `showPlaces`; streets and areas always show.
// Tapping a place must never open Apple's place card: taps on the map are for trip pins.
const APPLE_HIDE_PLACES = { including: [] };
const APPLE_SHOW_PLACES = { excluding: [] };
const GOOGLE_HIDE_PLACES = {
  json: JSON.stringify([
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  ]),
};

// Default camera: Cebu City. A stable object, so re-renders never reset the camera.
const INITIAL_CAMERA = {
  coordinates: { latitude: 10.3157, longitude: 123.8854 },
  zoom: 14,
};

type NativeMapProps = {
  /** Tap on the map itself (not a marker or landmark). */
  onMapPress?: () => void;
  /** Show shop and landmark names and icons (off by default to keep the route readable). */
  showPlaces?: boolean;
  /** The user moved the map themselves (not a camera move made by the app). */
  onUserPan?: () => void;
  /** Zoomed in far enough for the route direction arrows to show, or back out. */
  onArrowsShownChange?: (shown: boolean) => void;
  /** While tracking: keep the camera on the rider, facing the way ahead (navigation view). */
  following?: boolean;
};

const NativeMap = forwardRef<NativeMapRef, NativeMapProps>(function NativeMap(
  { onMapPress, showPlaces = false, onUserPan, onArrowsShownChange, following = false },
  ref,
) {
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
  const activeTrip = useActiveTrip();
  const { user } = useAuth();
  // Rebuilt only when a setting changes, so re-renders don't reconfigure the map. The rider is
  // a marker of our own (below), not the system location dot.
  const appleProperties = useMemo(
    () => ({
      selectionEnabled: false,
      pointsOfInterest: showPlaces ? APPLE_SHOW_PLACES : APPLE_HIDE_PLACES,
    }),
    [showPlaces],
  );
  const ownMoveEnds = useRef(0);
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

  // Zoom to the nearest half level: enough for the route arrows to keep their size on screen
  // without redrawing them on every frame of a pinch
  const [zoomLevel, setZoomLevel] = useState(initialCamera.zoom);
  const showArrows = arrowsVisible(
    zoomLevel,
    currentCenter.latitude,
    Dimensions.get('window').width,
  );
  const reportArrows = useEffectEvent((shown: boolean) => onArrowsShownChange?.(shown));
  useEffect(() => reportArrows(showArrows), [showArrows]);

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

  // Update center when camera moves; a move the app didn't make is the user panning
  const handleCameraChange = (event: CameraMoveEvent) => {
    // Following, a new glide starts before the last one ends, so timing can't tell the user's
    // moves apart: the map ending up away from where it was sent can
    const { latitude: lat, longitude: lng } = event.coordinates ?? {};
    const awayFromRider =
      following &&
      followTarget.current &&
      lat != null &&
      lng != null &&
      Date.now() - recenteredAt.current > OWN_MOVE_MS &&
      metersBetween({ latitude: lat, longitude: lng }, followTarget.current) > PANNED_AWAY_M;
    if (awayFromRider || Date.now() - ownMoveEnds.current > OWN_MOVE_MS) onUserPan?.();
    // Following, and the camera has reached the rider: from now the rider is drawn at the middle
    if (
      following &&
      !cameraOnRider &&
      followTarget.current &&
      lat != null &&
      lng != null &&
      metersBetween({ latitude: lat, longitude: lng }, followTarget.current) <= PANNED_AWAY_M
    ) {
      setCameraOnRider(true);
    }
    if (event.zoom != null) setZoomLevel(Math.round(event.zoom * 2) / 2);
    const { latitude, longitude } = event.coordinates ?? {};
    if (latitude != null && longitude != null) {
      setCurrentCenter({
        latitude,
        longitude,
      });
    }
  };

  // `duration` (ms) for a constant-speed glide; without it, the map's own short animation
  const moveCamera = (camera: {
    coordinates: LatLng;
    zoom: number;
    bearing?: number;
    duration?: number;
  }) => {
    ownMoveEnds.current = Date.now() + (camera.duration ?? 0);
    const move =
      Platform.OS === 'android'
        ? googleMapRef.current?.setCameraPosition({ duration: 600, ...camera })
        : appleMapRef.current?.setCameraPosition(camera);
    // An interrupted animation rejects (e.g. the user drags the map); nothing to recover.
    move?.catch(() => {});
  };

  // Following: the camera glides natively from fix to fix (one move per fix, no per-frame work),
  // with the rider drawn at the middle of the map so it moves exactly with it. The first fix, and
  // turning following back on, take the map's own short animation.
  const lastFixAt = useRef(0);
  // Where the camera was last sent while following, and when following last (re)started
  const followTarget = useRef<LatLng | null>(null);
  const recenteredAt = useRef(0);
  // Whether the camera has got to the rider since following (re)started: until then the rider
  // stays a map marker, so it doesn't jump to the middle ahead of the camera
  const [cameraOnRider, setCameraOnRider] = useState(false);
  const [wasFollowing, setWasFollowing] = useState(following);
  if (following !== wasFollowing) {
    setWasFollowing(following);
    setCameraOnRider(false);
  }
  const followRider = useEffectEvent((glide: boolean) => {
    const camera = activeTrip && journeyCamera(activeTrip);
    const now = Date.now();
    const gap = lastFixAt.current ? now - lastFixAt.current : 0;
    lastFixAt.current = now;
    if (!following || !camera) return;
    followTarget.current = camera.center;
    if (!glide) recenteredAt.current = now;
    const duration =
      glide && gap
        ? Math.min(MAX_GLIDE_MS, Math.max(MIN_GLIDE_MS, gap * GLIDE_STRETCH))
        : undefined;
    moveCamera({
      coordinates: camera.center,
      zoom: FOLLOW_ZOOM,
      bearing: camera.bearing,
      duration,
    });
  });
  const riderPosition = activeTrip?.position;
  useEffect(() => {
    if (riderPosition) followRider(true);
  }, [riderPosition]);
  useEffect(() => {
    if (following) followRider(false);
  }, [following]);

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
  // While tracking, the tracked trip is drawn instead, with the covered part as a faint trail.
  // Built only when the trip, its progress, the routes or the zoom change: not on every frame
  // of the rider gliding between fixes, which would make the map redraw every line each frame.
  const latitudeBand = Math.round(currentCenter.latitude * 10) / 10; // the dash size barely moves
  const { stops, polylines } = useMemo(() => {
    const stops = activeTrip ? tripStops(activeTrip.trip) : shownTrip ? tripStops(shownTrip) : [];
    const jeepLines = activeTrip ? journeyLines(activeTrip.trip, activeTrip.progress) : routes;
    // Arrows on the jeep lines only, not on walks or the faint trail already covered
    const arrows = routeArrows(
      jeepLines.filter((line) => !line.id?.endsWith('-trail')),
      zoomLevel,
      Dimensions.get('window').width,
    );
    // While tracking, the walk to the first jeep starts from the rider's live position, so it
    // shrinks as they walk; once they've boarded it's behind them and isn't drawn
    const firstWalkFrom = ({ progress, position, start }: NonNullable<typeof activeTrip>) =>
      progress.legIndex > 0 || progress.boarded[0] ? null : (position ?? start ?? pointA);
    // Walks dashed, sized for the current zoom
    const unit = metersPerUnit(zoomLevel, latitudeBand, Dimensions.get('window').width);
    const polylines = activeTrip
      ? [
          ...jeepLines,
          ...dashed(
            walkLines(activeTrip.trip, firstWalkFrom(activeTrip), activeTrip.destination),
            unit,
          ),
          ...arrows,
        ]
      : shownTrip
        ? [...routes, ...dashed(walkLines(shownTrip, pointA, pointB), unit), ...arrows]
        : [...routes, ...arrows];
    return { stops, polylines };
  }, [activeTrip, shownTrip, routes, zoomLevel, latitudeBand, pointA, pointB]);
  // The rider: their profile photo as a round avatar when signed in with one, else a bus while
  // riding and a walker otherwise
  // Following, it's drawn over the map at its middle instead (below)
  const riderAtCenter = following && cameraOnRider && !!activeTrip?.position;
  const rider = activeTrip && !riderAtCenter ? activeTrip.position : undefined;
  const isRiding = activeTrip?.progress.remaining != null;
  // Decoded small (a 40pt circle at 3x); no photo, or one that fails, keeps the fallback marker
  const avatar = useImage(
    { uri: user?.picture ?? '' },
    { maxWidth: 120, maxHeight: 120, onError: () => {} },
    [user?.picture],
  );
  const riderAvatar = rider && avatar ? { id: 'rider', coordinates: rider, icon: avatar } : null;

  const googleMarkers: GoogleMaps.Marker[] = [
    ...(pointA ? [{ id: 'start', coordinates: pointA, title: 'Start' }] : []),
    ...(pointB ? [{ id: 'destination', coordinates: pointB, title: 'Destination' }] : []),
    ...stops.map((stop) => ({ id: stop.id, coordinates: stop.coordinates, title: stop.title })),
    ...(rider
      ? [
          {
            id: 'rider',
            coordinates: rider,
            title: isRiding ? 'Riding' : 'You',
            ...(avatar && { icon: avatar }),
          },
        ]
      : []),
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
    ...(rider && !riderAvatar
      ? [
          {
            id: 'rider',
            coordinates: rider,
            title: isRiding ? 'Riding' : 'You',
            systemImage: isRiding ? 'bus.fill' : 'figure.walk',
            tintColor: colors.accent,
          },
        ]
      : []),
  ];
  // Apple draws an image only as an annotation (patched to a ringed circle); see the app README
  const appleAnnotations: AppleMaps.Annotation[] = riderAvatar ? [riderAvatar] : [];

  const commonUISettings = {
    mapToolbarEnabled: false,
    zoomControlsEnabled: false,
    compassEnabled: true,
  };

  // A finger dragging (or pinching) the map stops following straight away, before the camera
  // event at the end of the gesture
  const stopFollowingOnDrag = () => {
    if (following) onUserPan?.();
  };

  // Following: the rider at the middle of the map, where the camera keeps them. Same look as the
  // map's own marker (patched avatar circle, or a bus or walker).
  const centerRider = riderAtCenter && (
    <View style={styles.centerRider} pointerEvents="none">
      {avatar ? (
        <Image source={avatar} style={styles.riderAvatar} />
      ) : (
        <View style={styles.riderIcon}>
          <Ionicons name={isRiding ? 'bus' : 'walk'} size={20} color={colors.textOnAccent} />
        </View>
      )}
    </View>
  );

  if (Platform.OS === 'android') {
    const map = (
      <GoogleMaps.View
        ref={googleMapRef}
        style={styles.map}
        cameraPosition={initialCamera}
        uiSettings={commonUISettings}
        mapOptions={{
          mapId: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ID,
        }}
        properties={{
          isTrafficEnabled: false,
          mapStyleOptions: showPlaces ? undefined : GOOGLE_HIDE_PLACES,
        }}
        onCameraMove={handleCameraChange}
        onMapClick={() => onMapPress?.()}
        markers={googleMarkers}
        polylines={polylines}
      />
    );
    return (
      <View style={styles.map} onTouchMove={stopFollowingOnDrag}>
        {map}
        {centerRider}
      </View>
    );
  } else if (Platform.OS === 'ios') {
    const map = (
      <AppleMaps.View
        ref={appleMapRef}
        style={styles.map}
        properties={appleProperties}
        // The route bar spans the top of the screen where this button sits
        uiSettings={{ myLocationButtonEnabled: routes.length === 0 }}
        cameraPosition={initialCamera}
        onCameraMove={handleCameraChange}
        onMapClick={() => onMapPress?.()}
        markers={appleMarkers}
        annotations={appleAnnotations}
        polylines={polylines}
      />
    );
    return (
      <View style={styles.map} onTouchMove={stopFollowingOnDrag}>
        {map}
        {centerRider}
      </View>
    );
  } else {
    return <Text>Maps are only available on Android and iOS</Text>;
  }
});

const RIDER_SIZE = 40;

const styles = StyleSheet.create({
  map: { flex: 1 },
  centerRider: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -RIDER_SIZE / 2,
    marginLeft: -RIDER_SIZE / 2,
    borderRadius: RIDER_SIZE / 2,
    ...elevation.floating,
  },
  riderAvatar: {
    width: RIDER_SIZE,
    height: RIDER_SIZE,
    borderRadius: RIDER_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.background,
  },
  riderIcon: {
    width: RIDER_SIZE,
    height: RIDER_SIZE,
    borderRadius: RIDER_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.background,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NativeMap;
