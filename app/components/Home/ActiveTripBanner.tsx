import { motion } from '@/lib/motion';
import { stopTrip, useActiveTrip } from '@/lib/tripTracking/tracker';
import { colors, elevation, fonts, radius, spacing, type } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

/**
 * Shown just above the tab bar, on every tab, while a trip is being tracked (after going back
 * from the map, or reopening the app mid-ride): tap to return to the journey, or end it.
 * Renders nothing otherwise.
 */
// Same question as ending from the trip map
const confirmEnd = () =>
  Alert.alert('End this trip?', "You won't get an alert before your stop.", [
    { text: 'Keep going', style: 'cancel' },
    { text: 'End trip', style: 'destructive', onPress: () => stopTrip() },
  ]);

export default function ActiveTripBanner() {
  const activeTrip = useActiveTrip();
  const router = useRouter();
  if (!activeTrip) return null;

  return (
    <Animated.View entering={motion.enter} exiting={motion.exit}>
      <Pressable
        onPress={() => router.push('/trip')}
        style={({ pressed }) => [styles.banner, pressed && styles.bannerPressed]}
        accessibilityRole="button"
        accessibilityHint="Opens your journey on the map"
      >
        <View style={styles.icon}>
          <Ionicons name="navigate" size={16} color={colors.textOnAccent} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>Trip in progress</Text>
          <Text style={styles.caption} numberOfLines={1}>
            {activeTrip.trip.legs.map((leg) => leg.routeCode).join(' › ')}
          </Text>
        </View>
        <Pressable
          onPress={confirmEnd}
          style={({ pressed }) => [styles.end, pressed && styles.endPressed]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="End trip"
        >
          <Text style={styles.endText}>End</Text>
        </Pressable>
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
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: radius.lg,
    // Dark on the white screens and tab bar so it stands out, the yellow icon marking it live
    backgroundColor: colors.text,
    ...elevation.floating,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerPressed: {
    opacity: 0.85,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textOnDark,
  },
  caption: {
    ...type.caption,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  end: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
  endText: {
    ...type.bodyMedium,
    color: colors.textOnDark,
  },
});
