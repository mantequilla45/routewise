import React from 'react';
import { StatusBar, useColorScheme, Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';

// Set default font family globally with TypeScript support
interface TextWithDefaultProps extends React.ComponentClass {
  defaultProps?: any;
}

const TextComponent = Text as TextWithDefaultProps;
const TextInputComponent = TextInput as TextWithDefaultProps;

TextComponent.defaultProps = TextComponent.defaultProps || {};
TextComponent.defaultProps.style = { fontFamily: 'Lexend-Regular' };

TextInputComponent.defaultProps = TextInputComponent.defaultProps || {};
TextInputComponent.defaultProps.style = { fontFamily: 'Lexend-Regular' };

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
