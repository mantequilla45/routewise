import NativeMap from '@/components/NativeMap';
import { AppleMaps } from 'expo-maps';
import { Platform, StyleSheet, Text, View } from 'react-native';

export default function Index() {

  if (Platform.OS === 'android') {
    return (
      <View style={styles.container}>
        <NativeMap/>
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
