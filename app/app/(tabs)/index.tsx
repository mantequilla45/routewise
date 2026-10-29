import { StyleSheet, View } from 'react-native';
import MapScreen from '../(screens)/MapScreen';
import { colors } from '@/theme';

export default function Index() {
  return (
    <View style={styles.container}>
      <MapScreen />
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
    backgroundColor: colors.accent,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fabText: {
    color: colors.textOnAccent,
    fontSize: 16,
  },
});
