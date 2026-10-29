import { legColor } from '@/components/Map/LocationSelector/buildPolylines';
import { lineLength, metersBetween } from '@/lib/tripTracking/progress';
import type { ActiveTrip } from '@/lib/tripTracking/tracker';
import { colors, elevation, fonts, radius, spacing, type } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const formatDistance = (m: number) =>
  m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.max(10, Math.round(m / 10) * 10)} m`;

type Step =
  | { kind: 'walk'; title: string; detail: string }
  | { kind: 'ride'; leg: number; title: string; detail: string; done: number; soon: boolean };

/**
 * The trip as steps (walk, ride, transfer, ride, walk) and which one the rider is on now. Off a
 * jeep, the "get off" alert tells before from after: not yet alerted means still heading to
 * board it; alerted means they got off and are walking on.
 */
function currentStep({ trip, progress, position, destination }: ActiveTrip): {
  step: Step;
  index: number;
  total: number;
  next: string | null;
} {
  const legs = trip.legs;
  const i = progress.legIndex;
  const leg = legs[i];
  const total = legs.length * 2 + 1;

  if (progress.remaining !== null) {
    const length = lineLength(leg.coordinates) || 1;
    const soon = progress.alerted[i];
    return {
      index: 2 * i + 1,
      total,
      step: {
        kind: 'ride',
        leg: i,
        title: soon ? 'Get off soon' : `${formatDistance(progress.remaining)} to your stop`,
        detail: soon
          ? `Your stop is about ${formatDistance(progress.remaining)} ahead`
          : `Riding ${leg.routeCode}`,
        done: Math.min(1, Math.max(0, 1 - progress.remaining / length)),
        soon,
      },
      next: legs[i + 1] ? `Transfer to ${legs[i + 1].routeCode}` : 'Walk to your destination',
    };
  }

  const gotOff = progress.alerted[i];
  if (gotOff && !legs[i + 1]) {
    return {
      index: total - 1,
      total,
      step: {
        kind: 'walk',
        title: 'Walk to your destination',
        detail: position
          ? `About ${formatDistance(metersBetween(position, destination))} away`
          : '',
      },
      next: null,
    };
  }
  const boarding = gotOff ? i + 1 : i;
  return {
    index: 2 * boarding,
    total,
    step: {
      kind: 'walk',
      title: `Walk to the ${legs[boarding].routeCode} stop`,
      detail: boarding === 0 ? 'Board at the bus marker on the map' : 'Wait at the bus marker',
    },
    next: `Ride ${legs[boarding].routeCode}`,
  };
}

/**
 * Floating panel while a trip is tracked: which step of the trip, what to do now (with a
 * progress bar while riding), what comes next, and End. Notes when alerts need the app open.
 */
export default function TripProgressBar({
  activeTrip,
  onEnd,
}: Readonly<{ activeTrip: ActiveTrip; onEnd: () => void }>) {
  const { step, index, total, next } = currentStep(activeTrip);
  const isRide = step.kind === 'ride';
  const soon = isRide && step.soon;
  const color = isRide ? legColor(step.leg) : colors.textSecondary;

  return (
    <View style={[styles.panel, soon && styles.panelSoon]}>
      <View style={styles.header}>
        <Text style={type.overline}>
          Step {index + 1} of {total}
        </Text>
        <Pressable
          onPress={onEnd}
          style={({ pressed }) => [styles.end, pressed && styles.endPressed]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="End trip"
        >
          <Text style={styles.endText}>End</Text>
        </Pressable>
      </View>

      <View style={styles.main}>
        <View style={[styles.icon, { backgroundColor: isRide ? color : colors.surface }]}>
          <Ionicons
            name={soon ? 'notifications' : isRide ? 'bus' : 'walk'}
            size={20}
            color={isRide ? colors.textOnDark : colors.text}
          />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, soon && styles.titleSoon]} numberOfLines={1}>
            {step.title}
          </Text>
          {!!step.detail && (
            <Text style={type.caption} numberOfLines={1}>
              {step.detail}
            </Text>
          )}
        </View>
      </View>

      {isRide && (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${step.done * 100}%`, backgroundColor: color }]} />
        </View>
      )}

      {(next || !activeTrip.background) && <View style={styles.divider} />}
      {next && (
        <View style={styles.next}>
          <Text style={styles.nextLabel}>Next</Text>
          <Text style={styles.nextText} numberOfLines={1}>
            {next}
          </Text>
        </View>
      )}
      {!activeTrip.background && (
        <Text style={styles.note}>Keep RouteWise open to get the alert before your stop.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: radius.sheet,
    backgroundColor: colors.background,
    ...elevation.floating,
  },
  panelSoon: {
    borderWidth: 2,
    borderColor: colors.destination,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -spacing.xs,
  },
  end: {
    height: 32,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endPressed: {
    backgroundColor: colors.surfacePressed,
  },
  endText: {
    ...type.label,
    color: colors.text,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  titleSoon: {
    color: colors.destination,
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nextLabel: {
    ...type.overline,
  },
  nextText: {
    ...type.bodyMedium,
    flexShrink: 1,
  },
  note: {
    ...type.caption,
    color: colors.textTertiary,
    marginTop: -spacing.xs,
  },
});
