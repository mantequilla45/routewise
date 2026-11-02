import { legColor } from '@/components/Map/LocationSelector/buildPolylines';
import { colors, elevation, radius, spacing, type } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

/** "Busay, Cebu City" → ["Busay", "Cebu City"]: the place, then where it is (if given). */
const splitPlace = (name: string) => {
  const [place, ...rest] = name.split(',');
  return [place.trim(), rest.join(',').trim()] as const;
};

function Place({ name }: Readonly<{ name: string }>) {
  const [place, area] = splitPlace(name);
  return (
    <Text style={type.bodyMedium} numberOfLines={1}>
      {place}
      {!!area && <Text style={styles.area}>, {area}</Text>}
    </Text>
  );
}

/**
 * Bottom card for a route opened from the Routes tab: its code, then where it runs from and to,
 * joined by a line in the route's color (the order the jeep goes).
 */
export default function ListRouteCard({ code, name }: Readonly<{ code: string; name: string }>) {
  const [start, end = ''] = name.split(' - ');
  const color = legColor(0);
  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(160)}
      style={styles.card}
      accessible
      accessibilityLabel={`Route ${code}, from ${start} to ${end}`}
    >
      <View style={styles.chip}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.code}>{code}</Text>
      </View>

      <View style={styles.ends}>
        <View style={styles.rail}>
          <View style={[styles.stop, { borderColor: color }]} />
          <View style={[styles.railLine, { backgroundColor: color }]} />
          <View style={[styles.stop, { borderColor: color, backgroundColor: color }]} />
        </View>
        <View style={styles.names}>
          <Place name={start} />
          {!!end && <Place name={end} />}
        </View>
      </View>
    </Animated.View>
  );
}

const STOP = 10;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingRight: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    ...elevation.floating,
  },
  // The route code, same dark chip as the Routes tab badge
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.text,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  code: {
    ...type.badge,
    fontSize: 15,
  },
  ends: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  // Hollow ring where the route starts, filled one where it ends
  rail: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  stop: {
    width: STOP,
    height: STOP,
    borderRadius: radius.pill,
    borderWidth: 2.5,
    backgroundColor: colors.background,
  },
  railLine: {
    flex: 1,
    width: 2,
    marginVertical: 2,
    borderRadius: radius.pill,
  },
  names: {
    flex: 1,
    gap: spacing.sm,
  },
  area: {
    fontFamily: type.body.fontFamily,
    color: colors.textSecondary,
  },
});
