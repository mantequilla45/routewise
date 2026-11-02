import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { getActiveTrip, stopTrip } from './tracker';

/**
 * Wraps "start planning a new trip" so it can't silently collide with a trip being tracked: the
 * map always shows the tracked journey, so the rider chooses to view it or end it first.
 */
export default function useNewTripGuard() {
  const router = useRouter();
  return (proceed: () => void) => {
    if (!getActiveTrip()) {
      proceed();
      return;
    }
    Alert.alert('You have a trip in progress', 'Ending it stops the alerts for that trip.', [
      { text: 'View trip', onPress: () => router.push('/trip') },
      {
        text: 'End and continue',
        style: 'destructive',
        onPress: async () => {
          await stopTrip();
          proceed();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };
}
