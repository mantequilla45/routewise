import { Stack } from 'expo-router';
import { useEffect } from 'react';
import {
  useFonts,
  Lexend_100Thin,
  Lexend_200ExtraLight,
  Lexend_300Light,
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
  Lexend_800ExtraBold,
  Lexend_900Black,
} from '@expo-google-fonts/lexend';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/context/auth';
import { MapPointsProvider } from '@/context/map-context';
import { OnboardingProvider, useOnboarding } from '@/context/onboarding';
// Defines the background location task; must load before any location update is delivered
import '@/lib/tripTracking/tracker';

// Prevent splash screen from hiding automatically
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Lexend_100Thin,
    Lexend_200ExtraLight,
    Lexend_300Light,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Lexend_800ExtraBold,
    Lexend_900Black,
  });

  const fontsReady = loaded || !!error;

  return (
    <OnboardingProvider>
      <AuthProvider>
        <MapPointsProvider>
          <AppStack fontsReady={fontsReady} />
          <StatusBar style="dark" />
        </MapPointsProvider>
      </AuthProvider>
    </OnboardingProvider>
  );
}

/** The welcome screen until it has been finished once, then the tabs. */
function AppStack({ fontsReady }: { fontsReady: boolean }) {
  const { hasSeenWelcome } = useOnboarding();
  const ready = fontsReady && hasSeenWelcome !== null;

  // Keep the splash up until fonts and the welcome flag are loaded, so nothing flashes
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!hasSeenWelcome}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
      <Stack.Protected guard={!!hasSeenWelcome}>
        <Stack.Screen name="(tabs)" />
        {/* Full-screen trip map, pushed over the tabs */}
        <Stack.Screen name="trip" />
      </Stack.Protected>
    </Stack>
  );
}
