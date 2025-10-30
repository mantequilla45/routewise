import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Text } from '../components/Text';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppStack';

type HomeScreenNavigationProp = NativeStackNavigationProp<AppStackParamList, 'Home'>;

const HomeScreen = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text weight="bold" style={styles.title}>Welcome to RouteWise!</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.mainContent}>
          <TouchableOpacity style={styles.routeButton} onPress={() => navigation.navigate('Map') }>
            <Text style={styles.routeButtonIcon}>🗺️</Text>
            <Text weight="600" style={styles.routeButtonTitle}>Find Routes</Text>
            <Text style={styles.routeButtonSubtitle}>Search for the best jeepney routes</Text>
          </TouchableOpacity>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>⭐</Text>
            <Text weight="500" style={styles.actionText}>Saved Routes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>📍</Text>
            <Text weight="500" style={styles.actionText}>Recent Trips</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text weight="600" style={styles.sectionTitle}>Quick Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <View style={styles.tipContent}>
              <Text weight="500" style={styles.tipTitle}>Save your frequent routes</Text>
              <Text style={styles.tipDescription}>
                Bookmark your daily commute for quick access
              </Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Lexend-Regular',
    color: '#333',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Lexend-Light',
    color: '#666',
  },
  mainContent: {
    padding: 20,
  },
  routeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  routeButtonIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  routeButtonTitle: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Lexend-Regular',
    marginBottom: 4,
  },
  routeButtonSubtitle: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Lexend-Light',
    opacity: 0.9,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Lexend-Regular',
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'Lexend-Regular',
    marginBottom: 12,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Lexend-Regular',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Lexend-Light',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Lexend-Regular',
  },
});

export default HomeScreen;