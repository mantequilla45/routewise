import type { PlaceCategory } from '@/lib/api';
import { motion } from '@/lib/motion';
import { colors, fonts, radius, spacing, type } from '@/theme';
import { LatLng } from '@/types/GeoTypes';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { CATEGORIES, iconForCategory } from './placeCategories';
import usePopularPlaces from './usePopularPlaces';

/**
 * Well-known destinations, filterable by category; tapping one starts a trip there. Fills the
 * remaining height: the heading and chips stay put, only the list scrolls.
 */
export default function PopularPlaces({
  onSelect,
}: Readonly<{ onSelect: (point: LatLng, name: string) => void }>) {
  const places = usePopularPlaces();
  const [category, setCategory] = useState<PlaceCategory | 'all'>('all');

  if (!places || places.length === 0) return null;

  const available = CATEGORIES.filter(
    (c) => c.key === 'all' || places.some((p) => p.category === c.key),
  );
  const shown = category === 'all' ? places : places.filter((p) => p.category === category);

  return (
    <View style={styles.section}>
      <Text style={[type.overline, styles.title]}>Popular places</Text>

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
              onPress={() => setCategory(c.key)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {shown.map((place, index) => (
          <Animated.View
            key={`${category}-${place.name}`}
            entering={motion.enter}
            layout={motion.layout}
          >
            {index > 0 && <View style={styles.divider} />}
            <Pressable
              onPress={() => onSelect(place.location, place.name)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              accessibilityRole="button"
            >
              <View style={styles.icon}>
                <Ionicons name={iconForCategory(place.category)} size={18} color={colors.text} />
              </View>
              <View style={styles.rowText}>
                <Text style={type.bodyMedium} numberOfLines={1}>
                  {place.name}
                </Text>
                <Text style={type.caption} numberOfLines={1}>
                  {place.area}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flex: 1,
    marginTop: spacing.xl,
  },
  list: {
    flex: 1,
    // Bleed to the screen edges so the scroll area isn't clipped inside the side padding
    marginHorizontal: -spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
    minHeight: 60,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  icon: {
    width: 36,
    height: 36,
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
    marginLeft: 52,
  },
});
