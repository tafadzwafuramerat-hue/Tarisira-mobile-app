import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../../components/LocalizedText';
import { router } from 'expo-router';
import { ProductForm } from '../../components/forms';
import { AppIcon } from '../../components/AppIcon';
import { Badge, Card, Search, s } from '../../components/ui';
import { C, SERIF, money } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

export default function Stock() {
  const { products, lowCount } = useApp();
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const list = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Search value={q} onChangeText={setQ} placeholder="Search products..." /></View>
        <Pressable style={k.add} onPress={() => setAdding(true)}><Text style={s.btnText}>+ Add</Text></Pressable>
      </View>
      {lowCount > 0 && (
        <View style={k.alert}>
          <AppIcon name="alert-outline" size={20} color={C.red} />
          <Text style={k.alertText}>{lowCount} product{lowCount > 1 ? 's' : ''} running low on stock</Text>
        </View>
      )}
      {list.map((p) => {
        const low = p.qty <= p.reorderAt;
        return (
          <Pressable key={p.id} onPress={() => router.push(`/product/${p.id}`)}>
          <Card style={k.row}>
            <View style={{ flex: 1 }}>
              <Text style={k.name}>{p.name}</Text>
              <Text style={s.muted}>{p.cat} · {money(p.price)} / unit</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <Text style={[k.qty, low && { color: C.red }]}>{p.qty}</Text>
              <Badge text={low ? 'Low Stock' : 'In Stock'} bad={low} />
            </View>
          </Card>
          </Pressable>
        );
      })}
      {list.length === 0 && <Text style={k.empty}>No products found.</Text>}
      {adding && <ProductForm onClose={() => setAdding(false)} />}
    </ScrollView>
  );
}

const k = StyleSheet.create({
  add: { backgroundColor: C.dark, borderRadius: 16, paddingHorizontal: 18, justifyContent: 'center' },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FDECEC', borderWidth: 1, borderColor: '#F7C9C9', borderRadius: 14, padding: 14, marginVertical: 14 },
  alertText: { color: '#B42318', fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '800', color: C.ink, marginBottom: 4 },
  qty: { fontFamily: SERIF, fontSize: 22, fontWeight: '800', color: C.dark },
  empty: { textAlign: 'center', color: C.muted, marginTop: 24 },
});
