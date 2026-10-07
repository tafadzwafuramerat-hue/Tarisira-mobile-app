import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { BarChart } from '../components/charts';
import { ReportExportButtons } from '../components/ReportExportButtons';
import { Card, Header, Screen, s } from '../components/ui';
import { C, SERIF, money } from '../constants/theme';
import { useApp } from '../context/AppContext';

const TOP = [
  ['Coca-Cola', 900, 900], ['Bread', 520, 900], ['Milk', 310, 900], ['Sugar', 280, 900],
] as const;

export default function SalesReport() {
  const { today, txs } = useApp();
  const revenue = 2325 + today;
  const count = 148 + txs.length;
  return (
    <Screen>
      <Header title="Sales Report" sub="" />
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
        <View style={[s.card, { flex: 1, marginBottom: 0 }]}><Text style={s.muted}>Total Revenue</Text><Text style={[r.value, { color: C.orange }]}>{money(revenue)}</Text></View>
        <View style={[s.card, { flex: 1, marginBottom: 0 }]}><Text style={s.muted}>Transactions</Text><Text style={r.value}>{count}</Text></View>
      </View>
      <Card>
        <View style={r.between}><Text style={r.title}>Daily Sales</Text><Text style={s.muted}>{new Date().toLocaleString('en', { month: 'short', year: 'numeric' })}</Text></View>
        <BarChart />
      </Card>
      <Card>
        <Text style={r.title}>Top Products</Text>
        {TOP.map(([name, amt, max]) => (
          <View key={name} style={{ marginTop: 10 }}>
            <View style={r.between}><Text style={r.prodName}>{name}</Text><Text style={r.prodAmt}>{money(amt)}</Text></View>
            <View style={r.bar}><View style={[r.barFill, { width: `${(amt / max) * 100}%` }]} /></View>
          </View>
        ))}
      </Card>
      <ReportExportButtons kind="sales" />
    </Screen>
  );
}

const r = StyleSheet.create({
  value: { fontFamily: SERIF, fontSize: 26, fontWeight: '800', color: C.dark, marginTop: 6 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontWeight: '800', fontSize: 16, color: C.ink, marginBottom: 6 },
  prodName: { fontWeight: '700', color: C.ink },
  prodAmt: { fontWeight: '800', color: C.orange },
  bar: { height: 8, borderRadius: 4, backgroundColor: C.line, marginTop: 6, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: C.green },
});
