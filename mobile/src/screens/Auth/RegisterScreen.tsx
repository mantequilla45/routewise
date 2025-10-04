import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const RegisterScreen = () => {
    const insets = useSafeAreaInsets();

    return (
        <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
            <Text>RegisterScreen</Text>
        </View>
    );
};

export default RegisterScreen;
