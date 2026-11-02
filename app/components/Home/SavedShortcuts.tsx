import Skeleton from '@/components/Skeleton';
import PlaceName, { useSavedPlaceName } from '@/components/SavedRoute/PlaceName';
import useOpenSavedRoute from '@/components/SavedRoute/useOpenSavedRoute';
import { PLACE_PLACEHOLDER } from '@/constants';
import { api, backendUrl, type SavedRouteRow } from '@/lib/api';
import usePlacePhoto from '@/lib/usePlacePhoto';
import { colors, fonts, radius, spacing, type } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Fragment, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const MAX_SHORTCUTS = 8;
const TILE_SIZE = 156;

/**
 * One saved route: a photo of its destination (a placeholder picture while loading or when
 * there's none), the jeeps on top, and where to and from over a dark fade at the bottom.
 */
function SavedTile({ route, onPress }: Readonly<{ route: SavedRouteRow; onPress: () => void }>) {
  const codes = route.jeepney_codes?.length ? route.jeepney_codes : [route.route_name];
  // Only a photo of the destination itself, found by its name
  const destinationName = useSavedPlaceName(route.end_location, route.end_lat, route.end_lng);
  const photo = usePlacePhoto(
    route.end_lat != null && route.end_lng != null
      ? { latitude: route.end_lat, longitude: route.end_lng }
      : null,
    destinationName,
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
      accessibilityRole="button"
      accessibilityHint="Plans this trip again"
    >
      <Image
        source={photo ? { uri: backendUrl(photo.path) } : PLACE_PLACEHOLDER}
        placeholder={PLACE_PLACEHOLDER}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
        cachePolicy="disk"
        recyclingKey={route.id}
        accessibilityIgnoresInvertColors
      />
      <View style={styles.fade} />

      <View style={styles.codes}>
        {codes.map((code, i) => (
          <Fragment key={`${code}-${i}`}>
            {i > 0 && <Ionicons name="chevron-forward" size={10} color={colors.textOnDark} />}
            <View style={styles.chip}>
              <Text style={styles.chipText}>{code}</Text>
            </View>
          </Fragment>
        ))}
      </View>

      <View style={styles.places}>
        <PlaceName
          name={route.end_location}
          lat={route.end_lat}
          lng={route.end_lng}
          style={styles.destination}
          numberOfLines={2}
        />
        <PlaceName
          name={route.start_location}
          lat={route.start_lat}
          lng={route.start_lng}
          style={styles.from}
          prefix="from "
        />
        {/* Google requires the photo's author to be shown with it */}
        {photo && (
          <Text style={styles.credit} numberOfLines={1}>
            Photo: {photo.attribution}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/** The signed-in user's saved routes as square tiles in a row, one tap to plan one again. */
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

  // Loading: the section's shape, so Home doesn't jump when the routes arrive
  if (!routes) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={type.overline}>Saved routes</Text>
        </View>
        <View style={[styles.scroller, styles.tiles, styles.skeletonRow]}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width={TILE_SIZE} height={TILE_SIZE} radius={radius.lg} />
          ))}
        </View>
      </View>
    );
  }
  if (routes.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={type.overline}>Saved routes</Text>
        <Pressable onPress={() => router.push('/saved')} hitSlop={8} accessibilityRole="button">
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroller}
        contentContainerStyle={styles.tiles}
      >
        {routes.map((route) => (
          <SavedTile
            key={route.id}
            route={route}
            onPress={() =>
              openSavedRoute({
                startLat: route.start_lat,
                startLng: route.start_lng,
                endLat: route.end_lat,
                endLng: route.end_lng,
                jeepCodes: route.jeepney_codes,
              })
            }
          />
        ))}
      </ScrollView>
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
    marginBottom: spacing.md,
  },
  seeAll: {
    ...type.label,
    color: colors.text,
  },
  // Scrolls edge to edge, past the screen's side padding
  scroller: {
    flexGrow: 0,
    marginHorizontal: -spacing.lg,
  },
  skeletonRow: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  tiles: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    padding: spacing.md,
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  tilePressed: {
    opacity: 0.85,
  },
  // Darkens the lower part of the picture so the white text reads on any photo
  fade: {
    ...StyleSheet.absoluteFill,
    top: '35%',
    backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.7) 100%)',
  },
  codes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  chip: {
    backgroundColor: colors.text,
    borderRadius: radius.sm - 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipText: {
    ...type.badge,
    fontSize: 12,
  },
  places: {
    gap: spacing.xxs,
  },
  destination: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textOnDark,
  },
  from: {
    ...type.caption,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  credit: {
    fontFamily: fonts.regular,
    fontSize: 9,
    lineHeight: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
