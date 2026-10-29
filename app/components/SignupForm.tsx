import { useAuth } from '@/context/auth';
import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { ui } from '@/theme';
import { ApiError } from '@/lib/api';
import { authFormStyles as styles } from '@/components/Auth/authFormStyles';
import { useSavedCredentials } from '@/components/Auth/useSavedCredentials';
import EmailPasswordFields from '@/components/Auth/EmailPasswordFields';
import RememberMeCheckbox from '@/components/Auth/RememberMeCheckbox';
import GoogleSignInButton from '@/components/Auth/GoogleSignInButton';

export default function SignupForm() {
  const { signIn, signUpWithEmail } = useAuth();
  const { email, setEmail, password, setPassword, rememberMe, setRememberMe, persistCredentials } =
    useSavedCredentials();
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Validation', 'Please provide email and password');
      return;
    }

    try {
      setLoading(true);

      const { requiresConfirmation } = await signUpWithEmail(email, password);
      await persistCredentials();

      if (requiresConfirmation) {
        Alert.alert('Check your email', 'We sent a confirmation link. Open it, then log in.');
      }
    } catch (e) {
      console.error('Sign up error:', e);
      // Supabase rate-limits confirmation emails on the free tier
      if (e instanceof ApiError && (e.status === 429 || /rate limit/i.test(e.message))) {
        Alert.alert(
          'Email rate limit exceeded',
          'Too many sign-up emails were sent recently. Wait a few minutes and try again, or configure an SMTP provider in the Supabase dashboard (Authentication → Settings → Email).',
        );
      } else {
        Alert.alert('Sign up failed', e instanceof ApiError ? e.message : 'Unexpected error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <EmailPasswordFields
        email={email}
        onEmailChange={setEmail}
        password={password}
        onPasswordChange={setPassword}
      />

      {/* Remember me + forgot password */}
      <View style={styles.optionsRow}>
        <RememberMeCheckbox checked={rememberMe} onToggle={() => setRememberMe(!rememberMe)} />

        <Pressable
          onPress={() =>
            Alert.alert('Forgot password', 'Use the login screen to reset your password.')
          }
          style={({ pressed }) => pressed && styles.pressed}
          hitSlop={8}
        >
          <Text style={styles.linkText}>Forgot?</Text>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [
          ui.primaryButton,
          pressed && styles.primaryPressed,
          loading && styles.disabled,
        ]}
        onPress={handleSignUp}
        disabled={loading}
        accessibilityRole="button"
      >
        <Text style={ui.primaryButtonText}>Sign Up</Text>
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <GoogleSignInButton onPress={signIn} />

      <Text style={styles.terms}>
        By signing up, you agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
        <Text style={styles.termsLink}>Data Processing Agreement</Text>
      </Text>
    </View>
  );
}
