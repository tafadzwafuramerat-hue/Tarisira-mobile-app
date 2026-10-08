import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../../components/LocalizedText';
import { router } from 'expo-router';
import { DebtorForm } from '../../components/forms';
import { Badge, Card, Search, s } from '../../components/ui';
import { C, SERIF, money } from '../../constants/theme';
import { Debtor, useApp } from '../../context/AppContext';

const due = (d: Debtor) => (d.days === 0 ? 'Due today' : d.days === 1 ? 'Due tomorrow' : `Due in ${d.days} days`);
const SHADES = ['#004D30', '#0B6B45', '#005F3C'];

export default function Debtors() {
  const { debtors, debtTotal } = useApp();
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const list = debtors.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={r.hero}>
        <View style={{ flex: 1 }}>
          <Text style={r.heroLabel}>Total Outstanding</Text>
          <Text style={r.heroAmt}>{money(debtTotal)}</Text>
          <Text style={r.heroLabel}>{debtors.length} debtors</Text>
        </View>
        <Pressable style={r.heroAdd} onPress={() => setAdding(true)}><Text style={s.btnText}>+ Add</Text></Pressable>
      </View>
      <View style={{ marginVertical: 14 }}><Search value={q} onChangeText={setQ} placeholder="Search debtors..." /></View>
      {list.map((d, i) => (
        <Pressable key={d.id} onPress={() => router.push(`/debtor/${d.id}`)}>
          <Card style={r.row}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
              <View style={[r.avatar, { backgroundColor: SHADES[i % 3] }]}><Text style={r.avatarText}>{d.name[0].toUpperCase()}</Text></View>
              <View><Text style={r.name}>{d.name}</Text><Text style={s.muted}>{d.item ? `${d.item} · ` : ''}{due(d)}</Text></View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={r.amount}>{money(d.amount)}</Text>
              {d.days <= 2 && <Badge text="Due Soon" bad />}
            </View>
          </Card>
        </Pressable>
      ))}
      {list.length === 0 && <Text style={r.empty}>No debtors found. Tap a debtor to mark them as paid.</Text>}
      {adding && <DebtorForm onClose={() => setAdding(false)} />}
    </ScrollView>
  );
}

const r = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B6B45', borderRadius: 7, padding: 20 },
  heroLabel: { color: '#B9DDCB', fontSize: 13 },
  heroAmt: { fontFamily: SERIF, fontSize: 38, fontWeight: '800', color: '#fff', marginVertical: 6 },
  heroAdd: { backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  name: { fontSize: 17, fontWeight: '800', color: C.ink, marginBottom: 4 },
  amount: { fontFamily: SERIF, fontSize: 20, fontWeight: '800', color: C.orange },
  empty: { textAlign: 'center', color: C.muted, marginTop: 24 },
});
