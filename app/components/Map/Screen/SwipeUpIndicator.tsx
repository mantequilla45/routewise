import { MapPointsContext } from '@/context/map-context';
import { colors, elevation, fonts, radius, spacing, type } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  opacity: Animated.Value;
  isModalVisible: boolean;
  onPress: () => void;
  /** Present while a calculated trip is on the map: confirm it and start live tracking. */
  onStart?: () => void;
};

const HEIGHT = 52;

/**
 * Floating bottom controls over the map once the sheet is tucked away, in the same style as the
 * top row: with a trip on the map, a round "all routes" button and a wide "Start trip" pill;
 * otherwise a "View routes" pill. Only exists when there are results; hidden while a list route
 * is shown or a pin is being placed. Laid out by the map screen's bottom stack.
 */
export default function SwipeUpIndicator({ opacity, isModalVisible, onPress, onStart }: Props) {
  const { isRouteFromList, isPinPlacementEnabled, results } = useContext(MapPointsContext);

  if (isRouteFromList || isPinPlacementEnabled || results.length === 0) return null;

  return (
    <Animated.View
      style={[styles.row, { opacity, pointerEvents: isModalVisible ? 'none' : 'box-none' }]}
    >
      {onStart ? (
        <>
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.round, pressed && styles.whitePressed]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="All routes"
          >
            <Ionicons name="list" size={22} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={onStart}
            style={({ pressed }) => [styles.start, pressed && styles.startPressed]}
            accessibilityRole="button"
            accessibilityHint="Follows your ride and alerts you before your stop"
          >
            <Ionicons name="navigate" size={18} color={colors.textOnAccent} />
            <Text style={styles.startText}>Start trip</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.viewRoutes, pressed && styles.whitePressed]}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-up" size={18} color={colors.text} />
          <Text style={type.bodyMedium}>View routes</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  round: {
    width: HEIGHT,
    height: HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.floating,
  },
  whitePressed: {
    backgroundColor: colors.surface,
  },
  start: {
    flex: 1,
    height: HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    ...elevation.floating,
  },
  startPressed: {
    backgroundColor: colors.accentPressed,
  },
  startText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.textOnAccent,
  },
  viewRoutes: {
    height: HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    ...elevation.floating,
  },
});
