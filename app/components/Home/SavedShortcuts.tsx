import useOpenSavedRoute from '@/components/SavedRoute/useOpenSavedRoute';
import { api, type SavedRouteRow } from '@/lib/api';
import { colors, radius, spacing, type } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const MAX_SHORTCUTS = 3;

/** The signed-in user's most recent saved routes, one tap to plan them again. */
export default function SavedShortcuts() {
  const router = useRouter();
  const openSavedRoute = useOpenSavedRoute();
  const [routes, setRoutes] = useState<SavedRouteRow[] | null>(null);

  useEffect(() => {
    let ignore = false;
    api.savedRoutes
      .list()
      .then((rows) => {
        if (!ignore) setRoutes(rows.slice(0, MAX_SHORTCUTS));
      })
      .catch((error) => {
        console.warn('Could not load saved routes:', error);
        if (!ignore) setRoutes([]);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (!routes || routes.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={type.overline}>Saved routes</Text>
        <Pressable onPress={() => router.push('/saved')} hitSlop={8} accessibilityRole="button">
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>
      {routes.map((route, index) => (
        <View key={route.id}>
          {index > 0 && <View style={styles.divider} />}
          <Pressable
            onPress={() =>
              openSavedRoute({
                startLat: route.start_lat,
                startLng: route.start_lng,
                endLat: route.end_lat,
                endLng: route.end_lng,
              })
            }
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            accessibilityRole="button"
          >
            <View style={styles.icon}>
              <Ionicons name="bookmark" size={16} color={colors.text} />
            </View>
            <View style={styles.rowText}>
              <Text style={type.bodyMedium} numberOfLines={1}>
                {route.jeepney_codes?.length ? route.jeepney_codes.join(' → ') : route.route_name}
              </Text>
              <Text style={type.caption} numberOfLines={1}>
                {route.start_location} → {route.end_location}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  seeAll: {
    ...type.label,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 60,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: spacing.xxs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 52,
  },
});
