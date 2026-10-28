import { useAuth } from '@/context/auth';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
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
      <View style={styles.thirdcontainer}>
        <RememberMeCheckbox checked={rememberMe} onToggle={() => setRememberMe(!rememberMe)} />

        <View style={styles.secondhalf}>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Forgot password', 'Use the login screen to reset your password.')
            }
          >
            <Text style={styles.forgotText}>Forgot?</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.loginbutton} onPress={handleSignUp} disabled={loading}>
        <Text style={styles.loginbuttonText}>Sign Up</Text>
      </TouchableOpacity>

      <View style={[styles.dividerContainer, local.divider]}>
        <Text style={styles.dividerText}>or signup with</Text>
      </View>

      <GoogleSignInButton onPress={signIn} />

      <Text style={styles.dividersText}>
        By signing up, you agree to the <Text style={styles.linkText}>Terms of Service</Text> and{' '}
        <Text style={styles.linkText}>Data Processing Agreement</Text>
      </Text>
    </View>
  );
}

const local = StyleSheet.create({
  divider: {
    marginVertical: 10,
  },
});
