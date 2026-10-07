import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Card, Header, Screen, s } from '../components/ui';
import { ReportExportButtons } from '../components/ReportExportButtons';
import { C, SERIF, money } from '../constants/theme';
import { useApp } from '../context/AppContext';

const due = (days: number) => (days === 0 ? 'Due today' : days === 1 ? 'Due in 1 days' : `Due in ${days} days`);
const SHADES = ['#004D30', '#0B6B45', '#005F3C'];

export default function DebtReport() {
  const { debtors, debtTotal } = useApp();
  return (
    <Screen>
      <Header title="Debt Report" sub="" />
      <View style={r.hero}>
        <Text style={r.heroLabel}>Total Outstanding</Text>
        <Text style={r.heroAmt}>{money(debtTotal)}</Text>
        <Text style={r.heroLabel}>{debtors.length} active debtors</Text>
      </View>
      <Card>
        <Text style={r.title}>Debtor Breakdown</Text>
        {debtors.map((d, i) => (
          <Pressable key={d.id} style={r.row} onPress={() => router.push(`/debtor/${d.id}`)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[r.avatar, { backgroundColor: SHADES[i % 3] }]}><Text style={r.avatarText}>{d.name[0].toUpperCase()}</Text></View>
              <View><Text style={r.name}>{d.name}</Text><Text style={s.muted}>{due(d.days)}</Text></View>
            </View>
            <Text style={r.amount}>{money(d.amount)}</Text>
          </Pressable>
        ))}
        {debtors.length === 0 && <Text style={s.muted}>No outstanding debts. Nice work!</Text>}
      </Card>
      <ReportExportButtons kind="debt" />
    </Screen>
  );
}

const r = StyleSheet.create({
  hero: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: C.orange, borderRadius: 7, padding: 20, alignItems: 'center', marginBottom: 16 },
  heroLabel: { color: C.muted, fontSize: 13 },
  heroAmt: { fontFamily: SERIF, fontSize: 36, fontWeight: '800', color: C.orange, marginVertical: 6 },
  title: { fontWeight: '800', fontSize: 16, color: C.ink, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  avatar: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  name: { fontWeight: '800', color: C.ink, fontSize: 15 },
  amount: { fontWeight: '800', color: C.orange, fontSize: 16 },
});
