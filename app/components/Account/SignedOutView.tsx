import LoginModal from '@/components/LoginModal';
import { LOGO_ICON } from '@/constants';
import { colors, fonts, radius, spacing, type, ui } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// What an account actually adds today; keep this list honest
const BENEFITS = [
  'Save the routes you ride often',
  'Plan them again from Home in one tap',
  'Keep them on any phone you sign in to',
];

/** Account tab when signed out: why to sign up, in a few lines, then sign up or log in. */
export default function SignedOutView() {
  const insets = useSafeAreaInsets();
  const [modalTab, setModalTab] = useState<'login' | 'signup' | null>(null);

  return (
    <View style={[ui.screen, styles.container, { paddingTop: insets.top + spacing.xxl }]}>
      <Image source={LOGO_ICON} style={styles.logo} contentFit="contain" />

      <View style={styles.hero}>
        <Text style={styles.headline}>Your everyday routes, saved</Text>
        <Text style={styles.lead}>
          Create a free account and the jeeps you ride are always one tap away.
        </Text>
      </View>

      <View style={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <View key={benefit} style={styles.benefit}>
            <View style={styles.check}>
              <Ionicons name="checkmark" size={14} color={colors.textOnAccent} />
            </View>
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>

      {/* Within thumb reach */}
      <View style={styles.actions}>
        <Pressable
          onPress={() => setModalTab('signup')}
          style={({ pressed }) => [ui.primaryButton, pressed && styles.primaryPressed]}
          accessibilityRole="button"
        >
          <Text style={ui.primaryButtonText}>Create free account</Text>
        </Pressable>

        <Pressable
          onPress={() => setModalTab('login')}
          hitSlop={8}
          style={styles.loginRow}
          accessibilityRole="button"
        >
          <Text style={type.caption}>
            Already have an account? <Text style={styles.loginLink}>Log in</Text>
          </Text>
        </Pressable>

        <Text style={styles.note}>You can plan trips without an account.</Text>
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
    paddingHorizontal: spacing.xl,
  },
  logo: {
    width: 48,
    height: 48,
  },
  hero: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 30,
    lineHeight: 36,
    color: colors.text,
  },
  lead: {
    ...type.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  benefits: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    ...type.bodyMedium,
    flex: 1,
  },
  actions: {
    marginTop: 'auto',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  primaryPressed: {
    backgroundColor: colors.accentPressed,
  },
  loginRow: {
    alignItems: 'center',
  },
  loginLink: {
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  note: {
    ...type.caption,
    textAlign: 'center',
    color: colors.textTertiary,
  },
});
