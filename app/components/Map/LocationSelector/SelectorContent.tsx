import { MapPointsContext } from '@/context/map-context';
import { useContext, useEffect, useRef } from 'react';
import { colors, spacing, type, ui } from '@/theme';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import PointPicker from './PointPicker';
import RouteResultsList from './RouteResultsList';
import useRouteCalculation from './useRouteCalculation';

export default function MapModalContent({
  exit,
  setShowBottomSheet,
  enterPinPlacementMode,
  hideModal,
}: Readonly<{
  exit: () => void;
  setShowBottomSheet: (value: boolean) => void;
  enterPinPlacementMode?: (isPointA: boolean) => void;
  hideModal?: () => void;
}>) {
  const {
    setIsPointAB,
    setIsPinPlacementEnabled,
    pointA,
    pointB,
    setPointA,
    setPointB,
    setRoutes,
    allRoutes,
    setAllRoutes,
    results,
    setResults,
    isPinPlacementEnabled,
    selectedRouteIndex,
    setSelectedRouteIndex,
    setSelectedRouteInfo,
  } = useContext(MapPointsContext);
  // Set when the user starts picking point A; read once pointA lands to open point B picking.
  const wasSelectingFirstLocation = useRef(false);
  const { isCalculating, onCalculate } = useRouteCalculation();

  // Auto-open second location selection after first location is selected
  useEffect(() => {
    if (wasSelectingFirstLocation.current && pointA && !isPinPlacementEnabled) {
      // First location was just selected, now open second location selection
      wasSelectingFirstLocation.current = false;
      setTimeout(() => {
        setIsPinPlacementEnabled(true);
        setIsPointAB(false);
        setShowBottomSheet(false);
      }, 100);
    }
  }, [pointA, isPinPlacementEnabled, setIsPinPlacementEnabled, setIsPointAB, setShowBottomSheet]);

  const onSelectPointA = () => {
    if (enterPinPlacementMode) {
      enterPinPlacementMode(true);
    } else {
      setIsPinPlacementEnabled(true);
      setIsPointAB(true);
      wasSelectingFirstLocation.current = true;
      setShowBottomSheet(false);
    }
  };

  const onSelectPointB = () => {
    if (enterPinPlacementMode) {
      enterPinPlacementMode(false);
    } else {
      setIsPinPlacementEnabled(true);
      setIsPointAB(false);
      setShowBottomSheet(false);
    }
  };

  // Handle route selection
  const handleRouteSelect = (index: number) => {
    // Find the corresponding route in results
    const selectedResult = results[index];
    if (!selectedResult) {
      console.warn(`No result found at index ${index}`);
      return;
    }

    setSelectedRouteIndex(index);

    // Set the route info to display in header
    setSelectedRouteInfo({
      id: selectedResult.routeCode || selectedResult.routeId,
      name: selectedResult.routeName || selectedResult.routeId,
    });

    // Check if it's a transfer route
    if ('isTransfer' in selectedResult && selectedResult.isTransfer) {
      // Find polylines for both segments
      const polylinesToShow = allRoutes.filter((r) => r.id && r.id.startsWith(`route_${index}_`));

      setRoutes(polylinesToShow);
    } else {
      // Single route - find the matching polyline
      const polylineToShow = allRoutes.find((r) => r.id === `route_${index}`);
      if (polylineToShow) {
        setRoutes([polylineToShow]);
      } else {
        console.warn(
          `No polyline found for route ${selectedResult.routeCode || selectedResult.routeId} at index ${index}`,
        );
        setRoutes([]);
      }
    }

    // Hide the modal smoothly after selecting a route
    if (hideModal) {
      hideModal();
    } else {
      setShowBottomSheet(false);
    }
  };

  const onClear = () => {
    // Clear all points and routes
    setResults([]); // Clear route results first
    setRoutes([]); // Clear polylines from map
    setAllRoutes([]); // Clear stored routes
    setSelectedRouteIndex(null); // Clear selection
    setSelectedRouteInfo(null); // Clear route info header

    // Use a small delay to ensure routes are cleared before points
    setTimeout(() => {
      setPointA(null);
      setPointB(null);
      setIsPinPlacementEnabled(false);
    }, 50);
  };

  const title = !pointA ? 'Where are you starting?' : !pointB ? 'Where to?' : 'Your trip';
  const canSearch = !!pointA && !!pointB && !isCalculating;

  return (
    <View>
      <View style={styles.header}>
        <Text style={type.title}>{title}</Text>
        {(pointA || pointB) && (
          <Pressable onPress={onClear} hitSlop={8} accessibilityRole="button">
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      <PointPicker
        pointA={pointA}
        pointB={pointB}
        onSelectPointA={onSelectPointA}
        onSelectPointB={onSelectPointB}
      />

      <Pressable
        style={({ pressed }) => [
          ui.primaryButton,
          styles.searchButton,
          pressed && styles.searchButtonPressed,
          !canSearch && !isCalculating && styles.searchButtonDisabled,
        ]}
        onPress={onCalculate}
        disabled={!canSearch}
        accessibilityRole="button"
      >
        {isCalculating && <ActivityIndicator size="small" color={colors.textOnAccent} />}
        <Text style={ui.primaryButtonText}>{isCalculating ? 'Finding routes…' : 'Find jeeps'}</Text>
      </Pressable>

      <RouteResultsList
        results={results}
        selectedRouteIndex={selectedRouteIndex}
        onSelect={handleRouteSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  clearText: {
    ...type.bodyMedium,
    color: colors.textSecondary,
  },
  searchButton: {
    marginTop: spacing.md,
  },
  searchButtonPressed: {
    backgroundColor: colors.accentPressed,
  },
  searchButtonDisabled: {
    opacity: 0.45,
  },
});
