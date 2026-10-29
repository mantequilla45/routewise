import { colors, radius, spacing, type } from '@/theme';
import type { PlaceLabel } from './usePlaceLabel';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function PointRow({
  placeholder,
  place,
  onPress,
}: Readonly<{ placeholder: string; place: PlaceLabel | null; onPress: () => void }>) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={place ? `${placeholder}: ${place.title}` : placeholder}
    >
      <View style={styles.rowText}>
        <Text style={place ? type.bodyMedium : styles.placeholder} numberOfLines={1}>
          {place ? place.title : placeholder}
        </Text>
        {!!place?.subtitle && (
          <Text style={type.caption} numberOfLines={1}>
            {place.subtitle}
          </Text>
        )}
      </View>
      <Ionicons name="search" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

/** "From" and "To" fields joined by a route connector; tapping one changes that point. */
export default function PointPicker({
  start,
  destination,
  onSelectPointA,
  onSelectPointB,
}: Readonly<{
  /** Name (and area) of each point; null shows the placeholder. */
  start: PlaceLabel | null;
  destination: PlaceLabel | null;
  onSelectPointA: () => void;
  onSelectPointB: () => void;
}>) {
  return (
    <View style={styles.container}>
      <View style={styles.connector}>
        <View style={styles.originDot} />
        <View style={styles.connectorLine} />
        <Ionicons name="location-sharp" size={16} color={colors.destination} />
      </View>
      <View style={styles.fields}>
        <PointRow placeholder="Choose starting point" place={start} onPress={onSelectPointA} />
        <View style={styles.divider} />
        <PointRow placeholder="Choose destination" place={destination} onPress={onSelectPointB} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
  },
  connector: {
    width: 16,
    alignItems: 'center',
    paddingVertical: 22,
    gap: spacing.xs,
  },
  originDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2.5,
    borderColor: colors.origin,
    backgroundColor: colors.background,
  },
  connectorLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: colors.textTertiary,
    opacity: 0.5,
  },
  fields: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowPressed: {
    backgroundColor: colors.surfacePressed,
  },
  rowText: {
    flex: 1,
    gap: spacing.xxs,
  },
  placeholder: {
    ...type.body,
    color: colors.textTertiary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginRight: spacing.md,
    marginLeft: spacing.md,
  },
});
