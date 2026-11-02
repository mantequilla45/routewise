import React from 'react';
import { Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { GOOGLE_ICON } from '@/constants';
import { authFormStyles as styles } from '@/components/Auth/authFormStyles';
import { ui } from '@/theme';

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
      <Image source={GOOGLE_ICON} style={{ width: 18, height: 18 }} contentFit="contain" />
      <Text style={ui.secondaryButtonText}>Continue with Google</Text>
    </Pressable>
  );
}
