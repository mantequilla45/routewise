import { RefObject } from 'react';
import {
  type TextInputInstance,
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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

/** A label/value row in the account section that can be edited when the section is in edit mode. */
export default function EditableField({
  label,
  value,
  isEditing,
  isSaving,
  onPress,
  textInput,
  inputRef,
}: Props) {
  const valueRow = (
    <View style={styles.valueRow}>
      <Text style={styles.value}>{value || 'Not provided'}</Text>
      {isSaving && <ActivityIndicator size="small" style={styles.spinner} />}
    </View>
  );

  return (
    <View style={[styles.row, isEditing && styles.rowActive]}>
      <Text style={styles.label}>{isEditing ? `${label}**` : label}</Text>
      {isEditing && textInput?.active ? (
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={textInput.onChangeText}
          onBlur={textInput.onDone}
          onSubmitEditing={textInput.onDone}
          style={[styles.value, styles.input]}
          returnKeyType="done"
        />
      ) : isEditing ? (
        <TouchableOpacity onPress={onPress} style={styles.valueButton}>
          {valueRow}
        </TouchableOpacity>
      ) : (
        valueRow
      )}
    </View>
  );
}

/** A read-only label/value row with the same look as EditableField. */
export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowActive: {
    backgroundColor: '#f0f8f0',
    borderBottomColor: '#4CAF50',
    borderBottomWidth: 2,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Lexend_400Regular',
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontFamily: 'Lexend_400Regular',
    color: '#333',
  },
  input: {
    fontSize: 14,
    fontFamily: 'Lexend_400Regular',
    color: '#333',
    textAlign: 'right',
    minWidth: 120,
    padding: 0,
  },
  valueButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    marginLeft: 8,
  },
});
