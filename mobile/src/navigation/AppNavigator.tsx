import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from './types';
import Dashboard from '../screens/Dashboard';
import Screen1 from '../screens/Screen1/Screen1';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Dashboard" component={Dashboard} />
            <Stack.Screen name="Screen1" component={Screen1} />
        </Stack.Navigator>
    );
}