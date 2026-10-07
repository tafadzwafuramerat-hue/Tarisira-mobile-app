import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../../components/LocalizedText';
import { router } from 'expo-router';
import { CAT_COLORS, Donut } from '../../components/charts';
import { AppIcon } from '../../components/AppIcon';
import { Card, s } from '../../components/ui';
import { C, SERIF, money } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

const ROWS: [React.ComponentProps<typeof AppIcon>['name'], string, string, string][] = [
  ['chart-box-outline', 'Sales Report', 'Revenue, products & trends', '/sales-report'],
  ['package-variant-closed', 'Stock Report', 'Levels, value & movement', '/stock-report'],
  ['account-group-outline', 'Debt Report', 'Outstanding & paid debts', '/debt-report'],
];

function Stat({ icon, label, value, color }: { icon: React.ComponentProps<typeof AppIcon>['name']; label: string; value: string; color?: string }) {
  return (
    <View style={p.stat}>
      <View style={p.statLabel}><AppIcon name={icon} size={16} color={color ?? C.muted} /><Text style={s.muted}>{label}</Text></View>
      <Text style={[p.value, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

export default function Reports() {
  const { today, stockValue, debtTotal, products, cats } = useApp();
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={p.grid}>
        <Stat icon="cash-multiple" label="Monthly Sales" value={money(2325 + today)} color={C.orange} />
        <Stat icon="package-variant-closed" label="Stock Value" value={money(Math.round(stockValue))} />
        <Stat icon="account-group-outline" label="Total Debt" value={money(debtTotal)} />
        <Stat icon="archive-outline" label="Products" value={String(products.length)} />
      </View>
      {ROWS.map(([icon, title, desc, path]) => (
        <Pressable key={title} onPress={() => router.push(path as any)}>
          <Card style={[p.row, { marginTop: 12, marginBottom: 0 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={p.iconBox}><AppIcon name={icon} size={22} color={C.dark} /></View>
              <View><Text style={p.rowTitle}>{title}</Text><Text style={s.muted}>{desc}</Text></View>
            </View>
            <Text style={{ color: '#B5C7BD', fontSize: 24 }}>›</Text>
          </Card>
        </Pressable>
      ))}
      <Card style={{ marginTop: 12 }}>
        <Text style={p.rowTitle}>Sales by Category</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 }}>
          <Donut data={cats} />
          <View style={{ flex: 1, gap: 10 }}>
            {cats.map(([name, v], i) => (
              <View key={name} style={p.row}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                  <Text style={{ color: C.ink }}>{name}</Text>
                </View>
                <Text style={{ fontWeight: '800', color: C.ink }}>{money(v)}</Text>
              </View>
            ))}
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const p = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  stat: { width: '48%', minHeight: 90, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 7, padding: 16 },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { fontFamily: SERIF, fontSize: 28, fontWeight: '800', color: C.dark, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F6F3', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '800', color: C.ink, marginBottom: 2 },
});
