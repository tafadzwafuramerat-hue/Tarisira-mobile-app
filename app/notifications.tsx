import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Header, Screen } from '../components/ui';
import { C } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { DEFAULT_PREFS, NotificationPrefs, registerForPushNotificationsAsync } from '../utils/notifications';

type Key = 'sales' | 'lowStock' | 'payments' | 'daily' | 'weekly' | 'marketing';
const ROWS: { key: Key; title: string; sub: string }[] = [
  { key: 'sales', title: 'Sales Alerts', sub: 'When a sale is recorded' },
  { key: 'lowStock', title: 'Low Stock Alerts', sub: 'When stock runs low' },
  { key: 'payments', title: 'Payment Reminders', sub: 'Debt payment reminders' },
  { key: 'daily', title: 'Daily Summary', sub: 'Daily business digest' },
  { key: 'weekly', title: 'Weekly Report', sub: 'Weekly performance stats' },
  { key: 'marketing', title: 'Marketing Updates', sub: 'Tips and product updates' },
];

export default function Notifications() {
  const { notificationPrefs, setNotificationPrefs } = useApp();
  const [granted, setGranted] = useState<boolean | null>(null);
  const toggle = (k: Key) => setNotificationPrefs({ ...notificationPrefs, [k]: !notificationPrefs[k] });

  const enable = async () => {
    const status = await registerForPushNotificationsAsync();
    if (status === 'granted') {
      setGranted(true);
      Alert.alert('Enabled', 'You will receive low stock and sales notifications.');
    } else {
      setGranted(false);
      Alert.alert('Permission denied', 'Enable notifications in your phone settings to get low stock alerts.');
    }
  };

  return (
    <Screen>
      <Header title="Notifications" sub="" />
      <View style={n.card}>
        <View style={[n.row, { paddingVertical: 18 }]}>
          <View style={{ flex: 1 }}>
            <Text style={n.title}>Push Notifications</Text>
            <Text style={n.sub}>
              {granted === true
                ? 'Allowed'
                : granted === false
                  ? 'Denied — enable in your phone settings'
                  : 'Allow Tarisira to send you notifications'}
            </Text>
          </View>
          <Button label="Allow" style={{ paddingVertical: 10, paddingHorizontal: 14 }} onPress={enable} />
        </View>
        {ROWS.map((r, i) => (
          <View key={r.key} style={[n.row, i === ROWS.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={n.title}>{r.title}</Text>
              <Text style={n.sub}>{r.sub}</Text>
            </View>
            <Switch value={notificationPrefs[r.key]} onValueChange={() => toggle(r.key)} trackColor={{ true: C.green, false: '#D8E3DD' }} thumbColor="#fff" />
          </View>
        ))}
      </View>
      <View style={{ height: 20 }} />
      <Button label="Save Changes" onPress={() => router.back()} />
    </Screen>
  );
}

const n = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 7, borderWidth: 1, borderColor: C.line, paddingHorizontal: 18 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.line },
  title: { fontWeight: '800', color: C.ink, fontSize: 15, marginBottom: 2 },
  sub: { color: C.green, fontSize: 12 },
});