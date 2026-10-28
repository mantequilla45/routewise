import { MapPointsContext } from '@/context/map-context';
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Full-screen overlay for pin placement: instruction banner, centre crosshair and confirm
 * button. Renders nothing unless pin placement is enabled.
 */
export default function PinPlacementOverlay({ onCancel, onConfirm }: Props) {
  const { isPinPlacementEnabled, isPointAB, pointA, pointB } = useContext(MapPointsContext);

  if (!isPinPlacementEnabled) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.banner}>
        <Ionicons name="location" size={24} color="#007AFF" />
        <Text style={styles.bannerText}>
          Move map to position crosshair at{' '}
          {isPointAB
            ? !pointA
              ? 'starting point'
              : 'starting point (updating)'
            : !pointB
              ? 'destination'
              : 'destination (updating)'}
        </Text>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Crosshair in center of map */}
      <View style={styles.crosshairContainer}>
        <View style={styles.crosshairVertical} />
        <View style={styles.crosshairHorizontal} />
        <View style={styles.crosshairCenter} />
      </View>

      <TouchableOpacity style={styles.confirmButton} onPress={onConfirm} activeOpacity={0.8}>
        <Ionicons name="checkmark-circle" size={32} color="#303030" />
        <Text style={styles.confirmText}>
          Confirm {isPointAB ? 'Starting Point' : 'Destination'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  banner: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    gap: 12,
    zIndex: 100,
  },
  bannerText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Lexend_400Regular',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Lexend_500Medium',
  },
  crosshairContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 40,
    height: 40,
    marginTop: -20,
    marginLeft: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairVertical: {
    position: 'absolute',
    width: 2,
    height: 40,
    backgroundColor: '#007AFF',
    opacity: 0.8,
  },
  crosshairHorizontal: {
    position: 'absolute',
    width: 40,
    height: 2,
    backgroundColor: '#007AFF',
    opacity: 0.8,
  },
  crosshairCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: 'white',
  },
  confirmButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    left: 20,
    right: 20,
    backgroundColor: '#FFCC66',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  confirmText: {
    color: '#303030',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Lexend_600SemiBold',
  },
});
