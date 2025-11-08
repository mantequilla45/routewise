import { AppleMaps, GoogleMaps } from 'expo-maps';
import { Platform, Text } from 'react-native';

export default function Index() {
  const initialRegion = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  if (Platform.OS === 'ios') {
    return <AppleMaps.View style={{ flex: 1 }} initialRegion={initialRegion} />;
  } else if (Platform.OS === 'android') {
    return <GoogleMaps.View style={{ flex: 1 }} initialRegion={initialRegion} />;
  } else {
    return <Text>Maps are only available on Android and iOS</Text>;
  }
}