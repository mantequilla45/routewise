import NativeMap, { NativeMapRef } from '@/components/Map/NativeMap';
import ArrowHint from '@/components/Map/Screen/ArrowHint';
import ListRouteCard from '@/components/Map/Screen/ListRouteCard';
import useSavedTripReveal from '@/components/Map/Screen/useSavedTripReveal';
import LocationSheet from '@/components/Map/Screen/LocationSheet';
import PinPlacementOverlay from '@/components/Map/Screen/PinPlacementOverlay';
import RouteInfoHeader from '@/components/Map/Screen/RouteInfoHeader';
import SaveRouteButton from '@/components/Map/Screen/SaveRouteButton';
import SwipeUpIndicator from '@/components/Map/Screen/SwipeUpIndicator';
import TripProgressBar from '@/components/Map/Screen/TripProgressBar';
import { useModalAnimation } from '@/components/Map/Screen/useModalAnimation';
import { buildPolylines } from '@/components/Map/LocationSelector/buildPolylines';
import useRouteCalculation from '@/components/Map/LocationSelector/useRouteCalculation';
import { MapPointsContext } from '@/context/map-context';
import { journeyCamera } from '@/lib/tripTracking/camera';
import { startTrip, stopTrip, useActiveTrip } from '@/lib/tripTracking/tracker';
import { colors, elevation, radius, spacing, type } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Stack, useRouter } from 'expo-router';
import { useContext, useEffect, useEffectEvent, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Delay before opening pin placement on arrival, so the screen's push animation finishes first.
const OPEN_PICK_DELAY_MS = 400;

/**
 * The trip planner over the map. Pushed from Home (and the Routes/Saved tabs) with a back
 * button; `pick` opens pin placement straight away for that point.
 */
export default function MapScreen({
  pick,
  destinationName,
}: {
  pick?: 'start' | 'destination';
  /** Name of a destination chosen before arriving (Home search). */
  destinationName?: string;
}) {
  const router = useRouter();
  const {
    isPointAB,
    setIsPointAB,
    setIsPinPlacementEnabled,
    isRouteFromList,
    results,
    selectedRouteIndex,
    pointA,
    pointB,
    routes,
    isPinPlacementEnabled,
    setResults,
    setRoutes,
    setAllRoutes,
    setSelectedRouteIndex,
    selectedRouteInfo,
    setSelectedRouteInfo,
    preferredCodes,
    setIsRouteFromList,
    setPointA,
    setPointB,
  } = useContext(MapPointsContext);
  const activeTrip = useActiveTrip();
  // While tracking, the camera follows the rider until they pan the map; locate resumes it
  const [following, setFollowing] = useState(true);
  // Shop and landmark names on the map: off by default so the route stands out
  const [showPlaces, setShowPlaces] = useState(false);
  // Zoomed in far enough for the route's direction arrows (a hint says so until then)
  const [arrowsShown, setArrowsShown] = useState(false);
  const { isCalculating, onCalculate } = useRouteCalculation();
  const mapRef = useRef<NativeMapRef>(null);
  const insets = useSafeAreaInsets();
  // Reopening a tracked journey starts on the journey view, sheet tucked away
  const [openedOnJourney] = useState(activeTrip !== null);
  // A saved route starts with the sheet tucked away too, until its trip is found and selected
  const [openedOnSaved] = useState(preferredCodes !== null && !!pointA && !!pointB);
  const { isModalVisible, modalPosition, indicatorOpacity, showModal, hideModal, panHandlers } =
    useModalAnimation(isRouteFromList, isRouteFromList || openedOnJourney || openedOnSaved);
  // A saved route searches once, as the screen opens (its points are already set)
  const searchSavedTrip = useEffectEvent(() => {
    if (openedOnSaved && pointA && pointB) onCalculate(pointA, pointB);
  });
  useEffect(() => searchSavedTrip(), []);
  const findingSavedTrip = useSavedTripReveal({
    openedOnSaved,
    isCalculating,
    showModal: () => showModal(),
  });

  // A route opened from the Routes tab: zoom out to show all of it
  useEffect(() => {
    if (isRouteFromList && routes.length > 0) {
      const points = routes
        .flatMap((r) => r.coordinates ?? [])
        .flatMap(({ latitude, longitude }) =>
          latitude != null && longitude != null ? [{ latitude, longitude }] : [],
        );
      mapRef.current?.fitTo(points);
    }
  }, [isRouteFromList, routes]);

  // Confirm the pin, bring the sheet back on the next step, and search once both points exist.
  // The new point is passed in directly: context state hasn't updated yet at this point.
  const handleConfirmLocation = async () => {
    if (!mapRef.current) return;
    const center = await mapRef.current.getCurrentCenter();
    mapRef.current.setLocationAtCenter();
    setIsPinPlacementEnabled(false);
    showModal();

    const from = isPointAB ? center : pointA;
    const to = isPointAB ? pointB : center;
    if (from && to) onCalculate(from, to);
  };

  const handleCancelPlacement = () => {
    setIsPinPlacementEnabled(false);
    showModal();
  };

  // Enter pin placement first, then slide the sheet down, so the screen goes straight to the pin
  // and its Confirm button.
  const enterPinPlacementMode = (isPointA: boolean) => {
    setIsPointAB(isPointA);
    setIsPinPlacementEnabled(true);
    hideModal();
  };

  // Arrived via "Choose on map" from Home: go straight to placing that pin
  const [initialPick] = useState(pick);
  const startPick = useEffectEvent((isPointA: boolean) => enterPinPlacementMode(isPointA));
  useEffect(() => {
    if (!initialPick) return;
    const timer = setTimeout(() => startPick(initialPick === 'start'), OPEN_PICK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [initialPick]);

  // Tapping the map tucks the sheet away to see more of the trip. Only once there are results,
  // since "View routes" is the only way back; never while placing a pin (taps are for the map).
  const minimizeSheet = () => {
    if (isModalVisible && !isPinPlacementEnabled && results.length > 0) hideModal();
  };

  // The calculated trip shown on the map, which "Start trip" tracks
  const shownTrip =
    !isRouteFromList && routes.length > 0 && selectedRouteIndex !== null
      ? results[selectedRouteIndex]
      : undefined;

  // Reopened on a tracked journey whose trip isn't what the map shows (the app restarted, or
  // another search ran since): draw that trip again so the route row and markers match it.
  const restoreJourney = useEffectEvent(() => {
    if (!activeTrip || shownTrip?.routeId === activeTrip.trip.routeId) return;
    const { trip, start, destination } = activeTrip;
    const lines = buildPolylines([trip]);
    setResults([trip]);
    setAllRoutes(lines);
    setRoutes(lines);
    setSelectedRouteIndex(0);
    setSelectedRouteInfo({ id: trip.routeCode, name: trip.routeName });
    setIsRouteFromList(false);
    setPointA(start);
    setPointB(destination);
  });
  useEffect(() => {
    if (openedOnJourney) restoreJourney();
  }, [openedOnJourney]);

  // Follow the rider on each new position, rotated to their direction of travel
  const followNow = () => {
    const camera = activeTrip && journeyCamera(activeTrip);
    if (camera) mapRef.current?.follow(camera.center, camera.bearing);
  };
  const followRider = useEffectEvent(followNow);
  const riderPosition = activeTrip?.position;
  useEffect(() => {
    if (following && riderPosition) followRider();
  }, [following, riderPosition]);

  const handleStartTrip = async () => {
    if (!shownTrip || !pointB) return;
    const started = await startTrip(shownTrip, pointA, pointB);
    if (!started.ok) {
      Alert.alert(
        'Location is off',
        'Allow RouteWise to use your location in Settings to follow your trip.',
      );
      return;
    }
    if (!started.background) {
      Alert.alert(
        'Keep the app open',
        "You'll get the alert before your stop while RouteWise is open. To get it with your phone locked, set RouteWise's location access to Always in Settings.",
      );
    }
    setFollowing(true);
    // Until the first tracked fix arrives, go to the last known position
    const here = await Location.getLastKnownPositionAsync().catch(() => null);
    if (here) mapRef.current?.moveTo(here.coords);
  };

  const confirmEndTrip = (then?: () => void) =>
    Alert.alert('End this trip?', "You won't get an alert before your stop.", [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'End trip',
        style: 'destructive',
        onPress: () => {
          stopTrip();
          then?.();
        },
      },
    ]);

  // Zoom back out to the whole trip on the map: the drawn route plus both pins. While tracking,
  // follow the rider again instead.
  const recenter = () => {
    if (activeTrip) {
      setFollowing(true);
      followNow();
      return;
    }
    const points = routes
      .flatMap((r) => r.coordinates ?? [])
      .flatMap(({ latitude, longitude }) =>
        latitude != null && longitude != null ? [{ latitude, longitude }] : [],
      );
    if (pointA) points.push(pointA);
    if (pointB) points.push(pointB);
    mapRef.current?.fitTo(points);
  };

  // Leaving keeps a tracked trip running; Home's banner opens the journey again
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // Map buttons over the map once the sheet is tucked away: place names on/off, and with a
  // route on the map, save and recenter/locate
  const showControls = !isModalVisible && !isPinPlacementEnabled;
  // A calculated trip on the map, not yet started
  const canStart = !activeTrip && !!shownTrip && !!pointB;
  // Place names on/off; on its own in the "View routes" row when no route is on the map
  const placesButton = (
    <Pressable
      onPress={() => setShowPlaces((s) => !s)}
      style={({ pressed }) => [
        styles.roundButton,
        showPlaces && styles.buttonOn,
        pressed && styles.buttonPressed,
      ]}
      hitSlop={6}
      accessibilityRole="switch"
      accessibilityState={{ checked: showPlaces }}
      accessibilityLabel="Show places"
    >
      <Ionicons
        name={showPlaces ? 'storefront' : 'storefront-outline'}
        size={20}
        color={showPlaces ? colors.textOnDark : colors.text}
      />
    </Pressable>
  );

  // Separate round buttons, stacked: place names on/off, and with a route on the map, save and
  // recenter/locate
  const hasRoute = routes.length > 0;
  const canSave = hasRoute && !!shownTrip;
  const mapControls = (
    <View style={styles.buttonColumn} pointerEvents="box-none">
      {placesButton}
      {canSave && <SaveRouteButton />}
      {hasRoute && (
        <Pressable
          onPress={recenter}
          style={({ pressed }) => [styles.roundButton, pressed && styles.buttonPressed]}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={activeTrip ? 'Follow my location' : 'Show the whole route'}
        >
          <Ionicons
            name={activeTrip ? (following ? 'navigate' : 'locate') : 'scan-outline'}
            size={20}
            color={colors.text}
          />
        </Pressable>
      )}
    </View>
  );

  const bottomBar = (
    <SwipeUpIndicator
      opacity={indicatorOpacity}
      isModalVisible={isModalVisible}
      onPress={() => showModal()}
      onStart={canStart ? handleStartTrip : undefined}
      trailing={hasRoute ? undefined : placesButton}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* With a route or trip on the map, leave only with the back button, not a stray swipe */}
      <Stack.Screen options={{ gestureEnabled: !activeTrip && routes.length === 0 }} />
      <View style={styles.mapContainer}>
        <NativeMap
          ref={mapRef}
          onMapPress={minimizeSheet}
          showPlaces={showPlaces}
          onArrowsShownChange={setArrowsShown}
          onUserPan={() => {
            if (activeTrip && following) setFollowing(false);
          }}
        />
      </View>

      <View style={[styles.topBar, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        {!isPinPlacementEnabled && (
          <RouteInfoHeader
            onBack={goBack}
            onCloseResult={() => showModal()}
            // While tracking, the trip stays put: no closing it
            canClose={!activeTrip}
          />
        )}
      </View>

      <PinPlacementOverlay onCancel={handleCancelPlacement} onConfirm={handleConfirmLocation} />

      <LocationSheet
        modalPosition={modalPosition}
        panHandlers={panHandlers}
        hideModal={hideModal}
        enterPinPlacementMode={enterPinPlacementMode}
        isCalculating={isCalculating}
        focusMap={(point) => mapRef.current?.moveTo(point)}
        fitMap={(points) => mapRef.current?.fitTo(points)}
        searchRoutes={(from, to) => onCalculate(from, to)}
        destinationName={destinationName}
      />

      {/* Bottom stack: map buttons sit right above whatever bar or panel is below them */}
      <View
        style={[styles.bottomStack, { bottom: insets.bottom + spacing.sm }]}
        pointerEvents="box-none"
      >
        {/* While tracking, the trip panel stacks these in its own column above its arrow */}
        {/* With no route on the map the only button is place names, in the View routes row */}
        {!activeTrip && showControls && hasRoute && (
          // The zoom hint sits left of the buttons along their bottom edge, so showing or hiding
          // it never moves them
          <View style={styles.controlsRow} pointerEvents="box-none">
            <View style={styles.hintSlot} pointerEvents="none">
              {/* Only for a route opened from the Routes tab, not a calculated trip */}
              <ArrowHint show={isRouteFromList} arrowsShown={arrowsShown} />
            </View>
            <View style={styles.controls} pointerEvents="box-none">
              {mapControls}
            </View>
          </View>
        )}

        {findingSavedTrip && (
          <View style={styles.finding} accessibilityLiveRegion="polite">
            <ActivityIndicator size="small" color={colors.textSecondary} />
            <Text style={type.bodyMedium}>Finding your trip…</Text>
          </View>
        )}

        {/* A route from the Routes tab: its code and ends, under the map buttons */}
        {isRouteFromList && hasRoute && selectedRouteInfo && (
          <ListRouteCard code={selectedRouteInfo.id} name={selectedRouteInfo.name} />
        )}

        {activeTrip ? (
          <TripProgressBar
            activeTrip={activeTrip}
            onEnd={() => confirmEndTrip()}
            controls={showControls ? mapControls : null}
          />
        ) : findingSavedTrip ? null : (
          // Never alongside "Finding your trip…": it goes in the same frame the bar comes in
          bottomBar
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Back button, then the route bar filling the rest of the row
  topBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 20,
    flexDirection: 'row',
    // Back and close stay on the first line when the route pills wrap to a second
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  // Floating over the map at the bottom, above the sheet's resting place
  bottomStack: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 15,
    gap: spacing.md,
  },
  // Same white pill as the bottom bar, while a saved route's trip is being found
  finding: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    ...elevation.floating,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  hintSlot: {
    flex: 1,
    alignItems: 'flex-start',
  },
  // Save above recenter, at the right edge
  controls: {
    alignSelf: 'flex-end',
    gap: spacing.sm,
  },
  // A 44pt floating circle; each map button is its own
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.floating,
  },
  buttonColumn: {
    gap: spacing.sm,
  },
  buttonOn: {
    backgroundColor: colors.text,
  },
  buttonPressed: {
    backgroundColor: colors.surface,
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0, // Ensure map is in background
  },
});
