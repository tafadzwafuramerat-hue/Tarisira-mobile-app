import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type LocalUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  createdAt: number;
};

const USER_KEY = 'tarisira_local_user';
const SESSION_KEY = 'tarisira_local_session';

function storage() {
  if (Platform.OS === 'web') return globalThis.localStorage;
  return {
    getItem: (k: string) => SecureStore.getItemAsync(k),
    setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
    removeItem: (k: string) => SecureStore.deleteItemAsync(k),
  };
}

function simpleHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16);
}

export async function createLocalUser(details: { name: string; email: string; phone: string; password: string }): Promise<LocalUser> {
  const user: LocalUser = {
    id: `local_${Date.now()}`,
    name: details.name,
    email: details.email.trim(),
    phone: details.phone.trim(),
    passwordHash: simpleHash(details.password),
    createdAt: Date.now(),
  };
  const s = storage();
  await s.setItem(USER_KEY, JSON.stringify(user));
  await s.setItem(SESSION_KEY, user.id);
  return user;
}

export async function signInLocal(identifier: string, password: string): Promise<{ hasBusiness: boolean } | null> {
  const s = storage();
  const raw = await s.getItem(USER_KEY);
  if (!raw) return null;
  const user: LocalUser = JSON.parse(raw);
  const match = identifier.includes('@')
    ? user.email.toLowerCase() === identifier.trim().toLowerCase()
    : user.phone.replace(/\D/g, '') === identifier.replace(/\D/g, '');
  if (!match || user.passwordHash !== simpleHash(password)) return null;
  await s.setItem(SESSION_KEY, user.id);
  return { hasBusiness: true };
}

export async function getLocalUser(): Promise<LocalUser | null> {
  const s = storage();
  const raw = await s.getItem(USER_KEY);
  if (!raw) return null;
  const session = await s.getItem(SESSION_KEY);
  if (!session) return null;
  return JSON.parse(raw);
}

export async function signOutLocal(): Promise<void> {
  const s = storage();
  await s.removeItem(SESSION_KEY);
}