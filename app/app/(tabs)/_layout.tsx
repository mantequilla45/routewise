import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
        headerShown:false,
        headerShadowVisible: true,
        headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#25292e',
          position: 'absolute',
          paddingTop: 10,
          paddingBottom: 10,
          bottom:50,
          borderRadius: 35,
          marginHorizontal: 50,
          height: 80
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
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
        }} />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved Routes',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
