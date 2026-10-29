import { colors, spacing, type } from '@/theme';
import { MappedGeoRouteResult } from '@/types/GeoTypes';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import RouteCard from './RouteCard';

/** Scrollable list of route results, fastest first. Renders nothing when there are no results. */
export default function RouteResultsList({
  results,
  selectedRouteIndex,
  onSelect,
}: Readonly<{
  results: MappedGeoRouteResult[];
  selectedRouteIndex: number | null;
  onSelect: (index: number) => void;
}>) {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[type.overline, styles.header]}>
        {results.length} {results.length === 1 ? 'route' : 'routes'} · fastest first
      </Text>
      <ScrollView
        style={styles.scrollView}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  header: {
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  scrollView: {
    maxHeight: 360,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
});
