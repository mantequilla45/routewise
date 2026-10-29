import { MultiRouteResult } from '@/services/routes/calculateMultiRoutes';
import { colors, fonts, radius, spacing, type } from '@/theme';
import { MappedGeoRouteResult } from '@/types/GeoTypes';
import { Ionicons } from '@expo/vector-icons';
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
  route: MappedGeoRouteResult | MultiRouteResult;
  isSelected?: boolean;
  onSelect?: () => void;
};

/** One route result row: jeep code(s), estimated time, walking, and fare. */
export default function RouteCard({
  route,
  isSelected = false,
  onSelect,
}: Readonly<RouteCardProps>) {
  const isTransfer = 'isTransfer' in route && route.isTransfer;
  const fare = isTransfer && route.totalFare ? route.totalFare : route.fare;
  const rideMeters = route.distance ?? route.distanceMeters;
  const hasWalk = route.boardingWalk != null && route.alightingWalk != null;
  const totalWalk = hasWalk ? route.boardingWalk! + route.alightingWalk! : null;

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
          {isTransfer ? (
            <>
              <RouteBadge code={route.firstRoute?.routeCode || route.firstRoute?.routeId || '?'} />
              <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
              <RouteBadge
                code={route.secondRoute?.routeCode || route.secondRoute?.routeId || '?'}
              />
            </>
          ) : (
            <RouteBadge code={route.routeCode || route.routeId} />
          )}
          {route.estimatedMinutes != null && (
            <Text style={styles.minutes}>{route.estimatedMinutes} min</Text>
          )}
        </View>

        <View style={styles.meta}>
          {totalWalk != null && (
            <View style={styles.metaItem}>
              <Ionicons name="walk" size={13} color={colors.textSecondary} />
              <Text style={type.caption}>{formatMeters(totalWalk)}</Text>
            </View>
          )}
          {rideMeters != null && (
            <View style={styles.metaItem}>
              <Ionicons name="bus-outline" size={13} color={colors.textSecondary} />
              <Text style={type.caption}>{formatMeters(rideMeters)}</Text>
            </View>
          )}
          {isTransfer && <Text style={type.caption}>1 transfer</Text>}
        </View>
      </View>

      <View style={styles.fareBlock}>
        <Text style={styles.fare}>₱{fare}</Text>
        {isTransfer && (
          <Text style={type.caption}>
            ₱{route.firstRoute?.fare} + ₱{route.secondRoute?.fare}
          </Text>
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
