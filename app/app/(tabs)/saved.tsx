import SavedRouteList from '@/components/SavedRoute/SavedRouteList';
import useOpenSavedRoute from '@/components/SavedRoute/useOpenSavedRoute';
import { api, type SavedRouteRow, type TransferPoints } from '@/lib/api';
import { useAuth } from '@/context/auth';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { colors, spacing, type, ui } from '@/theme';

export interface SavedRoute {
  id: string;
  jeepCode: string;
  start: string;
  destination: string;
  totalFare?: number;
  createdAt?: string;
  // Additional data for displaying on map
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  transferPoints?: TransferPoints | null;
  /** The jeeps it was saved with, in riding order. */
  jeepCodes?: string[] | null;
  routeData?: UserSavedRoute;
}

export type UserSavedRoute = SavedRouteRow;

function toSavedRoute(route: UserSavedRoute): SavedRoute {
  return {
    id: route.id,
    jeepCode: route.jeepney_codes ? route.jeepney_codes.join(' → ') : 'Direct',
    start: route.start_location,
    destination: route.end_location,
    totalFare: route.total_fare,
    createdAt: route.created_at,
    // Include additional data for map display
    startLat: route.start_lat,
    startLng: route.start_lng,
    endLat: route.end_lat,
    endLng: route.end_lng,
    transferPoints: route.transfer_points,
    jeepCodes: route.jeepney_codes,
    routeData: route,
  };
}

export default function Saved() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

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

  const handleDeleteRoute = async (id: string) => {
    try {
      Alert.alert('Delete this route?', "It's removed from your saved routes.", [
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
              setRoutes((prevRoutes) => prevRoutes.filter((route) => route.id !== id));
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Error deleting route:', error);
      Alert.alert('Error', 'Failed to delete route');
    }
  };

  const openSavedRoute = useOpenSavedRoute();

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
    <View style={ui.screen}>
      <View style={[styles.content, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.header}>
          <View>
            <Text style={type.title}>Saved</Text>
            {!!user && !loading && (
              <Text style={type.caption}>
                {routes.length === 1 ? '1 route' : `${routes.length} routes`}
              </Text>
            )}
          </View>
          {/* Search only once there's something to search */}
          {!!user && routes.length > 1 && (
            <View>
              <Ionicons
                name="search"
                size={SEARCH_ICON_SIZE}
                color={colors.textTertiary}
                style={styles.searchIcon}
              />
              <TextInput
                placeholder="Search saved routes"
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[ui.input, styles.searchInput]}
              />
            </View>
          )}
        </View>
        <View style={styles.body}>
          {!user ? (
            <EmptyState
              icon="person-outline"
              title="Log in to see saved routes"
              caption="Saved routes are kept with your account."
            />
          ) : loading ? null : filteredRoutes.length === 0 ? (
            <EmptyState
              icon="bookmark-outline"
              title={searchQuery ? 'No matches' : 'No saved routes yet'}
              caption={
                searchQuery
                  ? 'Try another place or jeep code.'
                  : 'Plan a trip and tap the bookmark to keep it here.'
              }
            />
          ) : (
            <SavedRouteList
              routes={filteredRoutes}
              onRouteSelect={openSavedRoute}
              onDelete={handleDeleteRoute}
            />
          )}
        </View>
      </View>

      {/* Centered on the whole phone screen: no padding on this parent, and stretched down over
          the tab bar so it sits mid-screen rather than mid-way above the tabs */}
      {!!user && loading && (
        <View style={[styles.loading, { bottom: -tabBarHeight }]} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.textSecondary} />
          <Text style={type.caption}>Loading saved routes…</Text>
        </View>
      )}
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
  content: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
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
