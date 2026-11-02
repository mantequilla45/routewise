import {
  type CategoryFilter,
  PopularPlacesHeader,
  PopularPlacesList,
} from '@/components/Home/PopularPlaces';
import usePopularPlaces from '@/components/Home/usePopularPlaces';
import useMorePlaces from '@/components/Home/useMorePlaces';
import PlaceShortcuts from '@/components/Home/PlaceShortcuts';
import SavedShortcuts from '@/components/Home/SavedShortcuts';
import { addRecentPlace } from '@/lib/recentPlaces';
import InlinePlaceSearch from '@/components/Map/LocationSelector/InlinePlaceSearch';
import { useAuth } from '@/context/auth';
import { MapPointsContext } from '@/context/map-context';
import { colors, fonts, radius, spacing, type, ui } from '@/theme';
import { LatLng } from '@/types/GeoTypes';
import { motion } from '@/lib/motion';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useContext, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useNewTripGuard from '@/lib/tripTracking/useNewTripGuard';

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Home tab: greeting and "Where to?" search; the map opens only once a trip is started. */
export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { setPointB, resetTrip } = useContext(MapPointsContext);
  // While searching, only the field and its suggestions show
  const [isSearching, setIsSearching] = useState(false);
  const places = usePopularPlaces();
  const [category, setCategory] = useState<CategoryFilter>('all');
  const more = useMorePlaces(category);
  const { height: windowHeight } = useWindowDimensions();
  // Where the list is scrolled to, for deciding when to load more (no re-render needed)
  const scrollOffset = useRef(0);
  // The keyboard rises from the screen bottom, but this screen ends at the tab bar
  const keyboard = useAnimatedKeyboard();
  const tabBarHeight = useBottomTabBarHeight();
  const mapBarLift = useAnimatedStyle(() => ({
    transform: [{ translateY: -Math.max(0, keyboard.height.value - tabBarHeight) }],
  }));

  const firstName = user?.name?.trim().split(/\s+/)[0];

  const guard = useNewTripGuard();
  const goTo = (point: LatLng, name: string) =>
    guard(() => {
      addRecentPlace({ name, location: point });
      resetTrip();
      setPointB(point);
      setIsSearching(false);
      router.push({ pathname: '/trip', params: { to: name } });
    });

  const pickOnMap = () =>
    guard(() => {
      resetTrip();
      setIsSearching(false);
      router.push({ pathname: '/trip', params: { pick: 'destination' } });
    });

  return (
    <View style={[ui.screen, styles.content, { paddingTop: insets.top + spacing.xl }]}>
      {/* Fixed: greeting, search and shortcuts. Only the popular places list scrolls. */}
      {!isSearching && (
        <Animated.View entering={motion.enter} exiting={motion.exit}>
          <Text style={type.caption}>
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </Text>
          <View style={styles.headlineRow}>
            <Text style={styles.headline}>Where to?</Text>
            <Pressable
              onPress={() => setIsSearching(true)}
              style={({ pressed }) => [styles.searchButton, pressed && styles.searchPressed]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Search for a destination"
            >
              <Ionicons name="search" size={20} color={colors.text} />
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* The search field appears only while searching, opened by the button above */}
      {isSearching && (
        <Animated.View
          entering={motion.enter}
          exiting={motion.exit}
          style={[styles.fill, styles.searchBody]}
        >
          <InlinePlaceSearch
            placeholder="Search for a destination"
            large
            autoFocus
            scrollable
            onSelectPlace={goTo}
            // Opened by the button; closes only with Cancel or a pick, not when the keyboard drops
            onCancel={() => setIsSearching(false)}
          >
            {/* Empty search: recents and popular picks ("Choose on map" is pinned below) */}
            <PlaceShortcuts onSelect={goTo} maxRecent={5} popularCount={6} />
          </InlinePlaceSearch>
        </Animated.View>
      )}

      {/* Rides just above the keyboard while searching, so it's always in reach */}
      {isSearching && (
        <Animated.View style={[styles.mapBar, mapBarLift]}>
          <Pressable
            onPress={pickOnMap}
            style={({ pressed }) => [styles.mapBarRow, pressed && styles.searchPressed]}
            accessibilityRole="button"
          >
            <Ionicons name="map-outline" size={20} color={colors.text} />
            <Text style={styles.mapBarText}>Choose on map</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        </Animated.View>
      )}

      {/* One scroll for the rest: saved routes scroll away, then "Popular places" and its
          chips stay pinned at the top while the list keeps going */}
      {!isSearching && (
        <Animated.View entering={motion.enter} exiting={motion.exit} style={styles.fill}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            stickyHeaderIndices={[1]}
            showsVerticalScrollIndicator={false}
            // Near the end, load the next page of places for this category
            // Load the next page well before the end, so it's there by the time you get there.
            // On first layout too: a list shorter than that can't be scrolled to trigger it.
            onContentSizeChange={(_, height) => {
              if (places && height - scrollOffset.current < windowHeight * LOAD_AHEAD_SCREENS) {
                more.loadMore();
              }
            }}
            // Dragging past the end and letting go loads more, even after a failed load
            onScrollEndDrag={({
              nativeEvent: { layoutMeasurement, contentOffset, contentSize },
            }) => {
              const pastEnd = contentOffset.y + layoutMeasurement.height - contentSize.height;
              if (places && pastEnd > PULL_TO_LOAD) more.loadMore({ retry: true });
            }}
            scrollEventThrottle={100}
            onScroll={({ nativeEvent: { layoutMeasurement, contentOffset, contentSize } }) => {
              scrollOffset.current = contentOffset.y;
              const fromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
              if (places && fromBottom < layoutMeasurement.height * LOAD_AHEAD_SCREENS) {
                more.loadMore();
              }
            }}
          >
            <View>{user && <SavedShortcuts />}</View>
            <PopularPlacesHeader
              places={places}
              category={category}
              onCategoryChange={setCategory}
            />
            <PopularPlacesList
              places={places}
              more={more.places}
              loadingMore={more.loading}
              category={category}
              onSelect={goTo}
            />

            {/* End of the list: pull up for more, or search for anything else */}
            {places && !more.loading && (
              <View style={styles.listEnd}>
                <View style={styles.listEndHint}>
                  {!more.done && (
                    <Ionicons
                      name={more.failed ? 'refresh' : 'arrow-up'}
                      size={14}
                      color={colors.textTertiary}
                    />
                  )}
                  <Text style={styles.listEndText}>
                    {more.done
                      ? "That's all the places we found."
                      : more.failed
                        ? "Couldn't load more. Pull up to try again."
                        : 'Pull up for more places'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setIsSearching(true)}
                  style={({ pressed }) => [styles.searchMore, pressed && styles.searchPressed]}
                  accessibilityRole="button"
                >
                  <Ionicons name="search" size={16} color={colors.text} />
                  <Text style={type.bodyMedium}>Search more places</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

// Height of the "Choose on map" bar pinned above the keyboard while searching
const MAP_BAR_HEIGHT = 52;

// How far past the end (pt) a drag has to go to count as pulling up for more
const PULL_TO_LOAD = 60;

// Load the next page of places once the list's end is within this many screen heights
const LOAD_AHEAD_SCREENS = 1.5;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
  },
  fill: {
    flex: 1,
  },
  // Bleeds to the screen edges so edge-to-edge rows (tiles, chips) aren't clipped by the padding
  scroll: {
    marginHorizontal: -spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    color: colors.text,
    marginTop: spacing.xxs,
  },
  // Headline on the left, search button at the right edge
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  searchButton: {
    width: 40,
    height: 40,
    marginTop: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Pinned to the bottom while searching; lifted by the keyboard's height
  mapBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  mapBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: MAP_BAR_HEIGHT,
    paddingHorizontal: spacing.lg,
  },
  mapBarText: {
    ...type.bodyMedium,
    flex: 1,
  },
  // Room under the search results so the pinned bar never covers the last one
  searchBody: {
    paddingBottom: MAP_BAR_HEIGHT,
  },
  listEnd: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  listEndHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  listEndText: {
    ...type.caption,
    color: colors.textTertiary,
  },
  searchMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  searchPressed: {
    backgroundColor: colors.surfacePressed,
  },
});
