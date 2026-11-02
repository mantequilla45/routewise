import Skeleton from '@/components/Skeleton';
import { colors, hairline, spacing } from '@/theme';
import { type DimensionValue, StyleSheet, View } from 'react-native';

// Name bar widths, varied so they read as a list of real names
const NAME_WIDTHS: DimensionValue[] = [
  '62%',
  '48%',
  '70%',
  '55%',
  '66%',
  '44%',
  '58%',
  '68%',
  '50%',
  '60%',
];

/** Placeholder rows shaped like the route list (code badge, then the name) while it loads. */
export default function RoutesSkeleton() {
  return (
    <View accessibilityLabel="Loading routes" accessibilityRole="progressbar">
      {NAME_WIDTHS.map((width, i) => (
        <View key={i}>
          {i > 0 && <View style={styles.divider} />}
          <View style={styles.row}>
            <Skeleton width={40} height={22} />
            <Skeleton width={width} height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

// Same size as a route row and its divider, so nothing jumps when the list arrives
const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  divider: {
    height: hairline,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
});
