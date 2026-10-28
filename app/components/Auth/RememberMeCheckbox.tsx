import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authFormStyles as styles } from '@/components/Auth/authFormStyles';

type Props = {
  checked: boolean;
  onToggle: () => void;
};

/** "Remember me" checkbox for the left half of the auth forms' options row. */
export default function RememberMeCheckbox({ checked, onToggle }: Props) {
  return (
    <View style={styles.firsthalf}>
      <TouchableOpacity onPress={onToggle}>
        <Ionicons
          name={checked ? 'checkbox' : 'square-outline'}
          size={24}
          color={checked ? '#FFFFFF' : '#585756'}
        />
      </TouchableOpacity>

      <Text style={styles.rememberText}>Remember me</Text>
    </View>
  );
}
