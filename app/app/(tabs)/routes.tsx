import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { POLYLINE_WIDTH } from '@/components/Map/LocationSelector/buildPolylines';
import { useContext, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RouteSortMenu, { type RouteSort, sortRoutes } from '@/components/Routes/RouteSortMenu';
import RoutesSkeleton from '@/components/Routes/RoutesSkeleton';
import Skeleton from '@/components/Skeleton';
import { MapPointsContext } from '@/context/map-context';
import { api } from '@/lib/api';
import { colors, hairline, radius, spacing, type, ui } from '@/theme';
import useNewTripGuard from '@/lib/tripTracking/useNewTripGuard';

interface Route {
  id: string;
  route_id: string;
  route_code: string;
  route_color: string;
  created_at: string;
}

export default function RoutesScreen() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<RouteSort>('code');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    setRoutes: setMapRoutes,
    setAllRoutes,
    setIsRouteFromList,
    setSelectedRouteInfo,
    resetTrip,
  } = useContext(MapPointsContext);

  const fetchRoutes = () =>
    api.routes
      .list()
      .then(setRoutes)
      .catch((error) => console.error('Error fetching routes:', error))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });

  useEffect(() => {
    fetchRoutes();
    // Initial load only; pull-to-refresh calls fetchRoutes again.
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoutes();
  };

  const guard = useNewTripGuard();
  const handleRouteSelect = (route: Route) => guard(() => openRoute(route));
  const openRoute = async (route: Route) => {
    try {
      // Fetch the full route details including coordinates
      const fullRoute = await api.routes.get(route.id);

      if (fullRoute) {
        // Convert coordinates to the format expected by the map
        if (fullRoute.coordinates && fullRoute.coordinates.length > 0) {
          const polyline = {
            id: `route_${route.route_id}`,
            coordinates: fullRoute.coordinates,
            color: colors.routePrimary,
            width: POLYLINE_WIDTH,
            geodesic: true,
          };

          // Show only this route: no pins or results left from a trip calculated earlier
          resetTrip();
          setMapRoutes([polyline]);
          setAllRoutes([polyline]);
          setIsRouteFromList(true); // Mark that this route came from the list
          setSelectedRouteInfo({
            id: fullRoute.route_id,
            name: fullRoute.route_code,
          });

          // Navigate to the map screen
          router.push('/trip');
        }
      }
    } catch (error) {
      console.error('Error fetching route details:', error);
    }
  };

  // Sorted here rather than in state, so the order survives a refresh
  const query = searchQuery.toLowerCase();
  const filteredRoutes = sortRoutes(
    routes.filter(
      (route) =>
        route.route_id.toLowerCase().includes(query) ||
        route.route_code.toLowerCase().includes(query),
    ),
    sort,
  );

  const renderRoute = ({ item }: { item: Route }) => (
    <Pressable
      onPress={() => handleRouteSelect(item)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
    >
      <View style={styles.badge}>
        <Text style={type.badge}>{item.route_id}</Text>
      </View>
      <Text style={[type.body, styles.rowName]} numberOfLines={1}>
        {item.route_code}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );

  return (
    <View style={[ui.screen, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <View>
          <Text style={type.title}>Routes</Text>
          <Text style={type.caption}>Browse all jeepney routes.</Text>
        </View>
        <View>
          <Ionicons
            name="search"
            size={SEARCH_ICON_SIZE}
            color={colors.textTertiary}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search routes"
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[ui.input, styles.searchInput]}
          />
        </View>
        <View style={styles.toolbar}>
          {loading ? (
            <Skeleton width={56} height={12} />
          ) : (
            <Text style={type.caption}>{filteredRoutes.length} routes</Text>
          )}
          <RouteSortMenu value={sort} onChange={setSort} />
        </View>
      </View>
      <View style={ui.divider} />

      {loading ? (
        <RoutesSkeleton />
      ) : (
        <FlatList
          data={filteredRoutes}
          renderItem={renderRoute}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={RowDivider}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.textSecondary]}
              tintColor={colors.textSecondary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bus-outline" size={40} color={colors.textTertiary} />
              <Text style={type.heading}>No routes found</Text>
              <Text style={[type.caption, styles.emptyCaption]}>Try a different route code.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function RowDivider() {
  return <View style={styles.rowDivider} />;
}

const SEARCH_ICON_SIZE = 18;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  rowName: {
    flex: 1,
  },
  badge: {
    backgroundColor: colors.text,
    borderRadius: radius.sm - 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  rowDivider: {
    height: hairline,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyCaption: {
    textAlign: 'center',
  },
});
