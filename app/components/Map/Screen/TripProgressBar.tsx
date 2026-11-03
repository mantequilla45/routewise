import { legColor } from '@/components/Map/LocationSelector/buildPolylines';
import { lineLength, metersBetween, projectOnLine } from '@/lib/tripTracking/progress';
import type { PopularPlace } from '@/lib/api';
import type { ActiveTrip } from '@/lib/tripTracking/tracker';
import { colors, elevation, fonts, radius, spacing, type, ui } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Fragment, type ReactNode, useEffect, useEffectEvent, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import usePopularPlaces from '@/components/Home/usePopularPlaces';
import {
  hidePassingPlacesForTrip,
  setShowPassingPlaces,
  usePassingPlacesShownFor,
} from '@/lib/tripTracking/passingPlacesSetting';
import BottomSheet from '@/components/BottomSheet';
import LiveDot from '@/components/Map/Screen/LiveDot';
import { logTripEvent } from '@/lib/tripTracking/tripLog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The dark fade under the instruction: clear over the map, near-black (the text color) below.
const FADE_CLEAR = 'rgba(17, 19, 23, 0)';
const FADE_SOLID = 'rgba(17, 19, 23, 0.92)';

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
  // Reached the jeep's route but not riding yet: waiting at the roadside
  const waiting = !gotOff && progress.onLineFrom !== null;
  const stop = legs[boarding].boardAt;
  const toStop = position && stop ? ` · ${formatDistance(metersBetween(position, stop))}` : '';
  return {
    index: 2 * boarding,
    title: waiting
      ? ['Wait for ', b(legs[boarding].routeCode), ' here']
      : ['Walk to the ', b(legs[boarding].routeCode), ' stop', toStop],
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

/** Minutes since `startedAt`, refreshed every 15 seconds. */
function useElapsedMinutes(startedAt: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);
  return Math.max(0, Math.floor((now - startedAt) / 60_000));
}

const elapsedLabel = (minutes: number) =>
  minutes < 1
    ? 'Just started'
    : minutes < 60
      ? `${minutes} min elapsed`
      : `${Math.floor(minutes / 60)} h ${minutes % 60} min elapsed`;

