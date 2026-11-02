import { colors, radius, spacing, type, ui } from '@/theme';
import { type ReactNode, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

const OPEN = { duration: 280, easing: Easing.out(Easing.cubic) };
const CLOSE = { duration: 220, easing: Easing.in(Easing.cubic) };
// Swipe-to-close: drag distance or downward speed (pt/s) that closes the sheet
const CLOSE_DRAG_PX = 100;
const CLOSE_FLICK_SPEED = 800;

type Props = {
  visible: boolean;
  /** Asked to close (swipe down, tap outside, Android back). Set `visible` false in response. */
  onClose: () => void;
  /** Optional heading under the handle. */
  title?: string;
  children: ReactNode;
};

/**
 * The app's one bottom sheet; every sheet uses it so they all behave the same. It slides up over
 * a fading backdrop each time it opens and slides back down before it goes, whether closed by a
 * swipe, a tap outside, the back button or the screen itself (e.g. after picking an option).
 * Keeps its content above the keyboard and the home indicator.
 */
export default function BottomSheet({ visible, onClose, title, children }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const keyboard = useAnimatedKeyboard();

  // Stays mounted through the slide-out, then unmounts
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  const offset = useSharedValue(height); // sheet's distance below its resting place
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      offset.set(height);
      backdrop.set(0);
      offset.set(withTiming(0, OPEN));
      backdrop.set(withTiming(1, OPEN));
    } else {
      backdrop.set(withTiming(0, CLOSE));
      offset.set(
        withTiming(height, CLOSE, (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [visible, height, offset, backdrop]);

  const swipeDown = usePanGesture({
    activeOffsetY: 8,
    failOffsetX: [-24, 24],
    onUpdate: (e) => {
      offset.set(e.translationY > 0 ? e.translationY : e.translationY * 0.2);
    },
    onDeactivate: (e) => {
      if (e.translationY > CLOSE_DRAG_PX || e.velocityY > CLOSE_FLICK_SPEED) {
        scheduleOnRN(onClose); // the slide-out runs when `visible` turns false
      } else {
        offset.set(withSpring(0, { damping: 18, stiffness: 220 }));
      }
    },
  });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
    paddingBottom: insets.bottom + spacing.lg + keyboard.height.value,
  }));

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      {/* A modal is its own native window, so it needs its own gesture root */}
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>

        <GestureDetector gesture={swipeDown}>
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={ui.handle} />
            {!!title && <Text style={styles.title}>{title}</Text>}
            {children}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  // Full screen behind the sheet, so it also dims around the sheet's rounded corners
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scrim,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...type.heading,
    marginTop: spacing.xs,
  },
});
