import { useAuth } from '@/context/auth';
import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { ui } from '@/theme';
import { ApiError } from '@/lib/api';
import { authFormStyles as styles } from '@/components/Auth/authFormStyles';
import { useSavedCredentials } from '@/components/Auth/useSavedCredentials';
import EmailPasswordFields from '@/components/Auth/EmailPasswordFields';
import RememberMeCheckbox from '@/components/Auth/RememberMeCheckbox';

export default function LoginForm() {
  const { signInWithEmail } = useAuth();
  const { email, setEmail, password, setPassword, rememberMe, setRememberMe, persistCredentials } =
    useSavedCredentials();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation', 'Please enter email and password');
      return;
    }

    try {
      setLoading(true);

      await signInWithEmail(email, password);
      await persistCredentials();

      Alert.alert('Login', 'Logged in successfully');
    } catch (e) {
      console.error('Login error:', e);
      Alert.alert('Login failed', e instanceof ApiError ? e.message : 'Unexpected error');
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

        <Text style={styles.linkText}>Forgot password?</Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          ui.primaryButton,
          styles.compactButton,
          pressed && styles.primaryPressed,
          loading && styles.disabled,
        ]}
        onPress={handleLogin}
        disabled={loading}
        accessibilityRole="button"
      >
        <Text style={ui.primaryButtonText}>{loading ? 'Logging in…' : 'Log in'}</Text>
      </Pressable>
    </View>
  );
}
