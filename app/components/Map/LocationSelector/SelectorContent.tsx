import { MapPointsContext } from '@/context/map-context';
import { Ionicons } from '@expo/vector-icons';
import { useContext, useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  return (
    <View style={styles.container}>
      <View style={styles.bottomSheetTopRow}>
        <Text style={styles.bottomSheetTitleText}>
          {!pointA
            ? 'Select your first location'
            : !pointB
              ? 'Select your second location'
              : 'Directions'}
        </Text>
        {(pointA || pointB) && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Ionicons name="refresh-outline" color="white" size={20} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomSheetRow}>
        <PointPicker
          pointA={pointA}
          pointB={pointB}
          onSelectPointA={onSelectPointA}
          onSelectPointB={onSelectPointB}
        />
      </View>

      <View style={styles.bottomSheetRow}>
        <TouchableOpacity
          style={[styles.calculateButton, isCalculating && styles.calculateButtonDisabled]}
          onPress={onCalculate}
          disabled={isCalculating || !pointA || !pointB}
        >
          {isCalculating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.calculateButtonText}>Finding Routes...</Text>
            </View>
          ) : (
            <Text style={styles.calculateButtonText}>Find Jeeps</Text>
          )}
        </TouchableOpacity>
      </View>

      <RouteResultsList
        results={results}
        selectedRouteIndex={selectedRouteIndex}
        onSelect={handleRouteSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 5,
  },
  bottomSheetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  bottomSheetTitleText: {
    color: 'white',
    textAlign: 'left',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Lexend_500Medium',
    flex: 1,
  },

  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 16,
    gap: 4,
  },

  bottomSheetRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 10,
  },

  calculateButton: {
    height: 48,
    shadowRadius: 25,
    backgroundColor: '#FFCC66',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  calculateButtonText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
    color: '#2D2D2D',
    marginRight: 5,
  },

  calculateButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#E0B050',
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
