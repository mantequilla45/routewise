import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/AuthContext';

const LoginScreen = () => {
    const insets = useSafeAreaInsets();
    const { setIsAuthenticated } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Mock Credentials
    const validCredentials = {
        username: 'test',
        password: '123',
    };

    const handleLogin = () => {
        console.log('Logging in with:', { email, password });
        if (email === validCredentials.username && password === validCredentials.password) {
            setIsAuthenticated(true);
        } else {
            Alert.alert('Invalid credentials', 'Please try again.');
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
                <TouchableOpacity>
                    <Text className="text-blue-600 font-semibold">Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default LoginScreen;
