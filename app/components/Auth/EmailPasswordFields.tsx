import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authFormStyles as styles } from '@/components/Auth/authFormStyles';
import { colors, type } from '@/theme';

type Props = {
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
};

/** Labelled email and password inputs; the password field has a show/hide toggle. */
export default function EmailPasswordFields({
  email,
  onEmailChange,
  password,
  onPasswordChange,
}: Props) {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <>
      <View style={styles.field}>
        <Text style={type.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="email@example.com"
          placeholderTextColor={colors.textTertiary}
          value={email}
          onChangeText={onEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.field}>
        <Text style={type.label}>Password</Text>
        <View style={styles.inputWithIcon}>
          <TextInput
            style={styles.inputInner}
            placeholder="Password"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={onPasswordChange}
            autoCapitalize="none"
          />
          <Pressable
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textTertiary}
            />
          </Pressable>
        </View>
      </View>
    </>
  );
}
