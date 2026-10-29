import MapScreen from '@/components/Map/Screen/MapScreen';
import { useLocalSearchParams } from 'expo-router';

/**
 * Full-screen trip planner, pushed over the tabs. Params:
 * - `pick=start|destination`: open pin placement for that point right away
 * - `to`: name of a destination already chosen (from Home's search)
 */
export default function Trip() {
  const { pick, to } = useLocalSearchParams<{ pick?: string; to?: string }>();
  return (
    <MapScreen
      pick={pick === 'start' || pick === 'destination' ? pick : undefined}
      destinationName={typeof to === 'string' && to ? to : undefined}
    />
  );
}
