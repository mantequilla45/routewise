import React from 'react';
import { Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authFormStyles as styles } from '@/components/Auth/authFormStyles';
import { colors } from '@/theme';

type Props = {
  checked: boolean;
  onToggle: () => void;
};

/** "Remember me" checkbox for the left side of the auth forms' options row. */
export default function RememberMeCheckbox({ checked, onToggle }: Props) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.checkboxRow, pressed && styles.pressed]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={8}
    >
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={20}
        color={checked ? colors.text : colors.textTertiary}
      />
      <Text style={styles.optionText}>Remember me</Text>
    </Pressable>
  );
}
