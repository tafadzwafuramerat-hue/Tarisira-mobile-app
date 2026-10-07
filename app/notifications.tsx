import React, { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Header, Screen } from '../components/ui';
import { C } from '../constants/theme';

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
  const [vals, setVals] = useState<Record<Key, boolean>>({
    sales: true, lowStock: true, payments: true, daily: false, weekly: false, marketing: false,
  });
  const toggle = (k: Key) => setVals((v) => ({ ...v, [k]: !v[k] }));

  return (
    <Screen>
      <Header title="Notifications" sub="" />
      <View style={n.card}>
        {ROWS.map((r, i) => (
          <View key={r.key} style={[n.row, i === ROWS.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={n.title}>{r.title}</Text>
              <Text style={n.sub}>{r.sub}</Text>
            </View>
            <Switch value={vals[r.key]} onValueChange={() => toggle(r.key)} trackColor={{ true: C.green, false: '#D8E3DD' }} thumbColor="#fff" />
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
