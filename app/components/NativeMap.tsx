import { AppleMaps, GoogleMaps } from 'expo-maps';
import { Platform, StyleSheet, Text } from 'react-native';

export default function NativeMap() {
  const commonCamera = {
    coordinates: { latitude: 10.3157, longitude: 123.8854 },
    zoom: 12,
  };

  const commonUISettings = {
    compassEnabled: true,
    zoomControlsEnabled: false,
    mapToolbarEnabled: false, 
    myLocationButtonEnabled: true,
  };

  if (Platform.OS === 'android') {
    return (
      <GoogleMaps.View
        style={styles.map}
        cameraPosition={commonCamera}
        uiSettings={commonUISettings}
      />
    );
  } else if (Platform.OS === 'ios') {
    return (
      <AppleMaps.View
        style={styles.map}
        cameraPosition={commonCamera}
      />
    );
  } else {
    return <Text>Maps are only available on Android and iOS</Text>;
  }
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
