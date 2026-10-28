import { useAuth } from '@/context/auth';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ApiError } from '@/lib/api';
import { authFormStyles as styles } from '@/components/Auth/authFormStyles';
import { useSavedCredentials } from '@/components/Auth/useSavedCredentials';
import EmailPasswordFields from '@/components/Auth/EmailPasswordFields';
import RememberMeCheckbox from '@/components/Auth/RememberMeCheckbox';
import GoogleSignInButton from '@/components/Auth/GoogleSignInButton';

export default function LoginForm() {
  const { signIn, signInWithEmail } = useAuth();
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
      <View style={styles.thirdcontainer}>
        <RememberMeCheckbox checked={rememberMe} onToggle={() => setRememberMe(!rememberMe)} />

        <View style={styles.secondhalf}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.loginbutton}
        onPress={handleLogin}
        disabled={loading}
        accessibilityRole="button"
      >
        <Text style={styles.loginbuttonText}>{loading ? 'Loading...' : 'Log In'}</Text>
      </TouchableOpacity>

      <View style={[styles.dividerContainer, local.divider]}>
        <Text style={styles.dividerText}>or login with</Text>
      </View>

      <GoogleSignInButton onPress={signIn} />

      <Text style={styles.dividersText}>
        By signing in, you agree to the <Text style={styles.linkText}>Terms of Service</Text> and{' '}
        <Text style={styles.linkText}>Data Processing Agreement</Text>
      </Text>
    </View>
  );
}

const local = StyleSheet.create({
  divider: {
    marginVertical: 15,
  },
});
