import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const SAVED_CREDENTIALS_KEY = 'saved_credentials';

function readString(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  return typeof value === 'string' ? value : '';
}

/**
 * Email/password/remember-me state for the auth forms. On mount, pre-fills the fields from
 * SecureStore if the user previously chose "Remember me"; `persistCredentials` saves or clears
 * them according to the current toggle and is meant to be called after a successful submit.
 */
export function useSavedCredentials() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const saved = await SecureStore.getItemAsync(SAVED_CREDENTIALS_KEY);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          const obj =
            parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
          setEmail(readString(obj, 'email'));
          setPassword(readString(obj, 'password'));
          setRememberMe(true);
        }
      } catch (e) {
        console.warn('Failed to load saved credentials', e);
      }
    };

    loadSaved();
  }, []);

  const persistCredentials = async () => {
    if (rememberMe) {
      await SecureStore.setItemAsync(SAVED_CREDENTIALS_KEY, JSON.stringify({ email, password }));
    } else {
      await SecureStore.deleteItemAsync(SAVED_CREDENTIALS_KEY);
    }
  };

  return { email, setEmail, password, setPassword, rememberMe, setRememberMe, persistCredentials };
}
