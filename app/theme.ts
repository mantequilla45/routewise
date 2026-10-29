import { Platform, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Design tokens. Every screen styles itself from these: no raw hex colors, font names or
 * ad-hoc spacing in components. Light, neutral surfaces; amber is the single accent, used for
 * the primary action and the selected state only.
 */

export const colors = {
  // Surfaces
  background: '#FFFFFF',
  surface: '#F6F7F9', // grouped/inset areas, input fills
  surfacePressed: '#EEF0F3',
  border: '#E6E8EC', // hairlines and dividers

  // Text
  text: '#111317',
  textSecondary: '#5F6670',
  textTertiary: '#9AA0A8',
  textOnAccent: '#1A1405',
  textOnDark: '#FFFFFF',

  // Brand
  accent: '#FFC94D',
  accentPressed: '#F2B92E',
  accentSubtle: '#FFF7E0', // selected row background
  google: '#DB4437', // Google logo mark on the "Continue with Google" button only

  // Status / map
  origin: '#2563EB',
  destination: '#E5484D',
  success: '#16A34A',
  danger: '#DC2626',
  routePrimary: '#16A34A',
  routeSecondary: '#E5484D',

  // Chrome
  tabBar: '#FFFFFF',
  scrim: 'rgba(17, 19, 23, 0.4)',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  sheet: 24,
  pill: 999,
} as const;

export const fonts = {
  regular: 'Lexend_400Regular',
  medium: 'Lexend_500Medium',
  semibold: 'Lexend_600SemiBold',
  bold: 'Lexend_700Bold',
} as const;

/** Type scale. Use these instead of setting fontSize/fontFamily directly. */
export const type = StyleSheet.create({
  title: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28, color: colors.text },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: colors.text },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 20, color: colors.text },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  overline: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textTertiary,
  },
  // Bottom tab bar labels. No color: the navigator applies the active/inactive tint.
  tabLabel: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 },
  // Text on the dark route-code badge (list rows).
  badge: { fontFamily: fonts.semibold, fontSize: 14, letterSpacing: 0.3, color: colors.textOnDark },
}) satisfies Record<string, TextStyle>;

/** Only for surfaces that float above the map (sheet, overlays, map buttons). */
export const elevation: Record<'floating' | 'sheet', ViewStyle> = {
  floating: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    default: { elevation: 4 },
  })!,
  sheet: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: -2 },
    },
    default: { elevation: 12 },
  })!,
};

export const hairline = StyleSheet.hairlineWidth;

/** Shared building blocks used across screens. */
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  divider: { height: hairline, backgroundColor: colors.border },
  primaryButton: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButtonText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.textOnAccent },
  secondaryButton: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButtonText: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  input: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
});
