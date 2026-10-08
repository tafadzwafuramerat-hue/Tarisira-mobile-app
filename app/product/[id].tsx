import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../../components/LocalizedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Badge, s } from '../../components/ui';
import { AppIcon } from '../../components/AppIcon';
import { C, SERIF, money } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { errorMessage } from '../../utils/errors';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, adjustStock } = useApp();
  const insets = useSafeAreaInsets();
  const p = products.find((x) => String(x.id) === id);
  const [amt, setAmt] = useState(10);
  const [busy, setBusy] = useState(false);

  if (!p) return null;
  const low = p.qty <= p.reorderAt;

  const changeStock = async (delta: number, label: string) => {
    setBusy(true);
    try {
      await adjustStock(p.id, delta, label);
    } catch (error) {
      Alert.alert('Stock update failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const add = () => void changeStock(amt, 'Restock');
  const remove = () => {
    if (amt > p.qty) return Alert.alert('Too many to remove', `Only ${p.qty} in stock.`);
    void changeStock(-amt, 'Adjustment');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.page }}>
      <StatusBar style="light" />
      <View style={[d.bar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}><Text style={d.back}>‹ Back</Text></Pressable>
        <Text style={d.barTitle}>{p.name}</Text>
        <Pressable onPress={() => router.push('/settings')} hitSlop={12}><AppIcon name="cog-outline" size={20} color="#fff" /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={[d.card, low ? d.cardLow : d.cardGood]}>
          <View style={d.row}>
            <View style={d.icon}><AppIcon name="package-variant-closed" size={28} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={d.name}>{p.name}</Text>
              <Text style={s.muted}>{p.cat}</Text>
            </View>
            <Badge text={low ? 'Low Stock' : 'In Stock'} bad={low} />
          </View>
          <View style={[d.row, { marginTop: 18 }]}>
            <View style={{ flex: 1 }}><Text style={s.muted}>Stock</Text><Text style={[d.stat, { color: C.dark }]}>{p.qty} units</Text></View>
            <View style={{ flex: 1 }}><Text style={s.muted}>Sell Price</Text><Text style={[d.stat, { color: C.orange }]}>{money(p.price)}</Text></View>
            <View style={{ flex: 1 }}><Text style={s.muted}>Cost Price</Text><Text style={[d.stat, { color: C.dark }]}>{money(p.cost)}</Text></View>
          </View>
        </View>

        <View style={d.qtyRow}>
          {[1, 5, 10, 50].map((n) => (
            <Pressable key={n} style={[d.qtyChip, amt === n && d.qtyChipOn]} onPress={() => setAmt(n)}>
              <Text style={[d.qtyChipText, amt === n && { color: '#fff' }]}>{n}</Text>
            </Pressable>
          ))}
        </View>
        <View style={d.actions}>
          <Pressable style={[d.action, { backgroundColor: C.dark }]} disabled={busy} onPress={add}><Text style={[d.actionText, { color: '#fff' }]}>{busy ? 'Saving…' : '+ Add Stock'}</Text></Pressable>
          <Pressable style={[d.action, d.actionOutline]} disabled={busy} onPress={remove}><Text style={d.actionText}>− Remove</Text></Pressable>
        </View>

        <View style={d.history}>
          <Text style={d.histTitle}>Stock History</Text>
          {p.history.length === 0 && <Text style={s.muted}>No stock movements yet.</Text>}
          {p.history.map((h) => (
            <View key={h.id} style={d.histRow}>
              <View><Text style={d.histLabel}>{h.delta > 0 ? '+' : ''}{h.delta} units {h.label}</Text><Text style={s.muted}>{h.date}</Text></View>
              <Text style={[d.histDelta, { color: h.delta > 0 ? C.green : C.red }]}>{h.delta > 0 ? '+' : ''}{h.delta}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const d = StyleSheet.create({
  bar: { backgroundColor: C.dark, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14 },
  back: { color: '#fff', fontSize: 16 },
  barTitle: { color: '#fff', fontFamily: SERIF, fontWeight: '800', fontSize: 18 },
  card: { borderWidth: 1.5, borderRadius: 7, padding: 18, marginBottom: 16 },
  cardGood: { backgroundColor: C.mint, borderColor: C.green },
  cardLow: { backgroundColor: '#FDECEC', borderColor: '#F7C9C9' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 19, fontWeight: '800', color: C.ink },
  stat: { fontFamily: SERIF, fontSize: 20, fontWeight: '800', marginTop: 4 },
  qtyRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  qtyChip: { flex: 1, borderWidth: 1.5, borderColor: C.line, borderRadius: 12, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff' },
  qtyChipOn: { backgroundColor: C.dark, borderColor: C.dark },
  qtyChipText: { fontWeight: '800', color: C.ink },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  action: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  actionOutline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line },
  actionText: { fontWeight: '800', color: C.dark },
  history: { backgroundColor: '#fff', borderRadius: 7, borderWidth: 1, borderColor: C.line, padding: 18 },
  histTitle: { fontWeight: '800', fontSize: 16, color: C.ink, marginBottom: 10 },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  histLabel: { fontWeight: '700', color: C.ink, marginBottom: 2 },
  histDelta: { fontWeight: '800', fontSize: 16 },
});
