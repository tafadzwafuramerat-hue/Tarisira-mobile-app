import React, { ReactNode, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from './LocalizedText';
import { C, SERIF } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { Button, Field, s } from './ui';

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={f.backdrop} onPress={onClose} />
      <View style={f.sheet}>
        <Text style={f.title}>{title}</Text>
        <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
      </View>
    </Modal>
  );
}

export function ProductForm({ onClose }: { onClose: () => void }) {
  const { addProduct } = useApp();
  const [v, setV] = useState({ name: '', cat: '', price: '', qty: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (x: string) => setV({ ...v, [k]: x });
  const save = async () => {
    const price = parseFloat(v.price), qty = parseInt(v.qty, 10);
    if (!v.name.trim() || !(price > 0) || !(qty >= 0)) return Alert.alert('Missing details', 'Enter a name, a price and a quantity.');
    setBusy(true);
    try {
      await addProduct({ name: v.name.trim(), cat: v.cat.trim() || 'Other', price, qty });
      onClose();
    } catch (error) {
      Alert.alert('Product could not be saved', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet title="Add Product" onClose={onClose}>
      <Field label="Product name" value={v.name} onChangeText={set('name')} placeholder="e.g. Rice 5kg" />
      <Field label="Category" value={v.cat} onChangeText={set('cat')} placeholder="e.g. Groceries" />
      <Field label="Price per unit ($)" keyboardType="decimal-pad" value={v.price} onChangeText={set('price')} />
      <Field label="Quantity in stock" keyboardType="number-pad" value={v.qty} onChangeText={set('qty')} />
      <Button label={busy ? 'Saving…' : 'Save Product'} disabled={busy} onPress={() => void save()} />
    </Sheet>
  );
}

export function DebtorForm({ onClose }: { onClose: () => void }) {
  const { addDebtor } = useApp();
  const [v, setV] = useState({ name: '', amount: '', days: '7' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (x: string) => setV({ ...v, [k]: x });
  const save = async () => {
    const amount = parseFloat(v.amount), days = parseInt(v.days, 10);
    if (!v.name.trim() || !(amount > 0)) return Alert.alert('Missing details', 'Enter a name and the amount owed.');
    setBusy(true);
    try {
      await addDebtor({ name: v.name.trim(), amount, days: days >= 0 ? days : 7 });
      onClose();
    } catch (error) {
      Alert.alert('Debtor could not be saved', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet title="Add Debtor" onClose={onClose}>
      <Field label="Customer name" value={v.name} onChangeText={set('name')} />
      <Field label="Amount owed ($)" keyboardType="decimal-pad" value={v.amount} onChangeText={set('amount')} />
      <Field label="Due in (days)" keyboardType="number-pad" value={v.days} onChangeText={set('days')} />
      <Button label={busy ? 'Saving…' : 'Save Debtor'} disabled={busy} onPress={() => void save()} />
    </Sheet>
  );
}

const f = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  title: { fontFamily: SERIF, fontSize: 22, fontWeight: '800', color: C.ink, marginBottom: 14 },
  pick: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 14, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  pickOn: { backgroundColor: C.mint, borderColor: C.green },
  pickName: { fontWeight: '700', color: C.ink },
  total: { fontFamily: SERIF, fontSize: 22, fontWeight: '800', color: C.dark, marginBottom: 14 },
});
