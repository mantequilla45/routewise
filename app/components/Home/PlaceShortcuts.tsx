import { clearRecentPlaces, useRecentPlaces } from '@/lib/recentPlaces';
import { colors, radius, spacing, type } from '@/theme';
import { LatLng } from '@/types/GeoTypes';
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { iconForCategory } from './placeCategories';
import usePopularPlaces from './usePopularPlaces';

type IconName = ComponentProps<typeof Ionicons>['name'];

function ShortcutRow({
  icon,
  title,
  subtitle,
  onPress,
}: Readonly<{ icon: IconName; title: string; subtitle?: string; onPress: () => void }>) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
    >
      <View style={styles.icon}>
        <Ionicons name={icon} size={17} color={colors.textSecondary} />
      </View>
      <View style={styles.rowText}>
        <Text style={type.bodyMedium} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={type.caption} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/**
 * Quick picks for an empty search: places chosen recently on this device and, optionally, a
 * few popular destinations. Renders nothing when there is nothing to show.
 */
export default function PlaceShortcuts({
  onSelect,
  maxRecent = 5,
  popularCount = 0,
}: Readonly<{
  onSelect: (point: LatLng, name: string) => void;
  maxRecent?: number;
  /** How many popular places to list under the recents (0 to hide). */
  popularCount?: number;
}>) {
  const recent = useRecentPlaces().slice(0, maxRecent);
  const popular = usePopularPlaces() ?? [];
  // Don't repeat a popular place that's already in Recent
  const popularShown = popular
    .filter((p) => !recent.some((r) => r.name === p.name))
    .slice(0, popularCount);

  if (recent.length === 0 && popularShown.length === 0) return null;

  return (
    <View>
      {recent.length > 0 && (
        <View style={styles.section}>
          <View style={styles.header}>
            <Text style={type.overline}>Recent</Text>
            <Pressable onPress={clearRecentPlaces} hitSlop={8} accessibilityRole="button">
              <Text style={styles.clear}>Clear</Text>
            </Pressable>
          </View>
          {recent.map((place, i) => (
            <View key={`${place.name}-${i}`}>
              {i > 0 && <View style={styles.divider} />}
              <ShortcutRow
                icon="time-outline"
                title={place.name}
                onPress={() => onSelect(place.location, place.name)}
              />
            </View>
          ))}
        </View>
      )}

      {popularShown.length > 0 && (
        <View style={styles.section}>
          <View style={styles.header}>
            <Text style={type.overline}>Popular</Text>
          </View>
          {popularShown.map((place, i) => (
            <View key={place.name}>
              {i > 0 && <View style={styles.divider} />}
              <ShortcutRow
                icon={iconForCategory(place.category)}
                title={place.name}
                subtitle={place.area}
                onPress={() => onSelect(place.location, place.name)}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  clear: {
    ...type.label,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: spacing.xxs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 48,
  },
});
