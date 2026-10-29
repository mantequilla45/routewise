import { MapPointsContext } from '@/context/map-context';
import { colors, elevation, radius, spacing, type, ui } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  onCancel: () => void;
  onConfirm: () => void;
};

const PIN_SIZE = 40;

/**
 * Full-screen overlay for pin placement: instruction bar, a pin fixed at the map's centre, and
 * a confirm button. Renders nothing unless pin placement is enabled.
 */
export default function PinPlacementOverlay({ onCancel, onConfirm }: Props) {
  const { isPinPlacementEnabled, isPointAB } = useContext(MapPointsContext);

  if (!isPinPlacementEnabled) return null;

  const pinColor = isPointAB ? colors.origin : colors.destination;

  return (
    <View style={styles.overlay}>
      <View style={styles.banner}>
        <View style={styles.bannerText}>
          <Text style={type.heading}>{isPointAB ? 'Set starting point' : 'Set destination'}</Text>
          <Text style={type.caption}>Move the map to place the pin</Text>
        </View>
        <Pressable
          onPress={onCancel}
          hitSlop={8}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* The pin's tip sits on the exact centre of the map */}
      <View style={styles.pinContainer} pointerEvents="none">
        <Ionicons name="location-sharp" size={PIN_SIZE} color={pinColor} />
        <View style={styles.pinShadow} />
      </View>

      <Pressable
        style={({ pressed }) => [
          ui.primaryButton,
          styles.confirmButton,
          pressed && { backgroundColor: colors.accentPressed },
        ]}
        onPress={onConfirm}
        accessibilityRole="button"
      >
        <Text style={ui.primaryButtonText}>
          Confirm {isPointAB ? 'starting point' : 'destination'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'box-none',
  },
  banner: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderRadius: radius.lg,
    zIndex: 100,
    ...elevation.floating,
  },
  bannerText: {
    flex: 1,
    gap: spacing.xxs,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
  confirmButton: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    ...elevation.floating,
  },
});
