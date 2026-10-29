import PopularPlaces from '@/components/Home/PopularPlaces';
import PlaceShortcuts from '@/components/Home/PlaceShortcuts';
import SavedShortcuts from '@/components/Home/SavedShortcuts';
import OptionRow from '@/components/Map/LocationSelector/OptionRow';
import { addRecentPlace } from '@/lib/recentPlaces';
import ActiveTripBanner from '@/components/Home/ActiveTripBanner';
import InlinePlaceSearch from '@/components/Map/LocationSelector/InlinePlaceSearch';
import { useAuth } from '@/context/auth';
import { MapPointsContext } from '@/context/map-context';
import { colors, fonts, spacing, type, ui } from '@/theme';
import { LatLng } from '@/types/GeoTypes';
import { motion } from '@/lib/motion';
import { useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  const firstName = user?.name?.trim().split(/\s+/)[0];

  const goTo = (point: LatLng, name: string) => {
    addRecentPlace({ name, location: point });
    resetTrip();
    setPointB(point);
    setIsSearching(false);
    router.push({ pathname: '/trip', params: { to: name } });
  };

  const pickOnMap = () => {
    resetTrip();
    setIsSearching(false);
    router.push({ pathname: '/trip', params: { pick: 'destination' } });
  };

  return (
    <View style={[ui.screen, styles.content, { paddingTop: insets.top + spacing.xl }]}>
      {/* Fixed: greeting, search and shortcuts. Only the popular places list scrolls. */}
      {!isSearching && <ActiveTripBanner />}
      {!isSearching && (
        <Animated.View entering={motion.enter} exiting={motion.exit}>
          <Text style={type.caption}>
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </Text>
          <Text style={styles.headline}>Where to?</Text>
        </Animated.View>
      )}

      <Animated.View
        layout={motion.layout}
        style={isSearching ? styles.fill : styles.searchSpacing}
      >
        <InlinePlaceSearch
          placeholder="Search for a destination"
          large
          scrollable={isSearching}
          onSelectPlace={goTo}
          onChooseOnMap={pickOnMap}
          onActiveChange={setIsSearching}
          onCancel={isSearching ? () => setIsSearching(false) : undefined}
        >
          {/* Empty search: recents, popular picks, and picking on the map */}
          {isSearching && (
            <>
              <PlaceShortcuts onSelect={goTo} maxRecent={5} popularCount={6} />
              <View style={styles.mapOption}>
                <OptionRow
                  icon="map-outline"
                  iconColor={colors.textSecondary}
                  label="Choose on map"
                  onPress={pickOnMap}
                />
              </View>
            </>
          )}
        </InlinePlaceSearch>
      </Animated.View>

      {!isSearching && user && (
        <Animated.View entering={motion.enter} exiting={motion.exit}>
          <SavedShortcuts />
        </Animated.View>
      )}

      {!isSearching && (
        <Animated.View entering={motion.enter} exiting={motion.exit} style={styles.fill}>
          <PopularPlaces onSelect={goTo} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
  },
  fill: {
    flex: 1,
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    color: colors.text,
    marginTop: spacing.xxs,
  },
  searchSpacing: {
    marginTop: spacing.lg,
  },
  mapOption: {
    marginTop: spacing.md,
  },
});
