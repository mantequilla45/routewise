import { MapPointsContext } from '@/context/map-context';
import { colors, elevation, fonts, radius, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, withDelay, withSpring, withTiming } from 'react-native-reanimated';

// Each route piece pops on its own, in place: it shrinks and fades out when the route closes and
// springs back in when one is shown. `delay` staggers them so they never move as one block.
const POPPED_SCALE = 0.6;
const STAGGER_MS = 50;

const popOut = (delay: number) => () => {
  'worklet';
  const timing = { duration: 170, easing: Easing.in(Easing.cubic) };
  return {
    initialValues: { opacity: 1, transform: [{ scale: 1 }] },
    animations: {
      opacity: withDelay(delay, withTiming(0, timing)),
      transform: [{ scale: withDelay(delay, withTiming(POPPED_SCALE, timing)) }],
    },
  };
};

const popIn = (delay: number) => () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ scale: POPPED_SCALE }] },
    animations: {
      opacity: withDelay(delay, withTiming(1, { duration: 140 })),
      transform: [
        { scale: withDelay(delay, withSpring(1, { damping: 14, stiffness: 260, mass: 0.8 })) },
      ],
    },
  };
};

/** Entering/exiting for the nth piece: in left to right, out right to left. */
const pop = (index: number, count: number) => ({
  entering: popIn(index * STAGGER_MS),
  exiting: popOut((count - 1 - index) * STAGGER_MS),
});

function RoundButton({
  icon,
  label,
  onPress,
}: Readonly<{ icon: 'chevron-back'; label: string; onPress: () => void }>) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.round, pressed && styles.roundPressed]}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={22} color={colors.text} />
    </Pressable>
  );
}

/**
 * Top of the trip map, floating straight on the map: back, and for a calculated trip a Cancel
 * button that hands back to the caller (which reopens the results). The trip's jeeps and time are
 * on the map itself (its first stop), not up here. A route opened from the Routes tab has its
 * code and name in a card at the bottom (ListRouteCard) and no close: back leaves the map.
 */
export default function RouteInfoHeader({
  onBack,
  onCloseResult,
  canClose = true,
}: Readonly<{
  onBack: () => void;
  onCloseResult: () => void;
  /** False hides the close button (e.g. while the trip is being tracked). */
  canClose?: boolean;
}>) {
  const {
    routes,
    setRoutes,
    results,
    selectedRouteIndex,
    setSelectedRouteInfo,
    setSelectedRouteIndex,
    isRouteFromList,
  } = useContext(MapPointsContext);

  const trip =
    !isRouteFromList && selectedRouteIndex !== null ? results[selectedRouteIndex] : undefined;
  const isShown = routes.length > 0 && !!trip;

  // Only a calculated trip can be closed, back to its results
  const close = () => {
    setRoutes([]);
    setSelectedRouteInfo(null);
    setSelectedRouteIndex(null);
    onCloseResult();
  };

  return (
    <>
      <RoundButton icon="chevron-back" label="Back" onPress={onBack} />

      <View style={styles.middle} />

      {isShown && canClose && (
        <Animated.View {...pop(0, 1)}>
          <Pressable
            onPress={close}
            style={({ pressed }) => [styles.cancel, pressed && styles.roundPressed]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityHint="Back to the route options"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Animated.View>
      )}
    </>
  );
}

const PILL_HEIGHT = 44;

const styles = StyleSheet.create({
  round: {
    width: PILL_HEIGHT,
    height: PILL_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.floating,
  },
  // Same height and white as the back button, sized to its text
  cancel: {
    height: PILL_HEIGHT,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.floating,
  },
  cancelText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  roundPressed: {
    backgroundColor: colors.surface,
  },
  // Between back and Cancel
  middle: {
    flex: 1,
  },
});
