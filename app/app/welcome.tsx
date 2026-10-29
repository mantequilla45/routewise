import { LOGO } from '@/constants';
import { useOnboarding } from '@/context/onboarding';
import { colors, fonts, radius, spacing, type, ui } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = ComponentProps<typeof Ionicons>['name'];

const FEATURES: { icon: IconName; title: string; detail: string }[] = [
  {
    icon: 'search',
    title: 'Search any place',
    detail: 'Type where you are and where you want to go.',
  },
  {
    icon: 'git-compare-outline',
    title: 'Get the right jeeps',
    detail: 'Direct rides and transfers, fastest first.',
  },
  {
    icon: 'cash-outline',
    title: 'Know the fare',
    detail: 'See what each jeep costs before you ride.',
  },
];

/** First-launch welcome. Shown once; finishing it unlocks the tabs (see app/_layout.tsx). */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeWelcome } = useOnboarding();

  const getStarted = () => completeWelcome();

  const logIn = () => {
    completeWelcome();
    // Wait a tick for the tabs to become available, then open Account
    setTimeout(() => router.replace('/account'), 0);
  };

  return (
    <View
      style={[
        ui.screen,
        styles.container,
        { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      <Image source={LOGO} style={styles.logo} contentFit="contain" />

      <View style={styles.hero}>
        <Text style={styles.headline}>Find your jeep.</Text>
        <Text style={[type.body, styles.subhead]}>
          Routes, transfers and fares for jeepneys in Cebu, in one search.
        </Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((feature) => (
          <View key={feature.title} style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name={feature.icon} size={18} color={colors.text} />
            </View>
            <View style={styles.featureText}>
              <Text style={type.bodyMedium}>{feature.title}</Text>
              <Text style={type.caption}>{feature.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={getStarted}
          style={({ pressed }) => [ui.primaryButton, pressed && styles.primaryPressed]}
          accessibilityRole="button"
        >
          <Text style={ui.primaryButtonText}>Get started</Text>
        </Pressable>
        <Pressable onPress={logIn} hitSlop={8} style={styles.logIn} accessibilityRole="button">
          <Text style={type.caption}>
            Have an account? <Text style={styles.logInLink}>Log in</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
  },
  logo: {
    width: 160,
    height: 40,
  },
  hero: {
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 40,
    color: colors.text,
  },
  subhead: {
    color: colors.textSecondary,
  },
  features: {
    marginTop: spacing.xxl,
    gap: spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: spacing.xxs,
  },
  // Pinned to the bottom, within thumb reach
  actions: {
    marginTop: 'auto',
    gap: spacing.md,
  },
  primaryPressed: {
    backgroundColor: colors.accentPressed,
  },
  logIn: {
    alignSelf: 'center',
  },
  logInLink: {
    fontFamily: fonts.medium,
    color: colors.text,
  },
});
