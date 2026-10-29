import { MapPointsContext } from '@/context/map-context';
import { colors, elevation, fonts, radius, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  onCancel: () => void;
  onConfirm: () => void;
};

const PIN_SIZE = 40;
const CONTROL_HEIGHT = 44;

/**
 * Pin placement over the map, in the same floating style as the route row: a round cancel
 * button at the top, a pin fixed at the map's centre, and at the bottom a one-line instruction
 * over a pill button that sets the point. Renders nothing unless pin placement is enabled.
 */
export default function PinPlacementOverlay({ onCancel, onConfirm }: Props) {
  const { isPinPlacementEnabled, isPointAB } = useContext(MapPointsContext);
  const insets = useSafeAreaInsets();
  // The map follows the system theme; the bare instruction text follows the map
  const onDarkMap = useColorScheme() === 'dark';

  if (!isPinPlacementEnabled) return null;

  const pinColor = isPointAB ? colors.origin : colors.destination;

  return (
    <View style={styles.overlay}>
      <View style={[styles.topRow, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <Pressable
          onPress={onCancel}
          hitSlop={6}
          style={({ pressed }) => [styles.round, pressed && styles.roundPressed]}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* The pin's tip sits on the exact centre of the map */}
      <View style={styles.pinContainer} pointerEvents="none">
        <Ionicons name="location-sharp" size={PIN_SIZE} color={pinColor} />
        <View style={styles.pinShadow} />
      </View>

      {/* Instruction right above the button that sets the point */}
      <View
        style={[styles.bottom, { bottom: insets.bottom + spacing.md }]}
        pointerEvents="box-none"
      >
        <View style={styles.hint}>
          <View style={[styles.dot, { backgroundColor: pinColor }]} />
          <Text
            style={[styles.hintText, onDarkMap ? styles.hintOnDark : styles.hintOnLight]}
            numberOfLines={1}
          >
            Move the map to place your {isPointAB ? 'start' : 'destination'}
          </Text>
        </View>
        <Pressable
          onPress={onConfirm}
          style={({ pressed }) => [styles.confirm, pressed && styles.confirmPressed]}
          accessibilityRole="button"
        >
          <Ionicons name="checkmark" size={20} color={colors.textOnAccent} />
          <Text style={styles.confirmText}>
            {isPointAB ? 'Set as start' : 'Set as destination'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'box-none',
    zIndex: 30,
  },
  topRow: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  round: {
    width: CONTROL_HEIGHT,
    height: CONTROL_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.floating,
  },
  roundPressed: {
    backgroundColor: colors.surface,
  },
  // No background: the text sits right on the map, with a halo for contrast
  hint: {
    alignSelf: 'center',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  hintText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    flexShrink: 1,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  hintOnDark: {
    color: colors.textOnDark,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
  },
  hintOnLight: {
    color: colors.text,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
  },
  pinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: PIN_SIZE,
    height: PIN_SIZE,
    marginLeft: -PIN_SIZE / 2,
    marginTop: -PIN_SIZE, // tip of the pin at the centre point
    alignItems: 'center',
  },
  pinShadow: {
    position: 'absolute',
    bottom: -3,
    width: 10,
    height: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  bottom: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.md,
  },
  confirm: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    ...elevation.floating,
  },
  confirmPressed: {
    backgroundColor: colors.accentPressed,
  },
  confirmText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.textOnAccent,
  },
});
