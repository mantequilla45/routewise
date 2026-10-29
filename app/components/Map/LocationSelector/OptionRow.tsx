import { colors, radius, spacing, type } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** A tappable option in the trip sheet: tinted icon, label, and a chevron or spinner. */
export default function OptionRow({
  icon,
  iconColor,
  label,
  onPress,
  loading = false,
}: Readonly<{
  icon: IconName;
  iconColor: string;
  label: string;
  onPress: () => void;
  loading?: boolean;
}>) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
    >
      <View style={styles.icon}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[type.bodyMedium, styles.label]}>{label}</Text>
      {loading ? (
        <ActivityIndicator size="small" color={colors.textSecondary} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
  },
});
