import SaveRouteButton from '@/components/Map/Screen/SaveRouteButton';
import { useSavedRouteStatus } from '@/components/Map/Screen/useSavedRouteStatus';
import { MapPointsContext } from '@/context/map-context';
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * "Showing Route" card at the top of the map. Routes opened from the saved list get a close
 * button; calculated routes get a save button. Renders nothing when no route is displayed.
 */
export default function RouteInfoHeader() {
  const {
    routes,
    setRoutes,
    results,
    selectedRouteIndex,
    selectedRouteInfo,
    setSelectedRouteInfo,
    isRouteFromList,
    setIsRouteFromList,
    pointA,
    pointB,
  } = useContext(MapPointsContext);
  const { isRouteSaved, setIsRouteSaved } = useSavedRouteStatus(
    results,
    selectedRouteIndex,
    pointA,
    pointB,
  );

  const hasRoute =
    routes.length > 0 && (isRouteFromList || (results.length > 0 && selectedRouteInfo !== null));
  if (!hasRoute) return null;

  const clearListRoute = () => {
    setIsRouteFromList(false);
    setRoutes([]);
    setSelectedRouteInfo(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.content}>
          <Text style={styles.label}>Showing Route</Text>
          <Text style={styles.code}>{selectedRouteInfo?.id || 'Route'}</Text>
        </View>
        {isRouteFromList ? (
          <TouchableOpacity onPress={clearListRoute} style={styles.closeButton}>
            <Ionicons name="close-circle" size={24} color="#666" />
          </TouchableOpacity>
        ) : (
          results.length > 0 &&
          selectedRouteIndex !== null && (
            <SaveRouteButton
              route={results[selectedRouteIndex]}
              isRouteSaved={isRouteSaved}
              onSaved={() => setIsRouteSaved(true)}
            />
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Lexend_400Regular',
  },
  code: {
    fontSize: 20,
    color: '#303030',
    fontFamily: 'Lexend_600SemiBold',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    marginLeft: 10,
  },
});
