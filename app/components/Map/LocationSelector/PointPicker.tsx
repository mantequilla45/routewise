import { latLongStringifier } from '@/lib/util/latLngStringifier';
import { colors, radius, spacing, type } from '@/theme';
import { LatLng } from '@/types/GeoTypes';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function PointRow({
  placeholder,
  point,
  onPress,
}: Readonly<{ placeholder: string; point: LatLng | null; onPress: () => void }>) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={point ? `${placeholder}: pinned` : placeholder}
    >
      <View style={styles.rowText}>
        <Text style={point ? type.bodyMedium : styles.placeholder} numberOfLines={1}>
          {point ? 'Pinned on map' : placeholder}
        </Text>
        {point && (
          <Text style={type.caption} numberOfLines={1}>
            {latLongStringifier(point)}
          </Text>
        )}
      </View>
      <Ionicons name="map-outline" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

/** "From" and "To" fields joined by a route connector, each opening pin placement on the map. */
export default function PointPicker({
  pointA,
  pointB,
  onSelectPointA,
  onSelectPointB,
}: Readonly<{
  pointA: LatLng | null;
  pointB: LatLng | null;
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
        <PointRow placeholder="Choose starting point" point={pointA} onPress={onSelectPointA} />
        <View style={styles.divider} />
        <PointRow placeholder="Choose destination" point={pointB} onPress={onSelectPointB} />
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
