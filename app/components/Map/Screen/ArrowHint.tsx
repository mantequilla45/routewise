import { colors, elevation, radius, spacing, type } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

/**
 * Small tooltip over the map telling the rider to zoom in to see which way the route goes (its
 * arrows only show from about street level). Stays up while `show` is true and the arrows aren't
 * showing yet (`arrowsShown`).
 */
export default function ArrowHint({
  show,
  arrowsShown,
}: Readonly<{ show: boolean; arrowsShown: boolean }>) {
  if (!show || arrowsShown) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.hint}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
    >
      <Ionicons name="navigate-outline" size={14} color={colors.background} />
      <Text style={styles.text}>Zoom in to see which way the jeep goes</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hint: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
    ...elevation.floating,
  },
  text: {
    flexShrink: 1,
    ...type.label,
    color: colors.background,
  },
});
