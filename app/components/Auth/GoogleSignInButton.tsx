import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { authFormStyles as styles } from '@/components/Auth/authFormStyles';

type Props = {
  onPress: () => void;
};

/** White "Google" button used by both the login and signup forms. */
export default function GoogleSignInButton({ onPress }: Props) {
  return (
    <TouchableOpacity style={styles.googlebutton} onPress={onPress}>
      <View style={styles.googlebuttonContent}>
        <AntDesign name="google" size={20} color="#DB4437" style={styles.googleIcon} />
        <Text style={styles.googlebuttonText}>Google</Text>
      </View>
    </TouchableOpacity>
  );
}
