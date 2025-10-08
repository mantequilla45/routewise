import React from 'react';
import { View, Text, Button } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/types';


type Screen1NavigationProp = NativeStackNavigationProp<AppStackParamList, 'Screen1'>;

const Screen1 = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<Screen1NavigationProp>();

    return (
        <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
            <Text>Screen1</Text>
            <Button
                title="Go to Dashboard"
                onPress={() => navigation.navigate('Dashboard')}
            />
        </View>
    );
};

export default Screen1;
