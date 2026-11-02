import { backendUrl, type ExplorePlace, type PlaceCategory, type PopularPlace } from '@/lib/api';
import { motion } from '@/lib/motion';
import { colors, fonts, radius, spacing, type } from '@/theme';
import { LatLng } from '@/types/GeoTypes';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { CATEGORIES, iconForCategory } from './placeCategories';
import Skeleton from '@/components/Skeleton';

/** The place's photo, or its category icon while loading or when there is no photo. */
function Thumbnail({ place }: Readonly<{ place: ExplorePlace }>) {
  return (
    <View style={styles.thumb}>
      <Ionicons name={iconForCategory(place.category)} size={20} color={colors.textTertiary} />
      {place.photo && (
        <Image
          source={{ uri: backendUrl(place.photo.path) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
          recyclingKey={place.placeId}
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}

// Widths of the loading chips, roughly those of the category names
const CHIP_WIDTHS = [44, 64, 72, 84, 80];

export type CategoryFilter = PlaceCategory | 'all';

/** Placeholder rows (photo square, three text lines) while places load. */
function SkeletonRows({ count }: Readonly<{ count: number }>) {
  return (
    <View>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton width={56} height={56} radius={radius.md} />
          <View style={styles.rowText}>
            <Skeleton width={i % 2 ? '55%' : '70%'} height={15} />
            <Skeleton width="40%" height={12} />
            <Skeleton width="30%" height={9} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * "Popular places" and its category chips. Home pins this to the top of its scroll view, so it
 * takes over from the saved routes once they've scrolled away. Has its own white background so
 * the list doesn't show through. Chip shapes while places load.
 */
export function PopularPlacesHeader({
  places,
  category,
  onCategoryChange,
}: Readonly<{
  places: PopularPlace[] | null;
  category: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
}>) {
  if (places && places.length === 0) return <View />;
  const available = places
    ? CATEGORIES.filter((c) => c.key === 'all' || places.some((p) => p.category === c.key))
    : [];

  return (
    <View style={styles.header}>
      <Text style={[type.overline, styles.title]}>Popular places</Text>
      {places ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsScroll}
        >
          {available.map((c) => {
            const active = c.key === category;
            return (
              <Pressable
                key={c.key}
                onPress={() => onCategoryChange(c.key)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <View style={[styles.chips, styles.skeletonChips]}>
          {CHIP_WIDTHS.map((width, i) => (
            <Skeleton key={i} width={width} height={30} radius={radius.pill} />
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * The popular places in the chosen category as rows (photo, name, area); tapping one starts a
 * trip there. Rows of placeholder shapes while places load. Scrolls with Home, not on its own.
 */
export function PopularPlacesList({
  places,
  more = [],
  loadingMore = false,
  category,
  onSelect,
}: Readonly<{
  places: PopularPlace[] | null;
  /** Further places loaded as the list scrolls, after the curated ones. */
  more?: ExplorePlace[];
  loadingMore?: boolean;
  category: CategoryFilter;
  onSelect: (point: LatLng, name: string) => void;
}>) {
  if (!places) return <SkeletonRows count={5} />;

  const curated: ExplorePlace[] =
    category === 'all' ? places : places.filter((p) => p.category === category);
  const shown = [...curated, ...more];
  return (
    <View>
      {shown.map((place, index) => (
        // New rows fade in; no layout animation, which gets heavy on a long, growing list
        <Animated.View key={`${category}-${place.placeId}`} entering={motion.enter}>
          {index > 0 && <View style={styles.divider} />}
          <Pressable
            onPress={() => onSelect(place.location, place.name)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            accessibilityRole="button"
          >
            <Thumbnail place={place} />
            <View style={styles.rowText}>
              <Text style={type.bodyMedium} numberOfLines={1}>
                {place.name}
              </Text>
              <Text style={type.caption} numberOfLines={1}>
                {place.area}
              </Text>
              {place.photo && (
                // Google requires the photo's author to be shown with it
                <Text style={styles.credit} numberOfLines={1}>
                  Photo: {place.photo.attribution}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        </Animated.View>
      ))}
      {loadingMore && <SkeletonRows count={2} />}
    </View>
  );
}

const styles = StyleSheet.create({
  // Pinned while scrolling: full width and white, so rows pass underneath cleanly
  header: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    marginBottom: spacing.sm,
  },
  // Chips scroll edge to edge, past the screen's side padding
  chipsScroll: {
    // A horizontal ScrollView in a growing column stretches to fill it; keep it chip-height
    flexGrow: 0,
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.md,
  },
  // The loading chips sit where the real ones scroll, without scrolling
  skeletonChips: {
    flexDirection: 'row',
    overflow: 'hidden',
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.md,
  },
  chips: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.text,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textOnDark,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 76,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  credit: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textTertiary,
  },
  rowText: {
    flex: 1,
    gap: spacing.xxs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 72,
  },
});
