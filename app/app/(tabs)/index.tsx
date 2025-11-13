import { AppleMaps, GoogleMaps } from 'expo-maps';
import { Platform, StyleSheet, Text, View } from 'react-native';

export default function Index() {

  if (Platform.OS === 'android') {
    return (
      <View style={styles.container}>
        <GoogleMaps.View
          style={styles.map}
          cameraPosition={{
            coordinates: { latitude: 10.3157, longitude: 123.8854 },
            zoom: 12,
          }}
        />
      </View>
    );
  } else if (Platform.OS === 'ios') {
    return <AppleMaps.View style={{ flex: 1 }} />;
  } else {
    return <Text>Maps are only available on Android and iOS</Text>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
