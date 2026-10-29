import { colors, spacing, type } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { RefObject } from 'react';
import {
  type TextInputInstance,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type TextInputProps = {
  /** True while the inline input is open; otherwise the value is shown as a tappable text. */
  active: boolean;
  onChangeText: (text: string) => void;
  /** Called on blur and on "done"; the caller closes the input and saves. */
  onDone: () => void;
};

type Props = {
  label: string;
  value: string;
  /** Whether the surrounding section is in edit mode. */
  isEditing: boolean;
  isSaving: boolean;
  /** Tapping the value while the section is in edit mode. */
  onPress: () => void;
  /** Supply to edit the value with an inline TextInput; omit for pick-from-list fields. */
  textInput?: TextInputProps;
  /** Ref to the inline TextInput, so the caller can focus it. Kept separate from `textInput`
   *  because the React Compiler treats every field of an object holding a ref as a ref. */
  inputRef?: RefObject<TextInputInstance | null>;
};

/** A settings row (label left, value right) that becomes tappable when the section is in edit mode. */
export default function EditableField({
  label,
  value,
  isEditing,
  isSaving,
  onPress,
  textInput,
  inputRef,
}: Props) {
  if (isEditing && textInput?.active) {
    return (
      <View style={styles.row}>
        <Text style={type.body}>{label}</Text>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={textInput.onChangeText}
          onBlur={textInput.onDone}
          onSubmitEditing={textInput.onDone}
          style={styles.input}
          returnKeyType="done"
        />
      </View>
    );
  }

  const valueContent = (
    <View style={styles.valueRow}>
      {isSaving && <ActivityIndicator size="small" color={colors.textTertiary} />}
      <Text style={[styles.value, isEditing && styles.valueEditable]} numberOfLines={1}>
        {value || 'Not provided'}
      </Text>
      {isEditing && <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />}
    </View>
  );

  if (!isEditing) {
    return (
      <View style={styles.row}>
        <Text style={type.body}>{label}</Text>
        {valueContent}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${label}`}
    >
      <Text style={type.body}>{label}</Text>
      {valueContent}
    </Pressable>
  );
}

/** A read-only label/value row with the same look as EditableField. */
export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={type.body}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  rowPressed: {
    backgroundColor: colors.surfacePressed,
  },
  valueRow: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    ...type.body,
    flexShrink: 1,
    color: colors.textSecondary,
  },
  valueEditable: {
    color: colors.text,
  },
  input: {
    ...type.body,
    flex: 1,
    minWidth: 120,
    textAlign: 'right',
    padding: 0,
  },
});
