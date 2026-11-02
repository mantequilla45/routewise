import BottomSheet from '@/components/BottomSheet';
import GoogleSignInButton from '@/components/Auth/GoogleSignInButton';
import { useAuth } from '@/context/auth';
import { colors, fonts, radius, spacing, type } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { PropsWithChildren, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

type Tab = 'login' | 'signup';

const COPY: Record<Tab, { title: string; switchPrompt: string; switchAction: string }> = {
  login: { title: 'Log in', switchPrompt: 'New to RouteWise?', switchAction: 'Sign up' },
  signup: {
    title: 'Create an account',
    switchPrompt: 'Already have an account?',
    switchAction: 'Log in',
  },
};

type Props = PropsWithChildren<{
  isVisible: boolean;
  onClose: () => void;
  /** Log in or sign up, each time the sheet opens. */
  initialTab?: Tab;
}>;

/**
 * Compact sign-in sheet (the shared BottomSheet): Google first, email one tap away, and a text
 * link to switch between logging in and signing up.
 */
export default function LoginModal({ isVisible, onClose, initialTab = 'login' }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [showEmail, setShowEmail] = useState(false);
  // Reset to the requested tab, email folded away, whenever the sheet opens (during render)
  const [wasVisible, setWasVisible] = useState(isVisible);
  if (isVisible !== wasVisible) {
    setWasVisible(isVisible);
    if (isVisible) {
      setActiveTab(initialTab);
      setShowEmail(false);
    }
  }
  const { user, isLoading, signIn } = useAuth();

  // Close once signed in
  useEffect(() => {
    if (user && isVisible) onClose();
  }, [user, isVisible, onClose]);

  const copy = COPY[activeTab];

  return (
    <BottomSheet visible={isVisible} onClose={onClose}>
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.textSecondary} />
          <Text style={type.caption}>Signing in…</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={type.title}>{copy.title}</Text>
            <Text style={type.caption}>Save routes and see them on any device.</Text>
          </View>

          <GoogleSignInButton onPress={signIn} />

          {showEmail ? (
            activeTab === 'login' ? (
              <LoginForm />
            ) : (
              <SignupForm />
            )
          ) : (
            <Pressable
              onPress={() => setShowEmail(true)}
              style={({ pressed }) => [styles.emailButton, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Ionicons name="mail-outline" size={18} color={colors.text} />
              <Text style={styles.emailText}>Continue with email</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}
            hitSlop={8}
            style={styles.switchRow}
            accessibilityRole="button"
          >
            <Text style={type.caption}>
              {copy.switchPrompt} <Text style={styles.switchAction}>{copy.switchAction}</Text>
            </Text>
          </Pressable>

          <Text style={styles.terms}>
            By continuing, you agree to the Terms of Service and Data Processing Agreement.
          </Text>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xxs,
    marginBottom: spacing.xs,
  },
  emailButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  emailText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  switchRow: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  switchAction: {
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  terms: {
    ...type.caption,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    color: colors.textTertiary,
  },
  loading: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
