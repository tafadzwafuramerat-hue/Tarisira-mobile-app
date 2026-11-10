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

// Configure notification channel on Android
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#00A86B',
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

  // Save push token to Supabase (best-effort)
  try {
    if (supabaseConfigured && supabase) {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && tokenData?.data) {
        await supabase.from('app_state').upsert({
          user_id: user.id,
          data: { pushToken: tokenData.data },
          updated_at: new Date().toISOString(),
        });
      }
    }
  } catch (e) {
    // non-fatal
  }
  return finalStatus;
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 0 },
    });
  } catch (e) {
    // ignore
  }
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  try {
    if (supabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('app_state').upsert({
          user_id: user.id,
          data: { notificationPrefs: prefs },
          updated_at: new Date().toISOString(),
        });
      }
    }
  } catch (e) {
    // non-fatal
  }
}

export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    if (supabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('app_state').select('data').eq('user_id', user.id).maybeSingle();
        const prefs = data?.data?.notificationPrefs;
        if (prefs) return { ...DEFAULT_PREFS, ...prefs };
      }
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_PREFS;
}