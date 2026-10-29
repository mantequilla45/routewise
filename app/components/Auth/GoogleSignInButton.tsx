import React from 'react';
import { Text, Pressable } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { authFormStyles as styles } from '@/components/Auth/authFormStyles';
import { colors, ui } from '@/theme';

type Props = {
  onPress: () => void;
};

/** Secondary "Continue with Google" button used by both the login and signup forms. */
export default function GoogleSignInButton({ onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [ui.secondaryButton, pressed && styles.secondaryPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <AntDesign name="google" size={18} color={colors.google} />
      <Text style={ui.secondaryButtonText}>Continue with Google</Text>
    </Pressable>
  );
}
