import { colors, spacing, type, ui } from '@/theme';
import { StyleSheet } from 'react-native';

/** Styles shared by LoginForm and SignupForm and the pieces under components/Auth. */
export const authFormStyles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  input: {
    ...ui.input,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ui.input.height,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    ...ui.divider,
    flex: 1,
  },
  dividerText: {
    ...type.caption,
    color: colors.textTertiary,
  },
  terms: {
    ...type.caption,
    textAlign: 'center',
  },
  termsLink: {
    color: colors.text,
    textDecorationLine: 'underline',
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
