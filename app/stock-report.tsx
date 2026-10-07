import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { Card, Header, Screen, s } from '../components/ui';
import { AppIcon } from '../components/AppIcon';
import { ReportExportButtons } from '../components/ReportExportButtons';
import { C, SERIF, money } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function StockReport() {
  const { products, stockValue } = useApp();
  const low = products.filter((p) => p.qty <= p.reorderAt);

  return (
    <Screen>
      <Header title="Stock Report" sub="" />
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
        <View style={[s.card, { flex: 1, marginBottom: 0 }]}><Text style={s.muted}>Total Products</Text><Text style={r.value}>{products.length}</Text></View>
        <View style={[s.card, { flex: 1, marginBottom: 0 }]}><Text style={s.muted}>Stock Value</Text><Text style={[r.value, { color: C.orange }]}>{money(Math.round(stockValue))}</Text></View>
      </View>

      {low.length > 0 && (
        <Card style={r.lowCard}>
          <View style={r.lowHeading}><AppIcon name="alert-outline" size={18} color={C.red} /><Text style={r.lowTitle}>Low Stock Alert</Text></View>
          {low.map((p) => (
            <View key={p.id} style={r.lowRow}>
              <View><Text style={r.itemName}>{p.name}</Text><Text style={s.muted}>Reorder at {p.reorderAt} units</Text></View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={r.left}>{p.qty} left</Text>
                <View style={s.badge}><Text style={{ color: C.red, fontWeight: '800', fontSize: 12 }}>Low Stock</Text></View>
              </View>
            </View>
          ))}
        </Card>
      )}

      <Card>
        <Text style={r.allTitle}>All Products</Text>
        {products.map((p) => {
          const isLow = p.qty <= p.reorderAt;
          return (
            <View key={p.id} style={r.allRow}>
              <Text style={r.itemName}>{p.name}</Text>
              <Text style={[r.units, isLow && { color: C.red }]}>{p.qty} units</Text>
            </View>
          );
        })}
      </Card>

      <ReportExportButtons kind="stock" />
    </Screen>
  );
}

const r = StyleSheet.create({
  value: { fontFamily: SERIF, fontSize: 26, fontWeight: '800', color: C.dark, marginTop: 6 },
  lowCard: { borderColor: '#F7C9C9', backgroundColor: '#FDECEC' },
  lowHeading: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  lowTitle: { color: C.red, fontWeight: '800', fontSize: 15 },
  lowRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  itemName: { fontWeight: '800', color: C.ink, fontSize: 15, marginBottom: 2 },
  left: { color: C.red, fontWeight: '800' },
  allTitle: { fontWeight: '800', fontSize: 16, color: C.ink, marginBottom: 8 },
  allRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  units: { fontWeight: '800', color: C.green },
});
