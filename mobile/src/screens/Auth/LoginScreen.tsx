import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';

type LoginScreenProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;


const LoginScreen = () => {
    const insets = useSafeAreaInsets();
    const { setIsAuthenticated } = useAuth();
    const navigation = useNavigation<LoginScreenProp>();


    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');


    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        try {
            const response = await fetch('http://10.0.2.2:3000/auth/login', {
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
                throw new Error(errorData.message || 'Login failed');
            }
            Alert.alert('Success', 'Login successful!');
            setIsAuthenticated(true);
        } catch (error: any) {
            console.error('Register error:', error);
            Alert.alert('Error', error.message || 'Network error');
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
                className="bg-blue-600 rounded-xl py-3 active:bg-blue-700"
                onPress={handleLogin}
            >
                <Text className="text-white text-center text-lg font-semibold">
                    Login
                </Text>
            </TouchableOpacity>

            <View className="mt-6 flex-row justify-center">
                <Text className="text-gray-600">Don’t have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                    <Text className="text-blue-600 font-semibold">Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default LoginScreen;
