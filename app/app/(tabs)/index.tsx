import { useAuth } from '@/context/auth';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text>{JSON.stringify(user)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
})