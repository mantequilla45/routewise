import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Tab colors may arrive as processed native numbers; Ionicons only accepts strings.
function TabIcon({ color, name }: { color: ColorValue; name: IconName }) {
  return <Ionicons name={name} color={typeof color === 'string' ? color : undefined} size={24} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFCC66',
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontFamily: 'Lexend_600SemiBold',
          color: '#303030',
          fontSize: 24,
        },
        headerShown: false,
        headerShadowVisible: true,
        headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#25292e',
          paddingTop: 10,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          borderRadius: 0,
          height: 70 + (insets.bottom > 0 ? insets.bottom : 0),
          borderTopWidth: 1,
          borderTopColor: '#404040',
        },
        tabBarLabelStyle: {
          fontFamily: 'Lexend_400Regular',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home-sharp' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Routes',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'bus' : 'bus-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'bookmark' : 'bookmark-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'person-circle' : 'person-circle-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
