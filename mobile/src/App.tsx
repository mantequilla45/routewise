/**
 * RouteWise - Jeepney Navigation App
 */

import '../global.css';
import './utils/suppressWarnings';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator></RootNavigator>
    </SafeAreaProvider>
  );
}

export default App; 