import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ONBOARDING_KEY = 'tarisira_onboarding_v1';

function storage() {
  if (Platform.OS === 'web') return globalThis.localStorage;
  return {
    getItem: (k: string) => SecureStore.getItemAsync(k),
    setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
    removeItem: (k: string) => SecureStore.deleteItemAsync(k),
  };
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const s = storage();
  const raw = await s.getItem(ONBOARDING_KEY);
  return raw === 'done';
}

export async function completeOnboarding(): Promise<void> {
  const s = storage();
  await s.setItem(ONBOARDING_KEY, 'done');
}