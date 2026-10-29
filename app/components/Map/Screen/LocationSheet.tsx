import MapModalContent from '@/components/Map/LocationSelector/SelectorContent';
import { MapPointsContext } from '@/context/map-context';
import { motion } from '@/lib/motion';
import { colors, elevation, radius, spacing, ui } from '@/theme';
import { LatLng } from '@/types/GeoTypes';
import { useContext } from 'react';
import {
  Animated,
  GestureResponderHandlers,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';

// Top row (44pt buttons and pills) plus its offset and a gap; see MapScreen's topBar.
const TOP_ROW_CLEARANCE = 72;

type Props = {
  modalPosition: Animated.Value;
  panHandlers: GestureResponderHandlers;
  hideModal: (callback?: () => void) => void;
  enterPinPlacementMode: (isPointA: boolean) => void;
  isCalculating: boolean;
  focusMap: (point: LatLng) => void;
  fitMap: (points: LatLng[]) => void;
  searchRoutes: (from: LatLng, to: LatLng) => void;
  destinationName?: string;
};

/**
 * The draggable bottom sheet holding the trip steps; always mounted, slid by `modalPosition`.
 * The visible surface is an inner Reanimated view so it can glide to a new height when the
 * step changes and follow the keyboard frame by frame.
 */
export default function LocationSheet({
  modalPosition,
  panHandlers,
  hideModal,
  enterPinPlacementMode,
  isCalculating,
  focusMap,
  fitMap,
  searchRoutes,
  destinationName,
}: Props) {
  const { isPinPlacementEnabled } = useContext(MapPointsContext);
  const keyboard = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // Keep the map screen's top row (back button + route bar) uncovered
  const maxHeight = height - insets.top - TOP_ROW_CLEARANCE;
  const keyboardPadding = useAnimatedStyle(() => ({
    paddingBottom: spacing.xl + keyboard.height.value,
  }));

  return (
    <Animated.View
      {...panHandlers}
      style={[
        styles.container,
        {
          transform: [{ translateY: modalPosition }],
          pointerEvents: isPinPlacementEnabled ? 'none' : 'auto',
        },
      ]}
    >
      {/* Extends the surface below the screen so the bounce never shows a gap */}
      <View style={styles.extension} />

      <Reanimated.View
        layout={motion.layout}
        style={[styles.surface, { maxHeight }, keyboardPadding]}
      >
        <View style={[ui.handle, styles.dragHandle]} />
        <MapModalContent
          enterPinPlacementMode={enterPinPlacementMode}
          hideModal={() => hideModal()}
          isCalculating={isCalculating}
          focusMap={focusMap}
          fitMap={fitMap}
          searchRoutes={searchRoutes}
          initialDestinationName={destinationName}
        />
      </Reanimated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  surface: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    ...elevation.sheet,
  },
  extension: {
    position: 'absolute',
    bottom: -200,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: colors.background,
  },
  dragHandle: {
    marginBottom: spacing.md,
  },
});
