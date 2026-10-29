import { MapPointsContext } from '@/context/map-context';
import { colors, spacing, type } from '@/theme';
import { LatLng } from '@/types/GeoTypes';
import { Ionicons } from '@expo/vector-icons';
import { useContext, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { motion } from '@/lib/motion';
import Animated from 'react-native-reanimated';
import PlaceShortcuts from '@/components/Home/PlaceShortcuts';
import { addRecentPlace } from '@/lib/recentPlaces';
import OptionRow from './OptionRow';
import InlinePlaceSearch from './InlinePlaceSearch';
import { tripPolylinePrefix } from './buildPolylines';
import PointPicker from './PointPicker';
import RouteResultsList from './RouteResultsList';
import useCurrentLocation from './useCurrentLocation';
import usePlaceLabel from './usePlaceLabel';

type SearchTarget = 'start' | 'destination';
type NamedPoint = { point: LatLng; name: string };

/**
 * The trip sheet, one step at a time: pick a start, then a destination, then see results.
 * Each step offers inline place search, the current location (start only) and picking on the
 * map. On the trip step, tapping From or To swaps in the same search for that point.
 * Results load as soon as both points are set.
 */
export default function MapModalContent({
  enterPinPlacementMode,
  hideModal,
  isCalculating,
  focusMap,
  fitMap,
  searchRoutes,
  initialDestinationName,
}: Readonly<{
  enterPinPlacementMode: (isPointA: boolean) => void;
  hideModal: () => void;
  isCalculating: boolean;
  /** Move the map camera to a point. */
  focusMap: (point: LatLng) => void;
  /** Fit the map camera around a set of points. */
  fitMap: (points: LatLng[]) => void;
  /** Search routes for an explicit pair, used right after a point changes. */
  searchRoutes: (from: LatLng, to: LatLng) => void;
  /** Name for a destination set before this screen opened (Home search). */
  initialDestinationName?: string;
}>) {
  const {
    pointA,
    pointB,
    setPointA,
    setPointB,
    setRoutes,
    allRoutes,
    setAllRoutes,
    results,
    setResults,
    setIsPinPlacementEnabled,
    selectedRouteIndex,
    setSelectedRouteIndex,
    setSelectedRouteInfo,
  } = useContext(MapPointsContext);
  const { isLocating, locate } = useCurrentLocation();
  // Trip step: which point is being changed (shows the search instead of the results)
  const [editing, setEditing] = useState<SearchTarget | null>(null);
  // Names for points set by search or GPS; points placed on the map have none.
  const [startName, setStartName] = useState<NamedPoint | null>(null);
  const [destinationName, setDestinationName] = useState<NamedPoint | null>(() =>
    pointB && initialDestinationName ? { point: pointB, name: initialDestinationName } : null,
  );

  // Searched/GPS points keep their name; pins placed on the map get a reverse-geocoded address
  const nameFor = (point: LatLng | null, named: NamedPoint | null) =>
    point && named?.point === point ? named.name : undefined;
  const startPlace = usePlaceLabel(pointA, nameFor(pointA, startName));
  const destinationPlace = usePlaceLabel(pointB, nameFor(pointB, destinationName));

  // Set a point from search or GPS, show it on the map, and search again if the trip is complete.
  const setNamedPoint = (target: SearchTarget, point: LatLng, name: string) => {
    if (name !== 'Current location') addRecentPlace({ name, location: point });
    if (target === 'start') {
      setStartName({ point, name });
      setPointA(point);
      if (pointB) searchRoutes(point, pointB);
    } else {
      setDestinationName({ point, name });
      setPointB(point);
      if (pointA) searchRoutes(pointA, point);
    }
    focusMap(point);
    setEditing(null);
  };

  const startFromMyLocation = async () => {
    const here = await locate();
    if (here) setNamedPoint('start', here, 'Current location');
  };

  const chooseOnMap = (target: SearchTarget) => {
    setEditing(null);
    enterPinPlacementMode(target === 'start');
  };

  // The search field plus the non-search options for one point
  const pointSearch = (
    target: SearchTarget,
    opts: { autoFocus?: boolean; onCancel?: () => void },
  ) => (
    <InlinePlaceSearch
      placeholder={target === 'start' ? 'Search for a starting point' : 'Search for a destination'}
      near={target === 'destination' ? pointA : pointB}
      onSelectPlace={(point, name) => setNamedPoint(target, point, name)}
      onChooseOnMap={() => chooseOnMap(target)}
      autoFocus={opts.autoFocus}
      onCancel={opts.onCancel}
    >
      {target === 'start' && (
        <>
          <OptionRow
            icon="locate"
            iconColor={colors.origin}
            label="Use my current location"
            onPress={startFromMyLocation}
            loading={isLocating}
          />
          <View style={styles.divider} />
        </>
      )}
      <OptionRow
        icon="map-outline"
        iconColor={colors.textSecondary}
        label="Choose on map"
        onPress={() => chooseOnMap(target)}
      />
      <PlaceShortcuts
        maxRecent={3}
        onSelect={(point, name) => setNamedPoint(target, point, name)}
      />
    </InlinePlaceSearch>
  );

  const handleRouteSelect = (index: number) => {
    const selectedResult = results[index];
    if (!selectedResult) {
      console.warn(`No result found at index ${index}`);
      return;
    }

    setSelectedRouteIndex(index);
    setSelectedRouteInfo({ id: selectedResult.routeCode, name: selectedResult.routeName });

    const prefix = tripPolylinePrefix(index);
    const polylines = allRoutes.filter((r) => r.id?.startsWith(prefix));
    if (polylines.length === 0) {
      console.warn(`No polyline found for route ${selectedResult.routeCode} at index ${index}`);
    }
    setRoutes(polylines);
    // Show the whole trip: every leg plus the walks from and to the pins
    fitMap([
      ...selectedResult.legs.flatMap((leg) => leg.coordinates),
      ...(pointA ? [pointA] : []),
      ...(pointB ? [pointB] : []),
    ]);

    hideModal();
  };

  const clearTrip = () => {
    setResults([]);
    setRoutes([]);
    setAllRoutes([]);
    setSelectedRouteIndex(null);
    setSelectedRouteInfo(null);
    setStartName(null);
    setDestinationName(null);
    // Clear the points after the routes, so the map drops the polylines first
    setTimeout(() => {
      setPointA(null);
      setPointB(null);
      setIsPinPlacementEnabled(false);
    }, 50);
  };

  // Step 1: starting point
  if (!pointA) {
    return (
      <Animated.View key="start" entering={motion.enter}>
        {destinationPlace && (
          <View style={styles.fromRow}>
            <Ionicons name="location-sharp" size={12} color={colors.destination} />
            <Text style={[type.caption, styles.fromText]} numberOfLines={1}>
              To <Text style={styles.fromValue}>{destinationPlace.title}</Text>
              {destinationPlace.subtitle && ` · ${destinationPlace.subtitle}`}
            </Text>
          </View>
        )}
        <Text style={[type.title, styles.title]}>Where are you starting?</Text>
        {pointSearch('start', {})}
      </Animated.View>
    );
  }

  // Step 2: destination
  if (!pointB) {
    return (
      <Animated.View key="destination" entering={motion.enter}>
        <View style={styles.fromRow}>
          <View style={styles.originDot} />
          <Text style={[type.caption, styles.fromText]} numberOfLines={1}>
            From <Text style={styles.fromValue}>{startPlace?.title}</Text>
            {startPlace?.subtitle && ` · ${startPlace.subtitle}`}
          </Text>
          <Pressable onPress={clearTrip} hitSlop={8} accessibilityRole="button">
            <Text style={styles.link}>Change</Text>
          </Pressable>
        </View>
        <Text style={[type.title, styles.title]}>Where to?</Text>
        {pointSearch('destination', {})}
      </Animated.View>
    );
  }

  // Step 3, changing one point: the same search, with Cancel back to the results
  if (editing) {
    return (
      <Animated.View key={`editing-${editing}`} entering={motion.enter}>
        <Text style={[type.title, styles.title]}>
          {editing === 'start' ? 'Change starting point' : 'Change destination'}
        </Text>
        {pointSearch(editing, { autoFocus: true, onCancel: () => setEditing(null) })}
      </Animated.View>
    );
  }

  // Step 3: the trip and its results
  return (
    <Animated.View key="trip" entering={motion.enter} style={styles.shrink}>
      <View style={styles.header}>
        <Text style={type.title}>Your trip</Text>
        <Pressable onPress={clearTrip} hitSlop={8} accessibilityRole="button">
          <Text style={styles.link}>New trip</Text>
        </Pressable>
      </View>

      <PointPicker
        start={startPlace}
        destination={destinationPlace}
        onSelectPointA={() => setEditing('start')}
        onSelectPointB={() => setEditing('destination')}
      />

      {isCalculating ? (
        <Animated.View
          key="loading"
          entering={motion.enter}
          exiting={motion.exit}
          style={styles.loading}
        >
          <ActivityIndicator size="small" color={colors.textSecondary} />
          <Text style={type.caption}>Finding jeeps…</Text>
        </Animated.View>
      ) : (
        <RouteResultsList
          results={results}
          selectedRouteIndex={selectedRouteIndex}
          onSelect={handleRouteSelect}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Lets the results list shrink when the sheet is at its height limit
  shrink: {
    flexShrink: 1,
  },
  title: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  link: {
    ...type.bodyMedium,
    color: colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 52,
  },
  fromRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  originDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.origin,
  },
  fromText: {
    flex: 1,
  },
  fromValue: {
    color: colors.text,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
});
