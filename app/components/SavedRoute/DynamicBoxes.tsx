import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SavedRoute } from '@/app/(tabs)/saved';
import { colors, hairline, radius, spacing, type } from '@/theme';

interface DynamicBoxesProps {
  routes: SavedRoute[];
  onToggleFavorite: (id: string) => void;
  onRouteSelect?: (route: SavedRoute) => void;
  onDelete?: (id: string) => void;
}

function RowDivider() {
  return <View style={styles.rowDivider} />;
}

export default function DynamicBoxes({ routes, onRouteSelect, onDelete }: DynamicBoxesProps) {
  const renderRoute = ({ item }: { item: SavedRoute }) => {
    const codes = item.jeepCode.split(' → ');
    return (
      <Pressable
        onPress={() => onRouteSelect && onRouteSelect(item)}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        accessibilityRole="button"
        accessibilityHint="Shows this route on the map"
      >
        <View style={styles.main}>
          <View style={styles.codes}>
            {codes.map((code, index) => (
              <React.Fragment key={`${code}-${index}`}>
                {index > 0 && (
                  <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
                )}
                <View style={styles.badge}>
                  <Text style={type.badge}>{code}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
          <Text style={type.caption} numberOfLines={1}>
            {item.start}
          </Text>
          <View style={styles.toLine}>
            <Ionicons name="arrow-forward" size={12} color={colors.textTertiary} />
            <Text style={[type.caption, styles.flex]} numberOfLines={1}>
              {item.destination}
            </Text>
          </View>
        </View>

        <View style={styles.side}>
          {item.totalFare != null && <Text style={type.heading}>₱{item.totalFare}</Text>}
          <Pressable
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering route selection
              onDelete && onDelete(item.id);
            }}
            hitSlop={spacing.sm}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.deletePressed]}
            accessibilityRole="button"
            accessibilityLabel="Delete saved route"
          >
            <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  if (routes.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="bookmark-outline" size={40} color={colors.textTertiary} />
        <Text style={type.heading}>No saved routes yet</Text>
        <Text style={type.caption}>Start saving your favorite routes!</Text>
      </View>
    );
  }

  return (
    <FlatList<SavedRoute>
      data={routes}
      renderItem={renderRoute}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={RowDivider}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing.xxl,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  main: {
    flex: 1,
    gap: spacing.xxs,
  },
  codes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: spacing.xs,
  },
  badge: {
    backgroundColor: colors.text,
    borderRadius: radius.sm - 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  toLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
  },
  side: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  deleteButton: {
    padding: spacing.xs,
    borderRadius: radius.pill,
  },
  deletePressed: {
    backgroundColor: colors.surfacePressed,
  },
  rowDivider: {
    height: hairline,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
});
