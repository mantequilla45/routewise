import MapModalContent from '@/components/Map/LocationSelector/SelectorContent';
import { MapPointsContext } from '@/context/map-context';
import { useContext } from 'react';
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

      <View style={styles.dragHandle} />
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
    bottom: 0, // Sit at bottom, let content push it up
    left: 0,
    right: 0,
    backgroundColor: '#303030',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20, // Add padding for tab bar
    zIndex: 10, // Above map
    elevation: 10, // For Android
  },
  extension: {
    position: 'absolute',
    bottom: -200,
    left: -20,
    right: -20,
    height: 250,
    backgroundColor: '#303030',
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#666',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
    marginTop: -5,
  },
});
