import { LogBox } from 'react-native';

// Suppress specific warnings
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
]);

// If you want to suppress all warnings in production
if (!__DEV__) {
  LogBox.ignoreAllLogs();
}