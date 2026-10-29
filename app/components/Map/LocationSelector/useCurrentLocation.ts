import { LatLng } from '@/types/GeoTypes';
import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert } from 'react-native';

/** Asks for location permission and reads the device's position once. */
export default function useCurrentLocation() {
  const [isLocating, setIsLocating] = useState(false);

  const locate = async (): Promise<LatLng | null> => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location is off',
          'Allow location access in Settings, or choose your starting point on the map.',
        );
        return null;
      }
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return { latitude: coords.latitude, longitude: coords.longitude };
    } catch (error) {
      console.error('Could not get current location:', error);
      Alert.alert('Location unavailable', 'Choose your starting point on the map instead.');
      return null;
    } finally {
      setIsLocating(false);
    }
  };

  return { isLocating, locate };
}
