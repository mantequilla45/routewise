import type { SavedRoute } from '@/app/(tabs)/saved';
import PlaceName from '@/components/SavedRoute/PlaceName';
import { colors, fonts, hairline, radius, spacing, type } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Fragment } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

function SavedRouteRow({
  route,
  onOpen,
  onDelete,
}: Readonly<{ route: SavedRoute; onOpen: () => void; onDelete: () => void }>) {
  const codes = route.jeepCode.split(' → ');
  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityHint="Shows this route on the map"
    >
      <View style={styles.top}>
        <View style={styles.codes}>
          {codes.map((code, i) => (
            <Fragment key={`${code}-${i}`}>
              {i > 0 && <Ionicons name="chevron-forward" size={12} color={colors.textTertiary} />}
              <View style={styles.chip}>
                <Text style={styles.chipText}>{code}</Text>
              </View>
            </Fragment>
          ))}
        </View>
        {route.totalFare != null && <Text style={styles.fare}>₱{route.totalFare}</Text>}
      </View>

      <View style={styles.bottom}>
        {/* From and to, joined by a short line, like the trip sheet */}
        <View style={styles.ends}>
          <View style={styles.rail}>
            <View style={[styles.dot, { backgroundColor: colors.origin }]} />
            <View style={styles.railLine} />
            <View style={[styles.dot, { backgroundColor: colors.destination }]} />
          </View>
          <View style={styles.names}>
            <PlaceName
              name={route.start}
              lat={route.startLat}
              lng={route.startLng}
              style={styles.place}
            />
            <PlaceName
              name={route.destination}
              lat={route.endLat}
              lng={route.endLng}
              style={styles.place}
            />
          </View>
        </View>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={({ pressed }) => [styles.delete, pressed && styles.deletePressed]}
          accessibilityRole="button"
          accessibilityLabel="Delete saved route"
        >
          <Ionicons name="trash-outline" size={17} color={colors.textTertiary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

/** The signed-in user's saved routes: jeeps and fare, then where from and to. Tap to plan it. */
export default function SavedRouteList({
  routes,
  onRouteSelect,
  onDelete,
}: Readonly<{
  routes: SavedRoute[];
  onRouteSelect: (route: SavedRoute) => void;
  onDelete: (id: string) => void;
}>) {
  return (
    <FlatList<SavedRoute>
      data={routes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SavedRouteRow
          route={item}
          onOpen={() => onRouteSelect(item)}
          onDelete={() => onDelete(item.id)}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.divider} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: spacing.xxl,
  },
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  codes: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  chip: {
    backgroundColor: colors.text,
    borderRadius: radius.sm - 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipText: {
    ...type.badge,
    fontSize: 13,
  },
  fare: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ends: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
  },
  rail: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  railLine: {
    flex: 1,
    width: 2,
    marginVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  names: {
    flex: 1,
    gap: spacing.sm,
  },
  place: {
    ...type.body,
  },
  delete: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePressed: {
    backgroundColor: colors.surfacePressed,
  },
  divider: {
    height: hairline,
    marginLeft: spacing.lg,
    backgroundColor: colors.border,
  },
});
