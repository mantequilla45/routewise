import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Dashboard = () => {
  const insets = useSafeAreaInsets();
  const handlePlanTrip = () => {
    console.log('Plan Trip pressed');
  };

  const handleViewRoutes = () => {
    console.log('View Routes pressed');
  };

  const handleFareCalculator = () => {
    console.log('Fare Calculator pressed');
  };

  const handleSavedTrips = () => {
    console.log('Saved Trips pressed');
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor="#404040" />
      
      <View className="bg-dark py-5 px-5 items-center">
        <Text className="text-3xl font-bold text-primary tracking-wide">RouteWise</Text>
        <Text className="text-sm text-white mt-1">Your Jeepney Navigation Companion</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerClassName="p-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-primary rounded-xl p-5 mb-6">
          <Text className="text-2xl font-semibold text-dark mb-2">Welcome to RouteWise!</Text>
          <Text className="text-base text-dark">
            Navigate Cebu's jeepney routes with confidence
          </Text>
        </View>

        <View className="flex-row flex-wrap justify-between mb-6">
          <TouchableOpacity 
            className="bg-dark rounded-xl p-4 w-[48%] mb-3 items-center"
            onPress={handlePlanTrip}
            activeOpacity={0.8}
          >
            <Text className="text-3xl mb-3">🗺️</Text>
            <Text className="text-base font-semibold text-primary text-center mb-1">Plan Your Trip</Text>
            <Text className="text-xs text-white text-center">
              Find the best jeepney routes to your destination
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-white border-2 border-gray-200 rounded-xl p-4 w-[48%] mb-3 items-center"
            onPress={handleViewRoutes}
            activeOpacity={0.8}
          >
            <Text className="text-3xl mb-3">🚐</Text>
            <Text className="text-base font-semibold text-dark text-center mb-1">View Routes</Text>
            <Text className="text-xs text-gray-600 text-center">
              Browse all available jeepney routes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-white border-2 border-gray-200 rounded-xl p-4 w-[48%] mb-3 items-center"
            onPress={handleFareCalculator}
            activeOpacity={0.8}
          >
            <Text className="text-3xl mb-3">💰</Text>
            <Text className="text-base font-semibold text-dark text-center mb-1">Fare Calculator</Text>
            <Text className="text-xs text-gray-600 text-center">
              Calculate your total trip cost
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-white border-2 border-gray-200 rounded-xl p-4 w-[48%] mb-3 items-center"
            onPress={handleSavedTrips}
            activeOpacity={0.8}
          >
            <Text className="text-3xl mb-3">📍</Text>
            <Text className="text-base font-semibold text-dark text-center mb-1">Saved Trips</Text>
            <Text className="text-xs text-gray-600 text-center">
              Access your frequently used routes
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-gray-100 rounded-xl p-5">
          <Text className="text-lg font-semibold text-dark mb-4">Quick Stats</Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-primary mb-1">50+</Text>
              <Text className="text-xs text-gray-600">Routes Available</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-primary mb-1">₱13</Text>
              <Text className="text-xs text-gray-600">Base Fare</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-primary mb-1">24/7</Text>
              <Text className="text-xs text-gray-600">Available</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Dashboard;