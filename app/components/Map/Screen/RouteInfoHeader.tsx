import { legColor } from '@/components/Map/LocationSelector/buildPolylines';
import { MapPointsContext } from '@/context/map-context';
import { colors, elevation, fonts, radius, spacing, type } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Fragment, useContext, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// How long the full route name stays up after tapping the short one
const FULL_NAME_MS = 2000;

/** "Busay, Cebu City - Carbon Public Market" → "Busay - Carbon Public Market" */
const shortRouteName = (name: string) =>
  name
    .split(' - ')
    .map((end) => end.split(',')[0].trim())
    .join(' - ');

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
}: Readonly<{ icon: 'chevron-back' | 'close'; label: string; onPress: () => void }>) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.round, pressed && styles.roundPressed]}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={icon === 'close' ? 20 : 22} color={colors.text} />
    </Pressable>
  );
}

/**
 * Top of the trip map, floating straight on the map with no card behind it: back, the jeeps to
 * ride (dark pill, dots in each jeep's line color), the time and fare (white pill), and close.
 * Closing a calculated trip hands back to the caller, which reopens the results; tapping the
 * trip's pills reopens them too, keeping the trip on the map. A route opened from the Routes tab
 * has no close (back leaves the map), and its name stays beside its code.
 */
export default function RouteInfoHeader({
  onBack,
  onCloseResult,
  onOpenResults,
  canClose = true,
}: Readonly<{
  onBack: () => void;
  onCloseResult: () => void;
  /** Tapping the trip pills; omit to make them plain labels. */
  onOpenResults?: () => void;
  /** False hides the close button (e.g. while the trip is being tracked). */
  canClose?: boolean;
}>) {
  const {
    routes,
    setRoutes,
    results,
    selectedRouteIndex,
    selectedRouteInfo,
    setSelectedRouteInfo,
    setSelectedRouteIndex,
    isRouteFromList,
  } = useContext(MapPointsContext);

  const trip =
    !isRouteFromList && selectedRouteIndex !== null ? results[selectedRouteIndex] : undefined;
  const listRoute = isRouteFromList ? selectedRouteInfo : null;
  const isShown = routes.length > 0 && (!!trip || !!listRoute);

  // Only a calculated trip can be closed, back to its results
  const close = () => {
    setRoutes([]);
    setSelectedRouteInfo(null);
    setSelectedRouteIndex(null);
    onCloseResult();
  };

  // A route's short name; tapping it shows the full one for a moment
  const [showFullName, setShowFullName] = useState(false);
  useEffect(() => {
    if (!showFullName) return;
    const timer = setTimeout(() => setShowFullName(false), FULL_NAME_MS);
    return () => clearTimeout(timer);
  }, [showFullName]);
  const fullName = listRoute?.name ?? '';
  const hasLongerName = shortRouteName(fullName) !== fullName;

  const codes = trip ? trip.legs.map((leg) => leg.routeCode) : [listRoute?.id ?? ''];

  return (
    <>
      <RoundButton icon="chevron-back" label="Back" onPress={onBack} />

      {/* Always mounted, so the pills inside can play their exit when the route closes. The
          time pill wraps under the jeeps when long codes leave no room beside them. */}
      <View style={[styles.middle, listRoute && styles.oneLine]} pointerEvents="box-none">
        {isShown && (
          <>
            <Animated.View {...pop(0, 3)}>
              <Pressable
                onPress={onOpenResults}
                disabled={!trip || !onOpenResults}
                style={({ pressed }) => [styles.jeeps, pressed && styles.pillPressed]}
                accessibilityRole={trip ? 'button' : undefined}
                accessibilityLabel={
                  trip ? `Trip on ${codes.join(', then ')}. Show route options` : undefined
                }
              >
                {codes.map((code, i) => (
                  <Fragment key={`${code}-${i}`}>
                    {i > 0 && (
                      <Ionicons name="chevron-forward" size={13} color={colors.textTertiary} />
                    )}
                    <View style={[styles.dot, { backgroundColor: legColor(i) }]} />
                    <Text style={styles.code}>{code}</Text>
                  </Fragment>
                ))}
              </Pressable>
            </Animated.View>

            <Animated.View {...pop(1, 3)} style={styles.infoSlot}>
              <Pressable
                onPress={trip ? onOpenResults : () => setShowFullName((shown) => !shown)}
                disabled={trip ? !onOpenResults : !hasLongerName}
                style={({ pressed }) => [styles.info, pressed && styles.pillPressed]}
                accessibilityRole="button"
                accessibilityLabel={trip ? 'Show route options' : fullName}
              >
                {trip ? (
                  <Text style={styles.infoText} numberOfLines={1}>
                    {trip.estimatedMinutes} min<Text style={styles.infoMuted}> · ₱{trip.fare}</Text>
                  </Text>
                ) : (
                  <Text style={[styles.infoText, styles.infoMuted]} numberOfLines={1}>
                    {shortRouteName(fullName)}
                  </Text>
                )}
              </Pressable>
            </Animated.View>
          </>
        )}

        {listRoute && showFullName && (
          <Animated.View
            entering={FadeIn.duration(140)}
            exiting={FadeOut.duration(140)}
            style={styles.fullName}
            pointerEvents="none"
          >
            <View style={styles.fullNameBubble}>
              <Text style={styles.fullNameText}>{fullName}</Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* A route from the Routes tab has nothing to go back to here: back leaves the map */}
      {isShown && canClose && !isRouteFromList && (
        <Animated.View {...pop(2, 3)}>
          <RoundButton icon="close" label="Back to results" onPress={close} />
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
  roundPressed: {
    backgroundColor: colors.surface,
  },
  // Between back and close; pills wrap onto a second line instead of cutting off
  middle: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    minWidth: 0,
  },
  // Only shrinks (and truncates) if it is too long even for a line of its own
  infoSlot: {
    flexShrink: 1,
    maxWidth: '100%',
  },
  // A route's name stays beside its code, cut short if it doesn't fit
  oneLine: {
    flexWrap: 'nowrap',
  },
  pillPressed: {
    opacity: 0.7,
  },
  jeeps: {
    height: PILL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
    ...elevation.floating,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  code: {
    ...type.badge,
    fontSize: 15,
  },
  info: {
    height: PILL_HEIGHT,
    flexShrink: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    ...elevation.floating,
  },
  // Under the pills, spanning the row
  fullName: {
    position: 'absolute',
    top: PILL_HEIGHT + spacing.sm,
    left: 0,
    right: 0,
    alignItems: 'flex-start',
  },
  fullNameBubble: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    ...elevation.floating,
  },
  fullNameText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  infoText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  infoMuted: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
});
