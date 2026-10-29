import DynamicBoxes from '@/components/SavedRoute/DynamicBoxes';
import { api, type SavedRouteRow, type TransferPoints } from '@/lib/api';
import { useAuth } from '@/context/auth';
import { MapPointsContext } from '@/context/map-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useContext, useEffect, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, TextInput, View, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, type, ui } from '@/theme';

export interface SavedRoute {
  id: string;
  jeepCode: string;
  start: string;
  destination: string;
  favorite: boolean;
  totalFare?: number;
  createdAt?: string;
  // Additional data for displaying on map
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  transferPoints?: TransferPoints | null;
  routeData?: UserSavedRoute;
}

export type UserSavedRoute = SavedRouteRow;

function toSavedRoute(route: UserSavedRoute): SavedRoute {
  return {
    id: route.id,
    jeepCode: route.jeepney_codes ? route.jeepney_codes.join(' → ') : 'Direct',
    start: route.start_location,
    destination: route.end_location,
    favorite: false,
    totalFare: route.total_fare,
    createdAt: route.created_at,
    // Include additional data for map display
    startLat: route.start_lat,
    startLng: route.start_lng,
    endLat: route.end_lat,
    endLng: route.end_lng,
    transferPoints: route.transfer_points,
    routeData: route,
  };
}

export default function Saved() {
  const { user } = useAuth();
  const {
    setPointA,
    setPointB,
    setResults,
    setRoutes: setMapRoutes,
  } = useContext(MapPointsContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  // Show the spinner again whenever the signed-in user changes (set during render, not in
  // the effect, so the fetch below doesn't trigger an extra render).
  const [loadedFor, setLoadedFor] = useState(user);
  if (user !== loadedFor) {
    setLoadedFor(user);
    setLoading(true);
  }

  // The backend scopes results to the signed-in user via the bearer token.
  useEffect(() => {
    if (!user) return;
    let ignore = false;
    api.savedRoutes
      .list()
      .then((rows) => {
        if (!ignore) setRoutes(rows.map(toSavedRoute));
      })
      .catch((error) => {
        console.error('Error fetching saved routes:', error);
        if (!ignore) Alert.alert('Error', 'Failed to load saved routes');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [user]);

  const toggleFavorite = (id: string) => {
    setRoutes((prevRoutes) =>
      prevRoutes.map((route) =>
        route.id === id ? { ...route, favorite: !route.favorite } : route,
      ),
    );
  };

  const handleDeleteRoute = async (id: string) => {
    try {
      Alert.alert('Delete Route', 'Are you sure you want to delete this saved route?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const error = await api.savedRoutes.remove(id).then(
              () => null,
              (e) => e,
            );

            if (error) {
              console.error('Error deleting route:', error);
              Alert.alert('Error', 'Failed to delete route');
            } else {
              // Remove from local state
              setRoutes((prevRoutes) => prevRoutes.filter((route) => route.id !== id));
              Alert.alert('Success', 'Route deleted successfully');
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Error deleting route:', error);
      Alert.alert('Error', 'Failed to delete route');
    }
  };

  const handleRouteSelect = async (route: SavedRoute) => {
    // Clear existing routes first
    setResults([]);
    setMapRoutes([]);

    // Set the start and end points
    if (route.startLat && route.startLng) {
      setPointA({
        latitude: route.startLat,
        longitude: route.startLng,
      });
    }

    if (route.endLat && route.endLng) {
      setPointB({
        latitude: route.endLat,
        longitude: route.endLng,
      });
    }

    // Set a flag in AsyncStorage to trigger calculation in SelectorContent
    await AsyncStorage.setItem('shouldCalculateRoute', 'true');

    // Navigate to home tab (which contains the map)
    router.replace('/');
  };

  // Signed out: show nothing, even if routes from a previous session are still in state.
  const filteredRoutes = (user ? routes : []).filter((route) => {
    const query = searchQuery.toLowerCase();
    return (
      route.jeepCode.toLowerCase().includes(query) ||
      route.start.toLowerCase().includes(query) ||
      route.destination.toLowerCase().includes(query)
    );
  });
  return (
    <View style={[ui.screen, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <View>
          <Text style={type.title}>Saved</Text>
          <Text style={type.caption}>
            {user ? `${filteredRoutes.length} saved routes` : 'Find your saved routes.'}
          </Text>
        </View>
        <View>
          <Ionicons
            name="search"
            size={SEARCH_ICON_SIZE}
            color={colors.textTertiary}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Find destination"
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[ui.input, styles.searchInput]}
          />
        </View>
      </View>
      <View style={ui.divider} />
      <View style={styles.body}>
        {!user ? (
          <EmptyState
            icon="person-outline"
            title="Please login"
            caption="Login to see your saved routes"
          />
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.textSecondary} />
            <Text style={type.caption}>Loading saved routes…</Text>
          </View>
        ) : filteredRoutes.length === 0 ? (
          <EmptyState
            icon="bookmark-outline"
            title="No saved routes yet"
            caption="Calculate a route and save it to see it here"
          />
        ) : (
          <DynamicBoxes
            routes={filteredRoutes}
            onToggleFavorite={toggleFavorite}
            onRouteSelect={handleRouteSelect}
            onDelete={handleDeleteRoute}
          />
        )}
      </View>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  caption,
}: Readonly<{ icon: ComponentProps<typeof Ionicons>['name']; title: string; caption: string }>) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={40} color={colors.textTertiary} />
      <Text style={type.heading}>{title}</Text>
      <Text style={[type.caption, styles.centerText]}>{caption}</Text>
    </View>
  );
}

const SEARCH_ICON_SIZE = 18;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.md,
    top: (ui.input.height - SEARCH_ICON_SIZE) / 2,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: spacing.md + SEARCH_ICON_SIZE + spacing.sm,
  },
  body: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  centerText: {
    textAlign: 'center',
  },
});
