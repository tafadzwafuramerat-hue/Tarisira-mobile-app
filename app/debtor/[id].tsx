import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../../components/LocalizedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Field } from '../../components/ui';
import { C, SERIF, money } from '../../constants/theme';
import { AppIcon } from '../../components/AppIcon';
import { useApp } from '../../context/AppContext';

const due = (days: number) => (days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due in ${days} days`);

export default function DebtorDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { debtors, recordPayment } = useApp();
  const insets = useSafeAreaInsets();
  const d = debtors.find((x) => String(x.id) === id);
  const [amount, setAmount] = useState('');

  if (!d) {
    return (
      <View style={{ flex: 1, backgroundColor: C.page, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ color: C.muted, marginBottom: 16 }}>This debtor has been fully paid or no longer exists.</Text>
        <Pressable onPress={() => router.back()}><Text style={{ color: C.dark, fontWeight: '800' }}>‹ Back</Text></Pressable>
      </View>
    );
  }

  const pay = () => {
    const n = parseFloat(amount);
    if (!(n > 0)) return Alert.alert('Enter an amount', 'Enter how much was paid.');
    recordPayment(d.id, Math.min(n, d.amount));
    setAmount('');
    if (n >= d.amount) router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.page }}>
      <StatusBar style="light" />
      <View style={[s.bar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}><Text style={s.back}>‹ Back</Text></Pressable>
        <Text style={s.barTitle}>{d.name}</Text>
        <Pressable onPress={() => router.push('/settings')} hitSlop={12}><AppIcon name="cog-outline" size={20} color="#fff" /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={s.card}>
          <View style={s.avatar}><Text style={s.avatarText}>{d.name[0].toUpperCase()}</Text></View>
          <Text style={s.name}>{d.name}</Text>
          <Text style={s.muted}>{d.phone}</Text>
          <Text style={s.label}>Outstanding Balance</Text>
          <Text style={s.amount}>{money(d.amount)}</Text>
          <Text style={s.due}>{due(d.days)}</Text>
        </View>

        <View style={s.payRow}>
          <View style={{ flex: 1 }}><Field label="Record a payment ($)" keyboardType="decimal-pad" placeholder="0.00" value={amount} onChangeText={setAmount} /></View>
        </View>
        <View style={s.actions}>
          <Pressable style={[s.action, { backgroundColor: C.dark }]} onPress={pay}><Text style={[s.actionText, { color: '#fff' }]}>Record Payment</Text></Pressable>
          <Pressable style={[s.action, s.actionOutline]} onPress={() => router.push({ pathname: '/create-reminder', params: { debtorId: d.id } })}>
            <Text style={s.actionText}>Send Reminder</Text>
          </Pressable>
        </View>

        <View style={s.history}>
          <Text style={s.histTitle}>Payment History</Text>
          {d.history.map((h) => (
            <View key={h.id} style={s.histRow}>
              <View><Text style={s.histLabel}>{h.label}</Text><Text style={s.muted}>{h.sub}</Text></View>
              <Text style={[s.histAmt, { color: h.amount > 0 ? C.red : C.green }]}>{h.amount > 0 ? '+' : ''}{money(h.amount)}</Text>
            </View>
          ))}
          <View style={[s.histRow, { borderBottomWidth: 0 }]}>
            <Text style={s.histLabel}>Current Balance</Text>
            <Text style={[s.histAmt, { color: C.orange }]}>{money(d.amount)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  bar: { backgroundColor: C.dark, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14 },
  back: { color: '#fff', fontSize: 16 },
  barTitle: { color: '#fff', fontFamily: SERIF, fontWeight: '800', fontSize: 18 },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: C.orange, borderRadius: 7, padding: 20, alignItems: 'center', marginBottom: 16 },
  avatar: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  name: { fontSize: 19, fontWeight: '800', color: C.ink },
  muted: { color: C.muted, fontSize: 13, marginBottom: 14 },
  label: { color: C.muted, fontSize: 13, marginBottom: 4 },
  amount: { fontFamily: SERIF, fontSize: 38, fontWeight: '800', color: C.orange },
  due: { color: C.orange, fontWeight: '700', marginTop: 4 },
  payRow: { marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  action: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  actionOutline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line },
  actionText: { fontWeight: '800', color: C.dark },
  history: { backgroundColor: '#fff', borderRadius: 7, borderWidth: 1, borderColor: C.line, padding: 18 },
  histTitle: { fontWeight: '800', fontSize: 16, color: C.ink, marginBottom: 10 },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  histLabel: { fontWeight: '700', color: C.ink, marginBottom: 2 },
  histAmt: { fontWeight: '800', fontSize: 16 },
});
