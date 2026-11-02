import { colors, elevation, radius, spacing, type } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { type ComponentRef, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export type RouteSort = 'code' | 'codeDesc' | 'start' | 'end';

const OPTIONS: { value: RouteSort; label: string; short: string }[] = [
  { value: 'code', label: 'Route code, A–Z', short: 'Code A–Z' },
  { value: 'codeDesc', label: 'Route code, Z–A', short: 'Code Z–A' },
  { value: 'start', label: 'Starting point, A–Z', short: 'Start A–Z' },
  { value: 'end', label: 'Destination, A–Z', short: 'End A–Z' },
];

// Natural order ("MI-4" before "MI-10"), ignoring case ("62b" with "62C")
const compare = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

/** Route names are "Start - End"; one side of it, for sorting by place. */
const end = (name: string, side: 0 | 1) => name.split(' - ')[side] ?? '';

/**
 * Orders routes ({ route_id: the jeep code, route_code: "Start - End" }) for the list. Ties on a
 * place fall back to the code, so routes from the same place stay in code order.
 */
export function sortRoutes<T extends { route_id: string; route_code: string }>(
  routes: T[],
  sort: RouteSort,
): T[] {
  const byCode = (a: T, b: T) => compare(a.route_id, b.route_id);
  return [...routes].sort((a, b) => {
    switch (sort) {
      case 'codeDesc':
        return -byCode(a, b);
      case 'start':
        return compare(end(a.route_code, 0), end(b.route_code, 0)) || byCode(a, b);
      case 'end':
        return compare(end(a.route_code, 1), end(b.route_code, 1)) || byCode(a, b);
      default:
        return byCode(a, b);
    }
  });
}

// Gap between the button and the menu under it
const MENU_GAP = 6;

/**
 * The sort button, showing the current order. Tapping it drops a small menu of orders just under
 * it, right-aligned to it; picking one or tapping anywhere else closes it.
 */
export default function RouteSortMenu({
  value,
  onChange,
}: Readonly<{ value: RouteSort; onChange: (sort: RouteSort) => void }>) {
  const buttonRef = useRef<ComponentRef<typeof View>>(null);
  const { width: screenWidth } = useWindowDimensions();
  // Where the menu goes: under the button, its right edge lined up with the button's
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);

  const open = () =>
    buttonRef.current?.measureInWindow((x, y, width, height) =>
      setAnchor({ top: y + height + MENU_GAP, right: screenWidth - (x + width) }),
    );
  const close = () => setAnchor(null);
  const current = OPTIONS.find((o) => o.value === value);

  return (
    <>
      <Pressable
        ref={buttonRef}
        onPress={open}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Sorted by ${current?.label}. Change sort`}
        accessibilityState={{ expanded: !!anchor }}
      >
        <Ionicons name="swap-vertical" size={14} color={colors.textSecondary} />
        <Text style={type.label}>{current?.short}</Text>
      </Pressable>

      {/* Transparent and full screen only to catch the tap outside that closes the menu */}
      <Modal visible={!!anchor} transparent animationType="none" onRequestClose={close}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close" />
        {anchor && (
          <Animated.View
            entering={FadeIn.duration(120)}
            exiting={FadeOut.duration(100)}
            style={[styles.menu, anchor]}
            accessibilityRole="menu"
          >
            {OPTIONS.map((option) => {
              const isSelected = value === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    close();
                  }}
                  style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={isSelected ? type.bodyMedium : type.body}>{option.label}</Text>
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={isSelected ? colors.text : 'transparent'}
                  />
                </Pressable>
              );
            })}
          </Animated.View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  buttonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  menu: {
    position: 'absolute',
    minWidth: 220,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    ...elevation.floating,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  optionPressed: {
    backgroundColor: colors.surface,
  },
});
