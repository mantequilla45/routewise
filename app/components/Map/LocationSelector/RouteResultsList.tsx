import { colors, spacing, type } from '@/theme';
import { TripOption } from '@/types/GeoTypes';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { motion } from '@/lib/motion';
import Animated from 'react-native-reanimated';
import RouteCard from './RouteCard';

/** Scrollable list of route results, fastest first. Renders nothing when there are no results. */
export default function RouteResultsList({
  results,
  selectedRouteIndex,
  onSelect,
}: Readonly<{
  results: TripOption[];
  selectedRouteIndex: number | null;
  onSelect: (index: number) => void;
}>) {
  // Keep the sheet short enough that the map stays visible above it.
  const { height } = useWindowDimensions();

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <Animated.View entering={motion.enter} style={styles.container}>
      <Text style={[type.overline, styles.header]}>
        {results.length} {results.length === 1 ? 'route' : 'routes'} · fastest first
      </Text>
      <ScrollView
        style={[styles.scroll, { maxHeight: Math.round(height * 0.32) }]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {results.map((route, index) => (
          <View key={`route-${index}-${route.routeId}`}>
            {index > 0 && <View style={styles.divider} />}
            <RouteCard
              route={route}
              isSelected={selectedRouteIndex === index}
              onSelect={() => onSelect(index)}
            />
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexShrink: 1,
  },
  // Both shrink so the list scrolls when the sheet hits its height limit
  container: {
    flexShrink: 1,
    marginTop: spacing.lg,
  },
  header: {
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
});
