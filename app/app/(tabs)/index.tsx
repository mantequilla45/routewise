import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/context/auth';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import { ActivityIndicator, Button, Platform, StyleSheet, Text, View } from 'react-native';

export default function Index() {

  return (

    <View>
      <Text>

        Home Screen
      </Text>
    </View>
  );

  {/*  if (Platform.OS === 'ios') {
    return <AppleMaps.View style={{ flex: 1 }} />;
  } else if (Platform.OS === 'android') {
    return <GoogleMaps.View style={{ flex: 1 }} />;
  } else {
    return <Text>Maps are only available on Android and iOS</Text>;
  }
} */}
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});