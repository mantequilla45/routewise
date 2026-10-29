import { legColor } from '@/components/Map/LocationSelector/buildPolylines';
import { lineLength, metersBetween } from '@/lib/tripTracking/progress';
import type { ActiveTrip } from '@/lib/tripTracking/tracker';
import { colors, elevation, fonts, radius, spacing, type, ui } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Fragment, type ReactNode, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The dark fade under the instruction: clear over the map, near-black (the text color) below.
const FADE_CLEAR = 'rgba(17, 19, 23, 0)';
const FADE_SOLID = 'rgba(17, 19, 23, 0.92)';

const SHEET_IN = SlideInDown.duration(280).easing(Easing.out(Easing.cubic));

const formatDistance = (m: number) =>
  m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.max(10, Math.round(m / 10) * 10)} m`;

/** A line of text where some parts are bold. */
type Rich = (string | { bold: string })[];
const b = (bold: string) => ({ bold });

interface Now {
  index: number; // into the trip's steps
  title: Rich;
  soon: boolean;
  done: number | null; // ride progress 0..1, null when walking
  color: string;
}

/**
 * The trip as steps (walk, ride, transfer walk, ride, ..., walk) and the one the rider is on.
 * Off a jeep, its "get off" alert tells before from after: not yet alerted means still heading
 * to board it, alerted means they got off and are walking on.
 */
function now({ trip, progress, position, destination }: ActiveTrip): Now {
  const legs = trip.legs;
  const i = progress.legIndex;

  if (progress.remaining !== null) {
    const soon = progress.alerted[i];
    const left = formatDistance(progress.remaining);
    return {
      index: 2 * i + 1,
      title: soon
        ? [b('Get off soon'), ` · about ${left}`]
        : ['Ride ', b(legs[i].routeCode), ' · ', b(left), ' to your stop'],
      soon,
      done: Math.min(
        1,
        Math.max(0, 1 - progress.remaining / (lineLength(legs[i].coordinates) || 1)),
      ),
      color: legColor(i),
    };
  }

  const gotOff = progress.alerted[i];
  if (gotOff && !legs[i + 1]) {
    const away = position ? ` · ${formatDistance(metersBetween(position, destination))}` : '';
    return {
      index: legs.length * 2,
      title: ['Walk to your ', b('destination'), away],
      soon: false,
      done: null,
      color: colors.textSecondary,
    };
  }
  const boarding = gotOff ? i + 1 : i;
  return {
    index: 2 * boarding,
    title: ['Walk to the ', b(legs[boarding].routeCode), ' stop'],
    soon: false,
    done: null,
    color: colors.textSecondary,
  };
}

// Pace the planner assumes (backend routing/planner.ts), for per-step minutes.
const WALK_M_PER_MIN = 83;
const JEEP_M_PER_MIN = 250;
const minutes = (m: number, perMin: number) => Math.max(1, Math.round(m / perMin));

interface TimelineStep {
  kind: 'walk' | 'ride';
  title: string;
  detail: string;
  fare?: number;
  color: string; // the node and the line below it
}

/** Every step of the trip for the details timeline. */
function allSteps({ trip }: ActiveTrip): TimelineStep[] {
  const walkStep = (title: string, m: number, none: string): TimelineStep => ({
    kind: 'walk',
    title,
    detail: m > 0 ? `${formatDistance(m)} · ${minutes(m, WALK_M_PER_MIN)} min walk` : none,
    color: colors.border,
  });
  const steps: TimelineStep[] = [];
  trip.legs.forEach((leg, i) => {
    const walk = i === 0 ? trip.boardingWalk : trip.transferWalks[i - 1];
    steps.push(walkStep(`Walk to the ${leg.routeCode} stop`, walk, 'Right where you are'));
    steps.push({
      kind: 'ride',
      title: `Ride ${leg.routeCode}`,
      detail: `${formatDistance(leg.distance)} · about ${minutes(leg.distance, JEEP_M_PER_MIN)} min`,
      fare: leg.fare,
      color: legColor(i),
    });
  });
  steps.push(walkStep('Walk to your destination', trip.alightingWalk, 'Right at the drop-off'));
  return steps;
}

/** One stop on the timeline: a ride is a bus in its jeep's color, a walk a small dot. */
function Node({ step, state }: Readonly<{ step: TimelineStep; state: StepState }>) {
  if (step.kind === 'ride') {
    return (
      <View style={[styles.rideNode, { backgroundColor: step.color }]}>
        <Ionicons
          name={state === 'done' ? 'checkmark' : 'bus'}
          size={14}
          color={colors.textOnDark}
        />
      </View>
    );
  }
  return (
    <View style={styles.nodeBox}>
      <View
        style={[
          styles.walkNode,
          state === 'done' && styles.walkNodeDone,
          state === 'now' && styles.walkNodeNow,
        ]}
      />
    </View>
  );
}

type StepState = 'done' | 'now' | 'next';

function RichText({ parts, soon }: Readonly<{ parts: Rich; soon: boolean }>) {
  return (
    <Text style={styles.instruction} numberOfLines={2}>
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          part
        ) : (
          <Text key={i} style={[styles.bold, soon && styles.soon]}>
            {part.bold}
          </Text>
        ),
      )}
    </Text>
  );
}

/**
 * While a trip is tracked: just the instruction for right now, on a dark fade at the bottom of
 * the map (key words in bold, red when it's time to get off). Tapping it pops up a sheet with the jeeps, every step,
 * fares, totals and End trip.
 */
export default function TripProgressBar({
  activeTrip,
  onEnd,
  controls,
}: Readonly<{
  activeTrip: ActiveTrip;
  onEnd: () => void;
  /** Map buttons (save, locate) to stack right above the details arrow, in one column. */
  controls?: ReactNode;
}>) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { trip } = activeTrip;
  const current = now(activeTrip);
  const steps = allSteps(activeTrip);

  return (
    <>
      {/* Full-width dark fade from the map, reaching the screen's bottom edge */}
      <View
        style={[
          styles.fade,
          {
            marginBottom: -(insets.bottom + spacing.sm),
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        <View style={styles.row} pointerEvents="box-none">
          <Pressable
            onPress={() => setOpen(true)}
            style={styles.instructionButton}
            accessibilityRole="button"
            accessibilityHint="Shows the trip details"
          >
            <RichText parts={current.title} soon={current.soon} />
          </Pressable>
          <View style={styles.column} pointerEvents="box-none">
            {controls}
            <Pressable
              onPress={() => setOpen(true)}
              style={({ pressed }) => [styles.round, pressed && styles.roundPressed]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Trip details"
            >
              <Ionicons name="chevron-up" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* The backdrop fades in place; only the sheet slides up */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          {/* Full-screen behind the sheet, so it also dims around the sheet's rounded corners */}
          <Pressable
            style={styles.scrim}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close"
          />
          <Animated.View
            entering={SHEET_IN}
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}
          >
            <View style={ui.handle} />

            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.total}>{trip.estimatedMinutes} min</Text>
                <Text style={type.caption}>
                  <Text style={styles.strong}>₱{trip.fare}</Text> fare ·{' '}
                  {trip.legs.length === 1 ? '1 jeep' : `${trip.legs.length} jeeps`}
                </Text>
              </View>
              <View style={styles.pills}>
                {trip.legs.map((leg, i) => (
                  <Fragment key={`${leg.routeId}-${i}`}>
                    {i > 0 && (
                      <Ionicons name="chevron-forward" size={12} color={colors.textTertiary} />
                    )}
                    <View style={styles.pill}>
                      <View style={[styles.dot, { backgroundColor: legColor(i) }]} />
                      <Text style={styles.pillText}>{leg.routeCode}</Text>
                    </View>
                  </Fragment>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            <View>
              {steps.map((step, i) => {
                const state: StepState =
                  i < current.index ? 'done' : i === current.index ? 'now' : 'next';
                const last = i === steps.length - 1;
                return (
                  <View key={i} style={styles.tlRow}>
                    <View style={styles.rail}>
                      <Node step={step} state={state} />
                      {!last && (
                        <View
                          style={[
                            styles.line,
                            step.kind === 'ride' ? styles.rideLine : styles.walkLine,
                            { backgroundColor: step.color },
                          ]}
                        />
                      )}
                    </View>
                    <View style={[styles.tlBody, !last && styles.tlBodySpaced]}>
                      <View style={styles.tlTitleRow}>
                        <Text
                          style={[
                            styles.stepTitle,
                            state === 'now' && styles.stepNow,
                            state === 'done' && styles.stepDone,
                          ]}
                          numberOfLines={1}
                        >
                          {step.title}
                        </Text>
                        {state === 'now' && (
                          <View style={styles.nowBadge}>
                            <Text style={styles.nowText}>NOW</Text>
                          </View>
                        )}
                        {step.fare !== undefined && (
                          <Text style={[styles.fare, state === 'done' && styles.stepDone]}>
                            ₱{step.fare}
                          </Text>
                        )}
                      </View>
                      <Text style={type.caption}>{step.detail}</Text>
                      {state === 'now' && current.done !== null && (
                        <View style={styles.track}>
                          <View
                            style={[
                              styles.fill,
                              { width: `${current.done * 100}%`, backgroundColor: step.color },
                            ]}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {!activeTrip.background && (
              <Text style={styles.note}>
                Keep RouteWise open to get the alert before your stop.
              </Text>
            )}

            <Pressable
              onPress={() => {
                setOpen(false);
                onEnd();
              }}
              style={({ pressed }) => [ui.secondaryButton, pressed && styles.endPressed]}
              accessibilityRole="button"
            >
              <Text style={[ui.secondaryButtonText, styles.endText]}>End trip</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Bleeds past the bottom stack's side margins and bottom offset to the screen edges
  fade: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundImage: `linear-gradient(to bottom, ${FADE_CLEAR} 0%, ${FADE_SOLID} 60%)`,
  },
  // Same 44pt white circle as the save and locate buttons above
  round: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.floating,
  },
  // Instruction at the bottom left, level with the arrow; buttons in one column on the right
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  instructionButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  column: {
    gap: spacing.sm,
  },
  roundPressed: {
    backgroundColor: colors.surface,
  },
  instruction: {
    fontFamily: fonts.regular,
    fontSize: 19,
    lineHeight: 25,
    color: colors.textOnDark,
  },
  bold: {
    fontFamily: fonts.bold,
  },
  soon: {
    color: colors.destination,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scrim,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: {
    gap: spacing.xxs,
  },
  total: {
    ...type.title,
  },
  strong: {
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  pills: {
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
  },
  pillText: {
    ...type.badge,
    fontSize: 13,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  // Timeline: a rail of nodes and lines on the left, the step on the right
  tlRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rail: {
    width: 28,
    alignItems: 'center',
  },
  line: {
    flex: 1,
    marginVertical: 3,
    borderRadius: radius.pill,
  },
  rideLine: {
    width: 4,
  },
  walkLine: {
    width: 2,
  },
  nodeBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkNode: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    backgroundColor: colors.background,
  },
  walkNodeDone: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  walkNodeNow: {
    width: 14,
    height: 14,
    borderWidth: 4,
    borderColor: colors.text,
  },
  rideNode: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlBody: {
    flex: 1,
    gap: spacing.xxs,
    paddingTop: 4,
  },
  tlBodySpaced: {
    paddingBottom: spacing.lg,
  },
  tlTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepTitle: {
    ...type.bodyMedium,
    flexShrink: 1,
  },
  stepNow: {
    fontFamily: fonts.semibold,
  },
  stepDone: {
    color: colors.textTertiary,
  },
  nowBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm - 4,
    backgroundColor: colors.accent,
  },
  nowText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.textOnAccent,
  },
  fare: {
    ...type.bodyMedium,
    marginLeft: 'auto',
  },
  track: {
    height: 4,
    marginTop: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  note: {
    ...type.caption,
    color: colors.textTertiary,
  },
  endPressed: {
    backgroundColor: colors.surfacePressed,
  },
  endText: {
    color: colors.danger,
  },
});
