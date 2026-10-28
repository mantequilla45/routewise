import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authFormStyles as styles } from '@/components/Auth/authFormStyles';

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
      <View style={styles.fieldContainer}>
        <Text style={styles.text}> Email </Text>
        <TextInput
          style={styles.emailtextbox}
          placeholder="email@example.com"
          placeholderTextColor="#585756"
          value={email}
          onChangeText={onEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.text}> Password </Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.passwordtextbox}
            placeholder="Password"
            placeholderTextColor="#585756"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={onPasswordChange}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={styles.eyeButton}
          >
            <Ionicons name={passwordVisible ? 'eye' : 'eye-off'} size={24} color="#585756" />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
