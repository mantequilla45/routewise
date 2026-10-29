import NativeMap, { NativeMapRef } from '@/components/Map/NativeMap';
import LocationSheet from '@/components/Map/Screen/LocationSheet';
import PinPlacementOverlay from '@/components/Map/Screen/PinPlacementOverlay';
import RouteInfoHeader from '@/components/Map/Screen/RouteInfoHeader';
import SwipeUpIndicator from '@/components/Map/Screen/SwipeUpIndicator';
import { useModalAnimation } from '@/components/Map/Screen/useModalAnimation';
import { MapPointsContext } from '@/context/map-context';
import { Stack } from 'expo-router';
import { useContext, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MapScreen() {
  const { isPointAB, setIsPointAB, setIsPinPlacementEnabled, isRouteFromList } =
    useContext(MapPointsContext);
  const [isSelectingLocations, setIsSelectingLocations] = useState(false);
  const mapRef = useRef<NativeMapRef>(null);
  const insets = useSafeAreaInsets();
  const { isModalVisible, modalPosition, indicatorOpacity, showModal, hideModal, panHandlers } =
    useModalAnimation(isRouteFromList);

  const handleConfirmLocation = () => {
    if (!mapRef.current) return;

    if (isSelectingLocations) {
      if (isPointAB) {
        // First location - set it and continue straight on to the destination
        mapRef.current.setLocationAtCenter();
        setIsPointAB(false);
        setIsPinPlacementEnabled(true);
      } else {
        // Second location - complete the flow and bring the sheet back up
        mapRef.current.setLocationAtCenter();
        setIsSelectingLocations(false);
        setIsPinPlacementEnabled(false);
        showModal();
      }
    } else {
      // Normal single location selection (not in flow)
      mapRef.current.setLocationAtCenter();
      setIsPinPlacementEnabled(false);
      showModal();
    }
  };

  const handleCancelPlacement = () => {
    setIsSelectingLocations(false);
    setIsPinPlacementEnabled(false);
    showModal();
  };

  // Animate the sheet down, then enable pin placement
  const enterPinPlacementMode = (isPointA: boolean) => {
    setIsSelectingLocations(true);
    hideModal(() => {
      setIsPinPlacementEnabled(true);
      setIsPointAB(isPointA);
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.mapContainer}>
        <NativeMap ref={mapRef} />
      </View>

      {/* Only over the map: while the sheet is open, the selected row shows the route instead */}
      {!isModalVisible && <RouteInfoHeader />}

      <PinPlacementOverlay onCancel={handleCancelPlacement} onConfirm={handleConfirmLocation} />

      <LocationSheet
        modalPosition={modalPosition}
        panHandlers={panHandlers}
        showModal={showModal}
        hideModal={hideModal}
        enterPinPlacementMode={enterPinPlacementMode}
      />

      <SwipeUpIndicator
        opacity={indicatorOpacity}
        isModalVisible={isModalVisible}
        onPress={() => showModal()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
