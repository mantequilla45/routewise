import { MappedGeoRouteResult } from '@/types/GeoTypes';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import RouteCard from './RouteCard';

/** Scrollable list of route results. Renders nothing when there are no results. */
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
    <View style={styles.routeList}>
      <Text style={styles.resultsTitle}>Results</Text>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.routeCardContainer}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        scrollEnabled={true}
      >
        {results.map((route, index) => {
          return (
            <RouteCard
              key={`route-${index}-${route.routeId}`}
              route={route}
              isSelected={selectedRouteIndex === index}
              onSelect={() => onSelect(index)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  routeList: {
    marginTop: 10,
    width: '100%',
    minHeight: 400,
    maxHeight: 800,
  },

  resultsTitle: {
    color: 'white',
    fontFamily: 'Lexend_400Regular',
    marginBottom: 10,
  },

  scrollView: {
    maxHeight: 400,
  },

  routeCardContainer: {
    paddingBottom: 10,
    gap: 15,
  },
});
