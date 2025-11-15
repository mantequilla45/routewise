import Ionicons from '@expo/vector-icons/build/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Index() {

  return (
    <View style={styles.container}>
      <TouchableOpacity 
      style={styles.fab}
      onPress={() => router.push('/MapScreen')}
      >
        <Text style={styles.fabText}>Map</Text>
        <Ionicons name={'map'} color={'#000'} size={20} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 160,
    right: 60,
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#FFCC66',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  fabText: {
    color: '#000',
    fontSize: 16,
  },
});
