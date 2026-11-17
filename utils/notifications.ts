import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase, supabaseConfigured } from '../lib/supabase';

export type NotificationPrefs = {
  sales: boolean;
  lowStock: boolean;
  payments: boolean;
  daily: boolean;
  weekly: boolean;
  marketing: boolean;
};

export const DEFAULT_PREFS: NotificationPrefs = {
  sales: true,
  lowStock: true,
  payments: true,
  daily: false,
  weekly: false,
  marketing: false,
};

type AppStateRow = {
  user_id: string;
  data: Record<string, unknown> & {
    pushToken?: string;
    notificationPrefs?: Partial<NotificationPrefs>;
    businessId?: string;
  };
  updated_at: string;
};

if (Platform.OS === 'android') {
  void Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#00A86B',
  });
}

// app_state stores one row per user with a JSON blob. Every write must merge
// with the existing blob, otherwise one key wipes the others.
async function readState(userId: string): Promise<Record<string, unknown>> {
  if (!supabase) return {};
  const { data } = await supabase
    .from('app_state')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  return ((data as { data?: Record<string, unknown> } | null)?.data ?? {}) as Record<string, unknown>;
}

async function writeState(userId: string, patch: Record<string, unknown>): Promise<void> {
  if (!supabase) return;
  const existing = await readState(userId);
  await supabase.from('app_state').upsert({
    user_id: userId,
    data: { ...existing, ...patch },
    updated_at: new Date().toISOString(),
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  try {
    if (supabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
        const token = tokenData?.data;
        if (token) {
          await writeState(user.id, { pushToken: token });
        }
      }
    }
  } catch {
    // non-fatal: token registration must never block the app
  }
  return finalStatus;
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: 'default' },
      trigger: null,
    });
  } catch {
    // ignore
  }
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  try {
    if (supabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await writeState(user.id, { notificationPrefs: prefs });
      }
    }
  } catch {
    // non-fatal
  }
}

export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    if (supabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const state = await readState(user.id);
        const prefs = state.notificationPrefs as Partial<NotificationPrefs> | undefined;
        if (prefs) return { ...DEFAULT_PREFS, ...prefs };
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_PREFS;
}

export async function savePushBusinessId(businessId: string): Promise<void> {
  try {
    if (supabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await writeState(user.id, { businessId });
      }
    }
  } catch {
    // non-fatal
  }
}