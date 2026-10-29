import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, type, ui } from '@/theme';

type Props = {
  label: string;
  onPress?: () => void;
  theme?: 'primary' | 'secondary' | 'tags';
};

export default function Button({ label, onPress, theme }: Props) {
  if (theme === 'primary' || theme === 'secondary') {
    const isPrimary = theme === 'primary';
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          isPrimary ? ui.primaryButton : ui.secondaryButton,
          styles.block,
          pressed && (isPrimary ? styles.primaryPressed : styles.secondaryPressed),
        ]}
      >
        <Text style={isPrimary ? ui.primaryButtonText : ui.secondaryButtonText}>{label}</Text>
      </Pressable>
    );
  } else if (theme === 'tags') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
      >
        <Text style={type.label}>{label}</Text>
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  block: {
    width: 240,
    paddingHorizontal: spacing.xl,
  },
  primaryPressed: {
    backgroundColor: colors.accentPressed,
  },
  secondaryPressed: {
    backgroundColor: colors.surfacePressed,
  },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  chipPressed: {
    backgroundColor: colors.surfacePressed,
  },
});
