import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text as RNText,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Text, Title, Body, Caption, Label } from '../components/Text';

// For animated text, still use RNText
const AnimatedText = Animated.createAnimatedComponent(RNText);

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const OnboardingScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const arrowRotation = useRef(new Animated.Value(0)).current;
  const expandedFadeAnim = useRef(new Animated.Value(0)).current;

  const toggleBottomSheet = () => {
    const toValue = isExpanded ? 0 : 1;

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }),
      Animated.timing(arrowRotation, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(expandedFadeAnim, {
        toValue: isExpanded ? 0 : 1,
        duration: 400,
        delay: isExpanded ? 0 : 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsExpanded(!isExpanded);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        });

        if (error) {
          Alert.alert('Error', error.message);
        } else {
          Alert.alert('Success', 'Login successful!');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.toLowerCase().trim(),
          password,
        });

        if (error) {
          Alert.alert('Error', error.message);
        } else {
          Alert.alert('Success', 'Sign up successful! Please check your email to verify your account.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0], // Move up 400px to reveal auth forms
  });

  const arrowRotate = arrowRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.heroContainer}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('../../assets/logo/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text weight="bold" style={styles.tagline}>Find the Best Jeepney Route in Seconds</Text>

        <Text weight="300" style={styles.description}>
          RouteWise shows your best jeepney route, total fare, and transfer points — automatically.
        </Text>

        <Image
          source={require('../../assets/pictures/map.png')}
          style={styles.mapImage}
          resizeMode="contain"
        />
      </ScrollView>

      {/* Bottom Sheet - Everything rendered, but positioned to show only header initially */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Get Started Header - Always visible */}
        <TouchableOpacity
          style={styles.slideUpButton}
          onPress={toggleBottomSheet}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ rotate: arrowRotate }] }}>
            <Text style={styles.arrow}>⌃</Text>
          </Animated.View>
          <Text style={styles.getStartedTitle}>Get Started Now</Text>
          <Text style={styles.getStartedSubtitle}>
            Create an account or log in to explore further.
          </Text>
        </TouchableOpacity>

        {/* Auth Forms - Rendered but initially off-screen below */}
        <Animated.View style={[styles.authFormsContainer, { opacity: expandedFadeAnim }]}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                isLogin && styles.toggleButtonActive,
              ]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[
                styles.toggleText,
                isLogin && styles.toggleTextActive,
              ]}>
                Log In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                !isLogin && styles.toggleButtonActive,
              ]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[
                styles.toggleText,
                !isLogin && styles.toggleTextActive,
              ]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLogin ? 'Log In' : 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  heroContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 200,
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  tagline: {
    fontSize: 28,
    fontFamily: 'Lexend-Regular',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Lexend-Light',
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  mapImage: {
    width: '100%',
    height: 250,
    marginTop: 20,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: -400,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 15,
    paddingBottom: 400,
  },
  slideUpButton: {
    paddingTop: 12,
    paddingHorizontal: 30,
    paddingBottom: 20,
    alignItems: 'center',
  },
  arrow: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  getStartedTitle: {
    fontSize: 18,
    fontFamily: 'Lexend-Regular',
    color: '#333',
  },
  getStartedSubtitle: {
    fontSize: 13,
    fontFamily: 'Lexend-Light',
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 25
  },
  authFormsContainer: {
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 30,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 25,
    padding: 4,
    marginBottom: 30,
    height: 'auto'
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 22,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#fff',
  },
  formContainer: {
    // Removed flex: 1 to allow auto height
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingScreen;