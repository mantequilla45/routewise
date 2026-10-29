import { colors, radius, spacing, type, ui } from '@/theme';
import { LatLng } from '@/types/GeoTypes';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';
import { motion } from '@/lib/motion';
import Animated from 'react-native-reanimated';
import OptionRow from './OptionRow';
import usePlaceSearch from './usePlaceSearch';

type Props = {
  placeholder: string;
  near?: LatLng | null;
  onSelectPlace: (point: LatLng, name: string) => void;
  onChooseOnMap: () => void;
  /** Shown under the field while nothing is typed (e.g. current location, choose on map). */
  children?: ReactNode;
  /** Called when the field gains or loses focus, e.g. to hide other content while searching. */
  onActiveChange?: (active: boolean) => void;
  /** Show a Cancel button next to the field (and call this when tapped). */
  onCancel?: () => void;
  autoFocus?: boolean;
  large?: boolean;
  /** Fill the parent and scroll the area under the field (full-screen use, e.g. Home). */
  scrollable?: boolean;
};

/** The area under the field: a plain view, or a scroll view that fills the rest of the screen. */
function Body({ scrollable, children }: { scrollable: boolean; children: ReactNode }) {
  if (!scrollable) return <>{children}</>;
  return (
    <ScrollView
      style={styles.fill}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {children}
    </ScrollView>
  );
}

/**
 * A real search field: type where it is, suggestions appear underneath. With no text, renders
 * `children` instead (the non-search options); "Choose on map" stays under the suggestions.
 */
export default function InlinePlaceSearch({
  placeholder,
  near,
  onSelectPlace,
  onChooseOnMap,
  children,
  onActiveChange,
  onCancel,
  autoFocus = false,
  large = false,
  scrollable = false,
}: Props) {
  const search = usePlaceSearch(near);
  const inputRef = useRef<TextInputInstance>(null);
  // Latest text, read on blur: the blur can arrive after a reset, when render state is stale
  const textRef = useRef('');

  const onChangeText = (text: string) => {
    textRef.current = text;
    search.onChangeText(text);
  };

  const cancel = () => {
    textRef.current = '';
    search.reset();
    inputRef.current?.blur();
    onCancel?.();
  };

  return (
    <View style={scrollable && styles.fill}>
      <Animated.View layout={motion.layout} style={styles.fieldRow}>
        <View style={[styles.field, large && styles.fieldLarge]}>
          <Ionicons name="search" size={large ? 20 : 18} color={colors.textSecondary} />
          <TextInput
            ref={inputRef}
            value={search.query}
            onChangeText={onChangeText}
            onFocus={() => onActiveChange?.(true)}
            onBlur={() => onActiveChange?.(textRef.current.trim().length >= 2)}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, large && styles.inputLarge]}
            autoFocus={autoFocus}
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.isSearching && <ActivityIndicator size="small" color={colors.textTertiary} />}
        </View>
        {onCancel && (
          <Animated.View entering={motion.enter} exiting={motion.exit}>
            <Pressable onPress={cancel} hitSlop={8} accessibilityRole="button">
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>

      <Body scrollable={scrollable}>
        {!search.hasQuery ? (
          <Animated.View key="options" entering={motion.enter} exiting={motion.exit}>
            {children}
          </Animated.View>
        ) : (
          <Animated.View
            key="results"
            entering={motion.enter}
            exiting={motion.exit}
            layout={motion.layout}
            style={styles.results}
          >
            {search.suggestions.map((item, index) => (
              <Animated.View key={item.placeId} entering={motion.enter} layout={motion.layout}>
                {index > 0 && <View style={styles.divider} />}
                <Pressable
                  onPress={async () => {
                    const point = await search.choose(item);
                    if (point) {
                      textRef.current = '';
                      inputRef.current?.blur();
                      onSelectPlace(point, item.name);
                    }
                  }}
                  disabled={search.openingId !== null}
                  style={({ pressed }) => [styles.result, pressed && styles.resultPressed]}
                  accessibilityRole="button"
                >
                  <View style={styles.resultIcon}>
                    <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                  </View>
                  <View style={styles.resultText}>
                    <Text style={type.bodyMedium} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {!!item.address && (
                      <Text style={type.caption} numberOfLines={1}>
                        {item.address}
                      </Text>
                    )}
                  </View>
                  {search.openingId === item.placeId && (
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                  )}
                </Pressable>
              </Animated.View>
            ))}

            {!search.isSearching && search.suggestions.length === 0 && (
              <Text style={[type.caption, styles.empty]}>
                {search.failed ? "Couldn't search right now. Try again." : 'No places found.'}
              </Text>
            )}

            <View style={styles.divider} />
            <OptionRow
              icon="map-outline"
              iconColor={colors.textSecondary}
              label="Choose on map"
              onPress={() => {
                cancel();
                onChooseOnMap();
              }}
            />
          </Animated.View>
        )}
      </Body>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  field: {
    ...ui.input,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fieldLarge: {
    height: 56,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: ui.input.fontFamily,
    fontSize: ui.input.fontSize,
    color: colors.text,
  },
  inputLarge: {
    fontSize: 16,
  },
  cancel: {
    ...type.bodyMedium,
    color: colors.textSecondary,
  },
  results: {
    marginTop: spacing.xs,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 60,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  resultPressed: {
    backgroundColor: colors.surface,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: {
    flex: 1,
    gap: spacing.xxs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 52,
  },
  empty: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
});
