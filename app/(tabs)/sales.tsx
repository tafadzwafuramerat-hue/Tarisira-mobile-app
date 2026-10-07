import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../../components/LocalizedText';
import { router } from 'expo-router';
import { BarChart } from '../../components/charts';
import { Card, s } from '../../components/ui';
import { C, SERIF, money } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

export default function Sales() {
  const { today, txs } = useApp();
  const cards: [string, number, string?][] = [['Today', today, C.orange], ['Week', 595 + today], ['Month', 2325 + today]];
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {cards.map(([label, value, color]) => (
          <View key={label} style={[s.card, { flex: 1, padding: 14, marginBottom: 0 }]}>
            <Text style={s.muted}>{label}</Text>
            <Text style={[a.value, color ? { color } : null]}>{money(value)}</Text>
          </View>
        ))}
      </View>
      <Pressable style={[s.btn, { marginVertical: 16 }]} onPress={() => router.push('/record-sale')}><Text style={s.btnText}>+ Record Sale</Text></Pressable>
      <Card>
        <View style={a.between}>
          <Text style={a.title}>Monthly Trend</Text>
          <Text style={s.muted}>{new Date().toLocaleString('en', { month: 'long', year: 'numeric' })}</Text>
        </View>
        <BarChart />
      </Card>
      <Card>
        <Text style={a.title}>Recent Transactions</Text>
        {txs.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 18 }}>
            <Text style={{ color: C.muted, fontSize: 15 }}>No sales recorded yet.</Text>
            <Text style={[s.muted, { marginTop: 4 }]}>Tap '+ Record Sale' to start.</Text>
          </View>
        ) : txs.map((x) => (
          <View key={x.id} style={a.tx}>
            <View><Text style={a.name}>{x.name} × {x.qty}</Text><Text style={s.muted}>{x.time}</Text></View>
            <Text style={[a.value, { fontSize: 18, marginTop: 0 }]}>{money(x.total)}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const a = StyleSheet.create({
  value: { fontFamily: SERIF, fontSize: 24, fontWeight: '800', color: C.dark, marginTop: 8 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: C.ink },
  tx: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  name: { fontSize: 16, fontWeight: '800', color: C.ink, marginBottom: 4 },
});
