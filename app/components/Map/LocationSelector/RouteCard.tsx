import { colors, fonts, radius, spacing, type } from '@/theme';
import { TripOption } from '@/types/GeoTypes';
import { Ionicons } from '@expo/vector-icons';
import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function formatMeters(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

function RouteBadge({ code }: Readonly<{ code: string }>) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{code}</Text>
    </View>
  );
}

type RouteCardProps = {
  route: TripOption;
  isSelected?: boolean;
  onSelect?: () => void;
};

/** One trip option row: jeep code(s) in riding order, estimated time, walking, and fare. */
export default function RouteCard({
  route,
  isSelected = false,
  onSelect,
}: Readonly<RouteCardProps>) {
  const transfers = route.legs.length - 1;
  const totalWalk =
    route.boardingWalk + route.alightingWalk + route.transferWalks.reduce((sum, w) => sum + w, 0);

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.row,
        isSelected && styles.rowSelected,
        pressed && styles.rowPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <View style={styles.main}>
        <View style={styles.codes}>
          {route.legs.map((leg, i) => (
            <Fragment key={`${leg.routeId}-${i}`}>
              {i > 0 && <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />}
              <RouteBadge code={leg.routeCode} />
            </Fragment>
          ))}
          <Text style={styles.minutes}>{route.estimatedMinutes} min</Text>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="walk" size={13} color={colors.textSecondary} />
            <Text style={type.caption}>{formatMeters(totalWalk)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="bus-outline" size={13} color={colors.textSecondary} />
            <Text style={type.caption}>{formatMeters(route.distance)}</Text>
          </View>
          {transfers > 0 && (
            <Text style={type.caption}>
              {transfers} {transfers === 1 ? 'transfer' : 'transfers'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.fareBlock}>
        <Text style={styles.fare}>₱{route.fare}</Text>
        {transfers > 0 && (
          <Text style={type.caption}>{route.legs.map((leg) => `₱${leg.fare}`).join(' + ')}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  rowSelected: {
    backgroundColor: colors.accentSubtle,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  main: {
    flex: 1,
    gap: spacing.xs + 2,
  },
  codes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  badge: {
    backgroundColor: colors.text,
    borderRadius: radius.sm - 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.textOnDark,
  },
  minutes: {
    ...type.bodyMedium,
    marginLeft: spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fareBlock: {
    alignItems: 'flex-end',
  },
  fare: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.text,
  },
});
