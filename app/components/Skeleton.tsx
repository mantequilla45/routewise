import { colors, radius as radii } from '@/theme';
import { useEffect } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A gray placeholder shape that pulses gently while real content loads. Lay several out in the
 * shape of what's coming, so the screen doesn't jump when it arrives.
 */
export default function Skeleton({ width = '100%', height = 14, radius = radii.sm, style }: Props) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.set(
      withRepeat(withTiming(0.45, { duration: 750, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }, [opacity]);
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.surfacePressed },
        pulse,
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
