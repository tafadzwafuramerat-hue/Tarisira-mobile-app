import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../../components/LocalizedText';
import { router } from 'expo-router';
import { LineChart } from '../../components/charts';
import { AppIcon } from '../../components/AppIcon';
import { Card, s } from '../../components/ui';
import { C, SERIF, money } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

const DEEP_RED = '#8B0000';

function Stat({ icon, label, value, note, color, iconColor = color ?? C.muted, attention }: { icon: React.ComponentProps<typeof AppIcon>['name']; label: string; value: string; note?: string; color?: string; iconColor?: string; attention?: boolean }) {
  return (
    <View style={[h.stat, attention && h.attentionStat]}>
      <View style={h.statLabel}>
        <View style={[h.statIcon, { backgroundColor: `${iconColor}18` }]}>
          <AppIcon name={icon} size={17} color={iconColor} />
        </View>
        <Text style={[s.muted, attention && h.attentionText]}>{label}</Text>
      </View>
      <Text style={[h.value, color ? { color } : null]}>{value}</Text>
      {note ? <Text style={[s.muted, attention && h.attentionText]}>{note}</Text> : null}
    </View>
  );
}

export default function Home() {
  const { form, today, txs, debtTotal, debtors, products, lowCount } = useApp();
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = form.name ? form.name.split(' ')[0] : 'Boss';
  const month = new Date().toLocaleString('en', { month: 'short', year: 'numeric' });

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={[s.h1, { fontSize: 26 }]}>{greet}, {name}</Text>
      <Text style={[s.muted, { marginTop: 4, marginBottom: 16, fontSize: 15 }]}>Here's your business overview</Text>
      <View style={h.grid}>
        <Stat icon="alert-outline" label="Low Stock" value={String(lowCount)} note="Needs attention" color={DEEP_RED} attention />
        <Stat icon="cash-multiple" label="Today's Sales" value={money(today)} color={C.orange} iconColor={C.muted} note={`${txs.length} transactions`} />
        <Stat icon="account-group-outline" label="Debts Owed" value={money(debtTotal)} note={`${debtors.length} debtors`} />
        <Stat icon="package-variant-closed" label="Products" value={String(products.length)} />
      </View>
      <Card style={{ marginTop: 14 }}>
        <View style={h.between}><Text style={h.cardTitle}>Sales This Week</Text><Text style={s.muted}>{month}</Text></View>
        <LineChart />
      </Card>
      <View style={h.actions}>
        <Pressable style={[h.action, { backgroundColor: C.dark }]} onPress={() => router.push('/record-sale')}><Text style={[h.actionText, { color: '#fff' }]}>+ Record Sale</Text></Pressable>
        <Pressable style={[h.action, { backgroundColor: C.mint, borderColor: C.line }]} onPress={() => router.push('/whatsapp')}><View style={h.actionContent}><AppIcon name="message-text-outline" size={18} color={C.dark} /><Text style={h.actionText}>WhatsApp</Text></View></Pressable>
      </View>
      <View style={h.actions}>
        <Pressable style={[h.action, h.small]} onPress={() => router.push('/reminders')}><View style={h.actionContent}><AppIcon name="bell-outline" size={18} color={C.dark} /><Text style={h.actionText}>Reminders</Text></View></Pressable>
        <Pressable style={[h.action, h.small]} onPress={() => router.navigate('/reports')}><View style={h.actionContent}><AppIcon name="chart-box-outline" size={18} color={C.dark} /><Text style={h.actionText}>Reports</Text></View></Pressable>
      </View>
    </ScrollView>
  );
}

const h = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  stat: { width: '48%', minHeight: 120, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 7, padding: 16 },
  attentionStat: { backgroundColor: '#FFF5F5', borderColor: DEEP_RED },
  attentionText: { color: DEEP_RED },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  value: { fontFamily: SERIF, fontSize: 30, fontWeight: '800', color: C.dark, marginTop: 8 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: C.ink },
  actions: { flexDirection: 'row', gap: 12, marginTop: 14 },
  action: { flex: 1, paddingVertical: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  small: { paddingVertical: 14, backgroundColor: '#F7FBF9', borderColor: C.line },
  actionText: { fontWeight: '800', fontSize: 15, color: C.dark },
  actionContent: { flexDirection: 'row', alignItems: 'center', gap: 7 },
});
