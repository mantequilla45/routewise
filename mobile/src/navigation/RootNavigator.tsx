import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { AuthProvider, useAuth } from '../hooks/AuthContext';


function RootNavigationContent() {
    const { isAuthenticated } = useAuth();
    return (
        <NavigationContainer>
            {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
}


export default function RootNavigator() {
    return (
        <AuthProvider>
            <RootNavigationContent></RootNavigationContent>
        </AuthProvider>
    );
}