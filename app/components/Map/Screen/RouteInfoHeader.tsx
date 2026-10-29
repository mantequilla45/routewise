import SaveRouteButton from '@/components/Map/Screen/SaveRouteButton';
import { useSavedRouteStatus } from '@/components/Map/Screen/useSavedRouteStatus';
import { MapPointsContext } from '@/context/map-context';
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { colors, elevation, fonts, radius, spacing, type } from '@/theme';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * "Showing route" bar at the top of the map. Calculated routes get save and close buttons;
 * closing hands back to the caller (which reopens the results). Routes opened from the Routes
 * tab only get close. Renders nothing when no route is displayed.
 */
export default function RouteInfoHeader({ onCloseResult }: { onCloseResult: () => void }) {
  const {
    routes,
    setRoutes,
    results,
    selectedRouteIndex,
    selectedRouteInfo,
    setSelectedRouteInfo,
    setSelectedRouteIndex,
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

  // Stop showing the picked result on the map and go back to the list of results.
  const closeResult = () => {
    setRoutes([]);
    setSelectedRouteIndex(null);
    setSelectedRouteInfo(null);
    onCloseResult();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{selectedRouteInfo?.id || 'Route'}</Text>
        </View>
        <View style={styles.content}>
          <Text style={type.caption}>Showing route</Text>
        </View>
        {!isRouteFromList && results.length > 0 && selectedRouteIndex !== null && (
          <SaveRouteButton
            route={results[selectedRouteIndex]}
            isRouteSaved={isRouteSaved}
            onSaved={() => setIsRouteSaved(true)}
          />
        )}
        <TouchableOpacity
          onPress={isRouteFromList ? clearListRoute : closeResult}
          style={styles.closeButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isRouteFromList ? 'Close route' : 'Back to results'}
        >
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 100,
  },
  header: {
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderRadius: radius.lg,
    ...elevation.floating,
  },
  badge: {
    backgroundColor: colors.text,
    borderRadius: radius.sm - 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    letterSpacing: 0.3,
    color: colors.textOnDark,
  },
  content: {
    flex: 1,
  },
  closeButton: {
    padding: spacing.sm,
  },
});
