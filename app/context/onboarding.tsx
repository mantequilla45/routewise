import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'hasSeenWelcome';

type OnboardingContextValue = {
  /** null while the stored flag is loading. */
  hasSeenWelcome: boolean | null;
  completeWelcome: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue>({
  hasSeenWelcome: null,
  completeWelcome: () => {},
});

/** Remembers on the device whether the first-launch welcome screen has been finished. */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);

  useEffect(() => {
    let ignore = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!ignore) setHasSeenWelcome(value === 'true');
      })
      .catch(() => {
        // Storage unavailable: show the app rather than block on the welcome screen
        if (!ignore) setHasSeenWelcome(true);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const completeWelcome = () => {
    setHasSeenWelcome(true);
    AsyncStorage.setItem(STORAGE_KEY, 'true').catch((error) =>
      console.warn('Could not save welcome flag:', error),
    );
  };

  return (
    <OnboardingContext.Provider value={{ hasSeenWelcome, completeWelcome }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);