function RichText({
  parts,
  soon,
  small = false,
}: Readonly<{ parts: Rich; soon: boolean; small?: boolean }>) {
  return (
    <Text style={small ? styles.logText : styles.instruction} numberOfLines={small ? 1 : 2}>
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

type Landmark = { placeId: string; name: string; along: number };

/**
 * Per ride, the popular places it passes: within PASSING_RADIUS_M of the jeep's line, in the
 * order the jeep reaches them, with how far along the ride each is. A place near a transfer
 * shows only under the first jeep that reaches it.
 */
function landmarksByLeg(trip: ActiveTrip['trip'], popular: PopularPlace[] | null): Landmark[][] {
  const listed = new Set<string>();
  return trip.legs.map((leg) => {
    if (!popular) return [];
    const onLeg = popular
      .filter((p) => !listed.has(p.placeId))
      .map((p) => ({ place: p, at: projectOnLine(leg.coordinates, p.location) }))
      .filter(({ at }) => at.away <= PASSING_RADIUS_M)
      .sort((x, y) => x.at.along - y.at.along)
      .map(({ place, at }) => ({ placeId: place.placeId, name: place.name, along: at.along }));
    onLeg.forEach((l) => listed.add(l.placeId));
    return onLeg;
  });
}

/** The "⋯" on the place pop-ups: hide them for this trip, or turn them off altogether. */
const placePopupOptions = (tripStartedAt: number) =>
  Alert.alert('Places you pass', undefined, [
    { text: 'Hide for this trip', onPress: () => hidePassingPlacesForTrip(tripStartedAt) },
    {
      text: 'Turn off for all trips',
      style: 'destructive',
      onPress: () => setShowPassingPlaces(false),
    },
    { text: 'Cancel', style: 'cancel' },
  ]);

// How many earlier statuses stay visible above the current one
const LOG_SIZE = 2;
// Opacity of each earlier status, the latest first: half as visible each step back
const PAST_OPACITY = [0.6, 0.3];
// Riding within this distance of a popular place counts as passing it
const PASSING_RADIUS_M = 150;

type LogEntry = { id: string; parts: Rich; kind: 'status' | 'place' };
const plain = (parts: Rich) => parts.map((p) => (typeof p === 'string' ? p : p.bold)).join('');

// The log of the trip being tracked, kept outside the panel so going back from the map and
// opening the journey again picks it up where it was. One trip at a time, by its start time.
type SavedLog = {
  trip: number;
  history: LogEntry[];
  shown: { key: string; parts: Rich };
  passed: ReadonlySet<string>;
};
let savedLog: SavedLog | null = null;

/**
 * The status log under the map: when the rider's step changes (walking to the stop, riding, get
 * off soon...), the previous status moves up into a short history. Distance updates within a
 * step don't count. Popular places passed while riding are added too, if that's turned on.
 */
function useStatusLog(activeTrip: ActiveTrip, current: Now) {
  const showPassing = usePassingPlacesShownFor(activeTrip.startedAt);
  const popular = usePopularPlaces();
  const currentKey = `${current.index}-${current.soon}`;
  const [saved] = useState(() => (savedLog?.trip === activeTrip.startedAt ? savedLog : null));
  const [history, setHistory] = useState<LogEntry[]>(saved?.history ?? []);
  const [shown, setShown] = useState(saved?.shown ?? { key: currentKey, parts: current.title });
  const [passed, setPassed] = useState<ReadonlySet<string>>(saved?.passed ?? new Set());
  useEffect(() => {
    savedLog = { trip: activeTrip.startedAt, history, shown, passed };
  }, [activeTrip.startedAt, history, shown, passed]);

  // Each place passed goes into the trip's data too, once
  const logged = useRef(passed);
  const logPassed = useEffectEvent(() => {
    for (const placeId of passed) {
      if (logged.current.has(placeId)) continue;
      const place = popular?.find((p) => p.placeId === placeId);
      logTripEvent(activeTrip.id, {
        kind: 'passed_place',
        legIndex: activeTrip.progress.legIndex,
        routeCode: activeTrip.trip.legs[activeTrip.progress.legIndex]?.routeCode,
        placeId,
        placeName: place?.name,
        position: activeTrip.position,
        speed: activeTrip.speed,
      });
    }
    logged.current = passed;
  });
  useEffect(() => logPassed(), [passed]);

  // A new step: the last shown version of the previous status moves into the history.
  // Within a step, keep the latest text (distances) for when it does move up.
  if (shown.key !== currentKey) {
    const moved: LogEntry = {
      id: `step-${shown.key}`, // steps only move forward, so each key occurs once
      parts: shown.parts,
      kind: 'status',
    };
    setHistory((h) => [...h, moved].slice(-LOG_SIZE));
    setShown({ key: currentKey, parts: current.title });
  } else if (plain(shown.parts) !== plain(current.title)) {
    setShown({ key: currentKey, parts: current.title });
  }

  // Passing a popular place while riding (once per place per trip)
  const position = activeTrip.position;
  if (showPassing && position && activeTrip.progress.remaining !== null && popular) {
    const near = popular.find(
      (p) => !passed.has(p.placeId) && metersBetween(position, p.location) <= PASSING_RADIUS_M,
    );
    if (near) {
      setPassed(new Set([...passed, near.placeId]));
      const entry: LogEntry = {
        id: `place-${near.placeId}`,
        parts: ['Passing ', b(near.name)],
        kind: 'place',
      };
      setHistory((h) => [...h, entry].slice(-LOG_SIZE));
    }
  }

  // Hidden (for this trip or for good): place entries leave the log too
  const visible = showPassing ? history : history.filter((e) => e.kind !== 'place');
  return { history: visible, currentKey, hasPlaces: visible.some((e) => e.kind === 'place') };
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
  onRecenter,
}: Readonly<{
  activeTrip: ActiveTrip;
  onEnd: () => void;
  /** Map buttons (save, locate) to stack right above the details arrow, in one column. */
  controls?: ReactNode;
  /** Present while the map isn't following the rider: shows a "Re-center" button. */
  onRecenter?: () => void;
}>) {
  const [open, setOpen] = useState(false);

  const openDetails = () => setOpen(true);
  const insets = useSafeAreaInsets();
  const { trip } = activeTrip;
  const current = now(activeTrip);
  const log = useStatusLog(activeTrip, current);
  const elapsed = useElapsedMinutes(activeTrip.startedAt);
  const showPassingPlaces = usePassingPlacesShownFor(activeTrip.startedAt);
  const popular = usePopularPlaces();
  const landmarks = landmarksByLeg(trip, popular);
  const steps = allSteps(activeTrip);
  // From the GPS, so free; hidden until a fix has a speed
  const speedKmh =
    activeTrip.position && activeTrip.speed != null ? Math.round(activeTrip.speed * 3.6) : null;

  return (
    <>
      {/* Full-width dark fade from the map, reaching the screen's bottom edge. Touches pass
          through it to the map; only the instruction and the buttons take them. */}
      <View
        pointerEvents="box-none"
        style={[
          styles.fade,
          {
            marginBottom: -(insets.bottom + spacing.sm),
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        <View style={styles.row} pointerEvents="box-none">
          <View style={styles.instructionSlot} pointerEvents="box-none">
            {onRecenter && (
              <Animated.View
                entering={FadeIn.duration(160)}
                exiting={FadeOut.duration(120)}
                style={styles.recenterSlot}
              >
                <Pressable
                  onPress={onRecenter}
                  style={({ pressed }) => [styles.recenter, pressed && styles.roundPressed]}
                  accessibilityRole="button"
                  accessibilityHint="Follows you again, facing the way ahead"
                >
                  <Ionicons name="navigate" size={16} color={colors.text} />
                  <Text style={styles.recenterText}>Re-center</Text>
                </Pressable>
              </Animated.View>
            )}

            {/* Options for the place pop-ups, above them */}
            {log.hasPlaces && (
              <Pressable
                onPress={() => placePopupOptions(activeTrip.startedAt)}
                style={({ pressed }) => [styles.dots, pressed && styles.dotsPressed]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Place pop-up options"
              >
                <Ionicons name="ellipsis-horizontal" size={16} color={colors.textOnDark} />
              </Pressable>
            )}

            {/* Earlier statuses, newest last: smaller, and fainter the older they are. The fade is
                on an inner view: the entering animation ends at full opacity on its own view. */}
            {log.history.map((entry, i) => (
              <Animated.View
                key={entry.id}
                entering={FadeInDown.duration(220)}
                exiting={FadeOut.duration(160)}
                layout={LinearTransition.duration(220)}
                style={styles.logEntry}
                pointerEvents="none"
              >
                <View
                  style={[styles.logRow, { opacity: PAST_OPACITY[log.history.length - 1 - i] }]}
                >
                  {entry.kind === 'place' && (
                    <Ionicons name="storefront-outline" size={12} color={colors.textOnDark} />
                  )}
                  <RichText parts={entry.parts} soon={false} small />
                </View>
              </Animated.View>
            ))}

            <Animated.View
              key={log.currentKey}
              entering={FadeInDown.duration(220)}
              layout={LinearTransition.duration(220)}
            >
              <Pressable
                onPress={openDetails}
                style={styles.instructionButton}
                accessibilityRole="button"
                accessibilityHint="Shows the trip details"
              >
                <RichText parts={current.title} soon={current.soon} />
                {/* Live once GPS has a fix; the instruction and distances update with it */}
                <View style={styles.status}>
                  <LiveDot live={!!activeTrip.position} />
                  <Text style={styles.elapsed}>
                    {activeTrip.position ? 'Live' : 'Locating…'} · {elapsedLabel(elapsed)}
                  </Text>
                </View>
                {/* Riding: how far along this jeep's ride you are, in its line color */}
                {current.done !== null && (
                  <View style={styles.rideTrack}>
                    <View
                      style={[
                        styles.fill,
                        { width: `${current.done * 100}%`, backgroundColor: current.color },
                      ]}
                    />
                  </View>
                )}
              </Pressable>
            </Animated.View>
          </View>
          <View style={styles.column} pointerEvents="box-none">
            {/* Current speed, like a car's navigation, at the top of the map buttons */}
            {speedKmh !== null && (
              <View
                style={styles.speed}
                accessible
                accessibilityLabel={`${speedKmh} kilometers per hour`}
              >
                <Text style={styles.speedValue}>{speedKmh}</Text>
                <Text style={styles.speedUnit}>km/h</Text>
              </View>
            )}
            {controls}
            <Pressable
              onPress={openDetails}
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

      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <View style={styles.details}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.total}>{trip.estimatedMinutes} min</Text>
              <Text style={type.caption}>
                <Text style={styles.strong}>₱{trip.fare}</Text> fare ·{' '}
                {trip.legs.length === 1 ? '1 jeep' : `${trip.legs.length} jeeps`} ·{' '}
                {elapsedLabel(elapsed)}
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
                    {/* The popular places this ride passes, in order; ticked once passed */}
                    {step.kind === 'ride' &&
                      showPassingPlaces &&
                      (landmarks[(i - 1) / 2] ?? []).map((place) => {
                        const legIndex = (i - 1) / 2;
                        const passed =
                          legIndex < activeTrip.progress.legIndex ||
                          (legIndex === activeTrip.progress.legIndex &&
                            activeTrip.progress.along !== null &&
                            activeTrip.progress.along >= place.along);
                        // Riding this jeep and not there yet: how far to go
                        const toGo =
                          !passed &&
                          legIndex === activeTrip.progress.legIndex &&
                          activeTrip.progress.along !== null
                            ? place.along - activeTrip.progress.along
                            : null;
                        return (
                          <View key={place.placeId}>
                            <View style={styles.landmark}>
                              <Ionicons
                                name={passed ? 'checkmark' : 'storefront-outline'}
                                size={12}
                                color={passed ? colors.success : colors.textSecondary}
                              />
                              <Text
                                style={[styles.landmarkText, passed && styles.stepDone]}
                                numberOfLines={1}
                              >
                                Passes {place.name}
                              </Text>
                              {toGo !== null && (
                                <Text style={styles.landmarkDistance}>{formatDistance(toGo)}</Text>
                              )}
                            </View>
                            {/* How close: from boarding this jeep to the place */}
                            {toGo !== null && (
                              <View style={styles.landmarkTrack}>
                                <View
                                  style={[
                                    styles.fill,
                                    {
                                      width: `${Math.min(100, (100 * (place.along - toGo)) / (place.along || 1))}%`,
                                      backgroundColor: step.color,
                                    },
                                  ]}
                                />
                              </View>
                            )}
                          </View>
                        );
                      })}
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
            <Text style={styles.note}>Keep RouteWise open to get the alert before your stop.</Text>
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
        </View>
      </BottomSheet>
    </>
  );
}

// Space above and below the current status
const STATUS_GAP = spacing.sm;

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
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: STATUS_GAP,
    marginLeft: -4, // the dot's box is wider than the dot: line the dot up with the text above
  },
  elapsed: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  // Takes the row's free width without catching touches, so drags beside the text pan the map
  instructionSlot: {
    flex: 1,
    alignItems: 'flex-start',
  },
  // Only as wide as its text
  instructionButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  column: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  roundPressed: {
    backgroundColor: colors.surface,
  },
  dots: {
    alignSelf: 'flex-end',
    width: 32,
    height: 24,
    marginBottom: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
  // On the dark fade: a light track, the ride's color filling it
  rideTrack: {
    height: 4,
    width: 220,
    maxWidth: '100%',
    marginTop: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  // The status log: earlier statuses above the current one, small and faded, every line the
  // same gap apart (down to the Live line)
  logEntry: {
    marginBottom: STATUS_GAP,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textOnDark,
  },
  recenterSlot: {
    marginBottom: spacing.md,
  },
  speed: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.floating,
  },
  speedValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 20,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  speedUnit: {
    ...type.caption,
    fontSize: 10,
    lineHeight: 12,
    color: colors.textSecondary,
  },
  recenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    ...elevation.floating,
  },
  recenterText: {
    ...type.bodyMedium,
  },
  landmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  landmarkDistance: {
    ...type.caption,
    fontSize: 12,
    marginLeft: 'auto',
    color: colors.textSecondary,
  },
  landmarkTrack: {
    height: 3,
    marginTop: spacing.xs,
    marginLeft: 12 + spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  landmarkText: {
    ...type.caption,
    flexShrink: 1,
    color: colors.textSecondary,
  },
  instruction: {
    fontFamily: fonts.regular,
    fontSize: 23,
    lineHeight: 29,
    color: colors.textOnDark,
  },
  bold: {
    fontFamily: fonts.bold,
  },
  soon: {
    color: colors.destination,
  },
  // The details sheet's content (the sheet itself is the shared BottomSheet)
  details: {
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
