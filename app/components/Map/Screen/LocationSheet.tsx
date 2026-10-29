import MapModalContent from '@/components/Map/LocationSelector/SelectorContent';
import { MapPointsContext } from '@/context/map-context';
import { useContext } from 'react';
import { colors, elevation, radius, spacing, ui } from '@/theme';
import { Animated, GestureResponderHandlers, StyleSheet, View } from 'react-native';

type Props = {
  modalPosition: Animated.Value;
  panHandlers: GestureResponderHandlers;
  showModal: () => void;
  hideModal: (callback?: () => void) => void;
  enterPinPlacementMode: (isPointA: boolean) => void;
};

/** The draggable bottom sheet holding the location selector; always mounted, moved by animation. */
export default function LocationSheet({
  modalPosition,
  panHandlers,
  showModal,
  hideModal,
  enterPinPlacementMode,
}: Props) {
  const { isPinPlacementEnabled } = useContext(MapPointsContext);

  return (
    <Animated.View
      {...panHandlers}
      style={[
        styles.sheet,
        {
          transform: [{ translateY: modalPosition }],
          pointerEvents: isPinPlacementEnabled ? 'none' : 'auto',
        },
      ]}
    >
      {/* Extended background for bounce effect */}
      <View style={styles.extension} />

      <View style={[ui.handle, styles.dragHandle]} />
      <MapModalContent
        exit={() => hideModal()}
        setShowBottomSheet={(value) => (value ? showModal() : hideModal())}
        enterPinPlacementMode={enterPinPlacementMode}
        hideModal={hideModal}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    zIndex: 10,
    ...elevation.sheet,
  },
  // Extends the sheet's background below the screen so the bounce never shows a gap
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
