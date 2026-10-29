import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { POLYLINE_WIDTH } from '@/components/Map/LocationSelector/buildPolylines';
import { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPointsContext } from '@/context/map-context';
import { api } from '@/lib/api';
import { colors, hairline, radius, spacing, type, ui } from '@/theme';

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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    setRoutes: setMapRoutes,
    setAllRoutes,
    setIsRouteFromList,
    setSelectedRouteInfo,
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

  const handleRouteSelect = async (route: Route) => {
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

          // Set the route on the map context
          setMapRoutes([polyline]);
          setAllRoutes([polyline]);
          setIsRouteFromList(true); // Mark that this route came from the list
          setSelectedRouteInfo({
            id: fullRoute.route_id,
            name: fullRoute.route_code,
          });

          // Navigate to the map screen
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Error fetching route details:', error);
    }
  };

  const filteredRoutes = routes.filter((route) => {
    const query = searchQuery.toLowerCase();
    return (
      route.route_id.toLowerCase().includes(query) || route.route_code.toLowerCase().includes(query)
    );
  });

  const sortAlphabetically = () => {
    const sorted = [...routes].sort((a, b) => a.route_id.localeCompare(b.route_id));
    setRoutes(sorted);
  };

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

  if (loading) {
    return (
      <View style={[ui.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.textSecondary} />
        <Text style={type.caption}>Loading routes…</Text>
      </View>
    );
  }

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
          <Text style={type.caption}>{filteredRoutes.length} routes</Text>
          <Pressable
            onPress={sortAlphabetically}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            accessibilityRole="button"
          >
            <Text style={type.label}>Sort A–Z</Text>
          </Pressable>
        </View>
      </View>
      <View style={ui.divider} />

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
    </View>
  );
}

function RowDivider() {
  return <View style={styles.rowDivider} />;
}

const SEARCH_ICON_SIZE = 18;

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
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
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  chipPressed: {
    backgroundColor: colors.surfacePressed,
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
