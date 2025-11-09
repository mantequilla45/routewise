import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/context/auth';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import { ActivityIndicator, Button, Platform, StyleSheet, Text, View } from 'react-native';

export default function App() {

  const { user, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    return <LoginForm />
  }
  return (
    <View style={styles.container}>
      <Text>{JSON.stringify(user)}</Text>
      <Button title="Sign Out" onPress={() => signOut()} />
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