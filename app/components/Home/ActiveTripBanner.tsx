import { motion } from '@/lib/motion';
import { stopTrip, useActiveTrip } from '@/lib/tripTracking/tracker';
import { colors, fonts, radius, spacing, type } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

/**
 * Shown on Home while a trip is still being tracked (e.g. the app was closed mid-ride and
 * reopened): which trip, and a way to end it. Renders nothing otherwise.
 */
export default function ActiveTripBanner() {
  const activeTrip = useActiveTrip();
  if (!activeTrip) return null;

  return (
    <Animated.View entering={motion.enter} exiting={motion.exit} style={styles.banner}>
      <Ionicons name="navigate" size={18} color={colors.textOnAccent} />
      <View style={styles.text}>
        <Text style={styles.title}>Trip in progress</Text>
        <Text style={styles.caption} numberOfLines={1}>
          {activeTrip.trip.legs.map((leg) => leg.routeCode).join(' › ')} · alerts on
        </Text>
      </View>
      <Pressable
        onPress={() => stopTrip()}
        style={({ pressed }) => [styles.end, pressed && styles.endPressed]}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="End trip"
      >
        <Text style={styles.endText}>End</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSubtle,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  caption: {
    ...type.caption,
  },
  end: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endPressed: {
    backgroundColor: colors.surface,
  },
  endText: {
    ...type.bodyMedium,
  },
});
