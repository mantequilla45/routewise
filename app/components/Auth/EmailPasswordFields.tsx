import React, { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authFormStyles as styles } from '@/components/Auth/authFormStyles';
import { colors } from '@/theme';

type Props = {
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
};

/** Email and password inputs (placeholders as labels); the password field has a show/hide toggle. */
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
        <TextInput
          style={styles.input}
          placeholder="Email"
          textContentType="emailAddress"
          autoComplete="email"
          placeholderTextColor={colors.textTertiary}
          value={email}
          onChangeText={onEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.field}>
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
