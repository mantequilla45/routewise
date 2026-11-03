import {
  setShowPassingPlaces,
  useShowPassingPlaces,
} from '@/lib/tripTracking/passingPlacesSetting';
import { colors, radius, spacing, type, ui } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** App settings, opened from the Account tab. Kept on this device. */
export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showPassingPlaces = useShowPassingPlaces();

  return (
    <ScrollView
      style={ui.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <Text style={[type.title, styles.title]}>Settings</Text>

      <Text style={[type.overline, styles.groupLabel]}>During a trip</Text>
      <View style={styles.group}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={type.body}>Show places you pass</Text>
            <Text style={type.caption}>
              Pops up well-known places along the way and lists them in the trip details.
            </Text>
          </View>
          <Switch
            value={showPassingPlaces}
            onValueChange={setShowPassingPlaces}
            trackColor={{ true: colors.accent }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  back: {
    width: 40,
    height: 40,
    marginLeft: -spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    backgroundColor: colors.surface,
  },
  title: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  groupLabel: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  // Same inset group as the Account settings
  group: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: spacing.xxs,
  },
});
