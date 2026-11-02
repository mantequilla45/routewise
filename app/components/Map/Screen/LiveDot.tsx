import { radius } from '@/theme';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const SIZE = 8;
const LIVE_GREEN = '#22C55E';

/**
 * A green dot with a ring that pulses out of it, for "tracking live". Without a fix yet (`live`
 * false) it's a still gray dot. Holds still when the system asks for reduced motion.
 */
export default function LiveDot({ live }: Readonly<{ live: boolean }>) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!live || reduceMotion) return;
    pulse.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1));
  }, [live, reduceMotion, pulse]);

  const ring = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - pulse.value),
    transform: [{ scale: 1 + 1.6 * pulse.value }],
  }));

  return (
    <View style={styles.box}>
      {live && !reduceMotion && <Animated.View style={[styles.dot, styles.ring, ring]} />}
      <View
        style={[styles.dot, { backgroundColor: live ? LIVE_GREEN : 'rgba(255,255,255,0.4)' }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: SIZE * 2,
    height: SIZE * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.pill,
  },
  ring: {
    position: 'absolute',
    backgroundColor: LIVE_GREEN,
  },
});
