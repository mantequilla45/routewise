import { MapPointsContext } from '@/context/map-context';
import { useContext } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  opacity: Animated.Value;
  isModalVisible: boolean;
  onPress: () => void;
};

/**
 * Thin bar at the bottom of the map that reopens the location sheet once it has been swiped
 * away. Hidden while a list route is shown or a pin is being placed.
 */
export default function SwipeUpIndicator({ opacity, isModalVisible, onPress }: Props) {
  const { isRouteFromList, isPinPlacementEnabled, results } = useContext(MapPointsContext);

  if (isRouteFromList || isPinPlacementEnabled) return null;

  return (
    <Animated.View
      style={[styles.indicator, { opacity, pointerEvents: isModalVisible ? 'none' : 'auto' }]}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.touchable}>
        <View style={styles.dragHandle} />
        <Text style={styles.text}>
          {results && results.length > 0 ? 'Tap to view routes' : 'Tap to select location'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#303030',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 15,
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  touchable: {
    width: '100%',
    alignItems: 'center',
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
  text: {
    color: '#999',
    fontSize: 14,
    marginBottom: 5,
  },
});
