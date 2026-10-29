import NativeMap, { NativeMapRef } from '@/components/Map/NativeMap';
import LocationSheet from '@/components/Map/Screen/LocationSheet';
import PinPlacementOverlay from '@/components/Map/Screen/PinPlacementOverlay';
import RouteInfoHeader from '@/components/Map/Screen/RouteInfoHeader';
import SaveRouteButton from '@/components/Map/Screen/SaveRouteButton';
import SwipeUpIndicator from '@/components/Map/Screen/SwipeUpIndicator';
import TripProgressBar from '@/components/Map/Screen/TripProgressBar';
import { useModalAnimation } from '@/components/Map/Screen/useModalAnimation';
import useRouteCalculation from '@/components/Map/LocationSelector/useRouteCalculation';
import { MapPointsContext } from '@/context/map-context';
import { startTrip, stopTrip, useActiveTrip } from '@/lib/tripTracking/tracker';
import { colors, elevation, radius, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useContext, useEffect, useEffectEvent, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
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
  } = useContext(MapPointsContext);
  const activeTrip = useActiveTrip();
  // Shop and landmark names on the map: off by default so the route stands out
  const [showPlaces, setShowPlaces] = useState(false);
  const { isCalculating, onCalculate } = useRouteCalculation();
  const mapRef = useRef<NativeMapRef>(null);
  const insets = useSafeAreaInsets();
  const { isModalVisible, modalPosition, indicatorOpacity, showModal, hideModal, panHandlers } =
    useModalAnimation(isRouteFromList);

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

  const handleStartTrip = async () => {
    if (!shownTrip || !pointB) return;
    const started = await startTrip(shownTrip, pointB);
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
  // go to the rider instead.
  const recenter = () => {
    if (activeTrip?.position) {
      mapRef.current?.moveTo(activeTrip.position);
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

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  // Leaving the map ends a tracked trip, after asking
  const goBack = () => (activeTrip ? confirmEndTrip(leave) : leave());

  // Map buttons over the map once the sheet is tucked away: place names on/off, and with a
  // route on the map, save and recenter/locate
  const showControls = !isModalVisible && !isPinPlacementEnabled;
  const mapControls = (
    <>
      <Pressable
        onPress={() => setShowPlaces((s) => !s)}
        style={({ pressed }) => [
          styles.mapButton,
          showPlaces && styles.mapButtonOn,
          pressed && styles.mapButtonPressed,
        ]}
        hitSlop={8}
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
      {routes.length > 0 && <SaveRouteButton />}
      {routes.length > 0 && (
        <Pressable
          onPress={recenter}
          style={({ pressed }) => [styles.mapButton, pressed && styles.mapButtonPressed]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={activeTrip ? 'Show my location' : 'Show the whole route'}
        >
          <Ionicons name={activeTrip ? 'locate' : 'scan-outline'} size={20} color={colors.text} />
        </Pressable>
      )}
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.mapContainer}>
        <NativeMap ref={mapRef} onMapPress={minimizeSheet} showPlaces={showPlaces} />
      </View>

      <View style={[styles.topBar, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        {!isPinPlacementEnabled && (
          <RouteInfoHeader
            onBack={goBack}
            onCloseResult={() => showModal()}
            // While tracking, the trip stays put: no closing it or browsing other results
            onOpenResults={activeTrip ? undefined : () => showModal()}
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
        {!activeTrip && showControls && (
          <View style={styles.controls} pointerEvents="box-none">
            {mapControls}
          </View>
        )}

        {activeTrip ? (
          <TripProgressBar
            activeTrip={activeTrip}
            onEnd={() => confirmEndTrip()}
            controls={showControls ? mapControls : null}
          />
        ) : (
          <SwipeUpIndicator
            opacity={indicatorOpacity}
            isModalVisible={isModalVisible}
            onPress={() => showModal()}
            onStart={shownTrip && pointB ? handleStartTrip : undefined}
          />
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
  // Save above recenter, at the right edge
  controls: {
    alignSelf: 'flex-end',
    gap: spacing.sm,
  },
  mapButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.floating,
  },
  mapButtonOn: {
    backgroundColor: colors.text,
  },
  mapButtonPressed: {
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
