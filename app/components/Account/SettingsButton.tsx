import { colors, radius, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Round gear at the top right of the Account tab, signed in or out; opens Settings. */
export default function SettingsButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={() => router.push('/settings')}
      style={({ pressed }) => [
        styles.button,
        { top: insets.top + spacing.sm },
        pressed && styles.pressed,
      ]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Settings"
    >
      <Ionicons name="settings-outline" size={20} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
});
