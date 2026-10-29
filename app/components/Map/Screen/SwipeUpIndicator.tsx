import { MapPointsContext } from '@/context/map-context';
import { useContext } from 'react';
import { colors, elevation, radius, spacing, type, ui } from '@/theme';
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
        <View style={ui.handle} />
        <Text style={styles.text}>
          {results && results.length > 0 ? 'View routes' : 'Plan a trip'}
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
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    zIndex: 10,
    ...elevation.sheet,
  },
  touchable: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    ...type.bodyMedium,
    color: colors.textSecondary,
  },
});
