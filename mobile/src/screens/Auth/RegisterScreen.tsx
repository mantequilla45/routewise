import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';

type RegisterScreenProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const RegisterScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<RegisterScreenProp>()

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://10.0.2.2:3000/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Registration failed');
            }
            Alert.alert('Success', 'Registration successful!');
            navigation.navigate('Login');
        } catch (error: any) {
            console.error('Register error:', error);
            Alert.alert('Error', error.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View
            className="flex-1 bg-white px-6 justify-center"
            style={{ paddingTop: insets.top }}
        >
            <Text className="text-3xl font-bold text-center mb-8 text-gray-800">
                RouteWise
            </Text>

            <TextInput
                className="border border-gray-300 rounded-xl p-3 mb-4 text-base"
                placeholder="Email"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                className="border border-gray-300 rounded-xl p-3 mb-6 text-base"
                placeholder="Password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                className={`rounded-xl py-3 ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
                disabled={loading}
                onPress={handleRegister}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text className="text-white text-center text-lg font-semibold">
                        Register
                    </Text>
                )}
            </TouchableOpacity>

            <View className="mt-6 flex-row justify-center">
                <Text className="text-gray-600">Have an account already? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                    <Text className="text-blue-600 font-semibold">Log In</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default RegisterScreen;
