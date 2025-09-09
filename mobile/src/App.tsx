/**
 * RouteWise - Jeepney Navigation App
 */

import '../global.css';
import './utils/suppressWarnings';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Dashboard from './screens/Dashboard';

function App() {
  return (
    <SafeAreaProvider>
      <Dashboard />
    </SafeAreaProvider>
  );
}

export default App;