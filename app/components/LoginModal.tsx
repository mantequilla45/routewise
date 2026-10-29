import { useAuth } from '@/context/auth';
import { PropsWithChildren, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useAnimatedValue,
} from 'react-native';
import { colors, radius, spacing, type, ui } from '@/theme';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

const { height: screenHeight } = Dimensions.get('window');

type Tab = 'login' | 'signup';

const SEGMENTS: { key: Tab; label: string }[] = [
  { key: 'login', label: 'Log in' },
  { key: 'signup', label: 'Sign up' },
];

type Props = PropsWithChildren<{
  isVisible: boolean;
  onClose: () => void;
  /** Tab shown each time the modal opens. */
  initialTab?: Tab;
}>;

export default function LoginModal({ isVisible, onClose, initialTab = 'login' }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  // Reset to the requested tab whenever the modal opens (set during render, not in an effect)
  const [wasVisible, setWasVisible] = useState(isVisible);
  if (isVisible !== wasVisible) {
    setWasVisible(isVisible);
    if (isVisible) setActiveTab(initialTab);
  }
  const translateY = useAnimatedValue(screenHeight);
  const overlayOpacity = useAnimatedValue(0);

  // Created once; it only touches the stable animated values and onClose.
  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // Fade out overlay while sliding down
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: screenHeight,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onClose();
          });
        } else {
          // Snap back
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  );

  useEffect(() => {
    if (isVisible) {
      overlayOpacity.setValue(0);
      translateY.setValue(screenHeight);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      overlayOpacity.setValue(0);
      translateY.setValue(screenHeight);
    }
  }, [isVisible, overlayOpacity, translateY]);

  const { user, isLoading } = useAuth();

  // Close modal when user signs in successfully
  useEffect(() => {
    if (user && isVisible) {
      onClose();
    }
  }, [user, isVisible, onClose]);

  return (
    <View>
      <Modal animationType="none" transparent={true} visible={isVisible}>
        <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}>
          {/* Invisible overlay to detect taps */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              // Same animation as your swipe dismiss
              Animated.parallel([
                Animated.timing(translateY, {
                  toValue: screenHeight,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                onClose();
              });
            }}
          />

          {/* Modal content - NOT wrapped in TouchableOpacity */}
          <Animated.View
            style={[styles.loginModalContent, { transform: [{ translateY }] }]}
            {...panResponder.panHandlers}
          >
            <View style={[ui.handle, styles.handle]} />
            <View style={styles.segmented} accessibilityRole="tablist">
              {SEGMENTS.map(({ key, label }) => {
                const isActive = activeTab === key;
                return (
                  <Pressable
                    key={key}
                    style={[styles.segment, isActive && styles.segmentActive]}
                    onPress={() => setActiveTab(key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.contentContainer}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.textSecondary} />
                  <Text style={type.caption}>Signing in...</Text>
                </View>
              ) : activeTab === 'login' ? (
                <LoginForm />
              ) : (
                <SignupForm />
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  loginModalContent: {
    height: '70%',
    width: '100%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  handle: {
    marginBottom: spacing.lg,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.background,
  },
  segmentText: {
    ...type.bodyMedium,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.text,
  },
  contentContainer: {
    flex: 1,
    marginTop: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
});
