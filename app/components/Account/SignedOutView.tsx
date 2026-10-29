import LoginModal from '@/components/LoginModal';
import { colors, radius, spacing, type, ui } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = ComponentProps<typeof Ionicons>['name'];

const BENEFITS: { icon: IconName; title: string; detail: string }[] = [
  {
    icon: 'bookmark-outline',
    title: 'Save your routes',
    detail: 'Keep the trips you take often in one place.',
  },
  {
    icon: 'phone-portrait-outline',
    title: 'On any device',
    detail: 'Your saved routes follow your account.',
  },
  {
    icon: 'person-outline',
    title: 'Your commuter type',
    detail: 'Keep Student, Senior or PWD on your profile.',
  },
];

/** Account tab when signed out: what an account adds, then sign up or log in. */
export default function SignedOutView() {
  const insets = useSafeAreaInsets();
  const [modalTab, setModalTab] = useState<'login' | 'signup' | null>(null);

  return (
    <View style={[ui.screen, styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={type.title}>Account</Text>

      <View style={styles.intro}>
        <Text style={type.heading}>Get more out of RouteWise</Text>
        <Text style={type.caption}>Planning trips works without an account. Sign in to:</Text>
      </View>

      <View style={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <View key={benefit.title} style={styles.benefit}>
            <View style={styles.benefitIcon}>
              <Ionicons name={benefit.icon} size={18} color={colors.text} />
            </View>
            <View style={styles.benefitText}>
              <Text style={type.bodyMedium}>{benefit.title}</Text>
              <Text style={type.caption}>{benefit.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => setModalTab('signup')}
          style={({ pressed }) => [ui.primaryButton, pressed && styles.primaryPressed]}
          accessibilityRole="button"
        >
          <Text style={ui.primaryButtonText}>Create account</Text>
        </Pressable>
        <Pressable
          onPress={() => setModalTab('login')}
          style={({ pressed }) => [ui.secondaryButton, pressed && styles.secondaryPressed]}
          accessibilityRole="button"
        >
          <Text style={ui.secondaryButtonText}>Log in</Text>
        </Pressable>
      </View>

      <LoginModal
        isVisible={modalTab !== null}
        initialTab={modalTab ?? 'login'}
        onClose={() => setModalTab(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
  },
  intro: {
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  benefits: {
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    gap: spacing.xxs,
  },
  // Buttons sit at the bottom, within thumb reach
  actions: {
    marginTop: 'auto',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  primaryPressed: {
    backgroundColor: colors.accentPressed,
  },
  secondaryPressed: {
    backgroundColor: colors.surfacePressed,
  },
});
