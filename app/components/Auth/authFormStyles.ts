import { colors, spacing, type, ui } from '@/theme';
import { StyleSheet } from 'react-native';

// Fields and the submit button: a little shorter than the app's default 48–50pt, for a compact
// sign-in sheet.
const FIELD_HEIGHT = 46;

/** Styles shared by LoginForm and SignupForm and the pieces under components/Auth. */
export const authFormStyles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  field: {
    gap: spacing.xs,
  },
  input: {
    ...ui.input,
    height: FIELD_HEIGHT,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    height: FIELD_HEIGHT,
    borderRadius: ui.input.borderRadius,
    backgroundColor: colors.surface,
    paddingLeft: spacing.lg,
  },
  inputInner: {
    ...ui.input,
    flex: 1,
    height: '100%',
    paddingHorizontal: 0,
  },
  iconButton: {
    height: '100%',
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  compactButton: {
    height: FIELD_HEIGHT,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionText: {
    ...type.caption,
    color: colors.text,
  },
  linkText: {
    ...type.label,
    color: colors.text,
  },
  pressed: {
    opacity: 0.7,
  },
  primaryPressed: {
    backgroundColor: colors.accentPressed,
  },
  secondaryPressed: {
    backgroundColor: colors.surfacePressed,
  },
  disabled: {
    opacity: 0.6,
  },
});
