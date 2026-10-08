import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Field, Header, Screen, s } from '../components/ui';
import { C, SERIF, money } from '../constants/theme';
import { useApp } from '../context/AppContext';

const METHODS = ['Cash', 'Mobile Money', 'Card', 'Credit'];

export default function RecordSale() {
  const { products, recordSale } = useApp();
  const [open, setOpen] = useState(false);
  const [pid, setPid] = useState<string | number | undefined>(products[0]?.id);
  const [qty, setQty] = useState('1');
  const [customer, setCustomer] = useState('');
  const [method, setMethod] = useState('Cash');

  const p = products.find((x) => String(x.id) === String(pid));
  const n = parseInt(qty, 10) || 0;
  const total = (p?.price || 0) * n;

  const save = () => {
    if (!p || n < 1) return Alert.alert('Check the quantity', 'Enter at least 1.');
    if (n > p.qty) return Alert.alert('Not enough stock', `Only ${p.qty} ${p.name} left.`);
    recordSale(p, n, customer.trim(), method);
    Alert.alert('Sale saved', `${p.name} × ${n} for ${money(total)}`, [{ text: 'OK', onPress: () => router.back() }]);
  };

  return (
    <Screen>
      <Header title="Record Sale" sub="" />
      <Text style={s.label}>Product</Text>
      <Pressable style={[s.input, r.select]} onPress={() => setOpen(!open)}>
        <Text style={{ fontSize: 16, color: C.ink }}>{p?.name}</Text><Text style={{ color: C.muted }}>▾</Text>
      </Pressable>
      {open && (
        <View style={r.dropdown}>
          {products.map((x) => (
            <Pressable key={x.id} style={r.item} onPress={() => { setPid(x.id); setOpen(false); }}>
              <Text style={{ fontSize: 16, color: C.ink }}>{x.name}</Text>
              <Text style={s.muted}>{x.qty} left</Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={{ height: 16 }} />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><Field label="Quantity" keyboardType="number-pad" value={qty} onChangeText={setQty} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Unit Price</Text>
          <View style={[s.input, r.readonly]}><Text style={{ fontSize: 16, color: C.muted }}>{money(p?.price || 0)}</Text></View>
        </View>
      </View>

      <View style={r.totalBox}>
        <Text style={s.label}>Total</Text>
        <Text style={r.totalValue}>{money(total)}</Text>
      </View>

      <Field label="Customer (optional)" placeholder="e.g. John" value={customer} onChangeText={setCustomer} />

      <Text style={s.label}>Payment Method</Text>
      <View style={r.methodGrid}>
        {METHODS.map((m) => (
          <Pressable key={m} style={[r.method, method === m && r.methodOn]} onPress={() => setMethod(m)}>
            <Text style={[r.methodText, method === m && { color: C.dark }]}>{m}</Text>
          </Pressable>
        ))}
      </View>

      <Button label="Save Sale" onPress={save} />
      <Button label="Cancel" outline onPress={() => router.back()} />
    </Screen>
  );
}

const r = StyleSheet.create({
  select: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdown: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 16, marginTop: 6 },
  item: { padding: 14, borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', justifyContent: 'space-between' },
  readonly: { justifyContent: 'center', backgroundColor: '#F4F8F6' },
  totalBox: { backgroundColor: C.mint, borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalValue: { fontFamily: SERIF, fontSize: 24, fontWeight: '800', color: C.orange },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  method: { width: '47%', borderWidth: 1.5, borderColor: C.line, borderRadius: 14, paddingVertical: 16, alignItems: 'center', backgroundColor: '#fff' },
  methodOn: { backgroundColor: C.mint, borderColor: C.green },
  methodText: { fontWeight: '700', color: C.ink },
});
