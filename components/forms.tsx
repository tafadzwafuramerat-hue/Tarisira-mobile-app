import React, { ReactNode, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from './LocalizedText';
import { AppIcon } from './AppIcon';
import { C, SERIF } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { Button, Field, s } from './ui';
import { errorMessage } from '../utils/errors';

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
      Alert.alert('Product could not be saved', errorMessage(error, 'Please try again.'));
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
  const [v, setV] = useState({ name: '', phone: '', item: '', amount: '', days: '7' });
  const [ownerApprovedReminders, setOwnerApprovedReminders] = useState(false);
  const [customerSmsOptIn, setCustomerSmsOptIn] = useState(false);
  const [customerWhatsappOptIn, setCustomerWhatsappOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (x: string) => setV({ ...v, [k]: x });
  const save = async () => {
    const amount = parseFloat(v.amount), days = parseInt(v.days, 10);
    if (!v.name.trim() || !(amount > 0) || !Number.isInteger(days) || days < 0) {
      return Alert.alert('Missing details', 'Enter a name, amount owed, and a valid due date in days.');
    }
    if (ownerApprovedReminders && (!customerSmsOptIn || !customerWhatsappOptIn)) {
      return Alert.alert('Consent required', 'The customer must agree to receive both SMS and WhatsApp reminders.');
    }
    if (ownerApprovedReminders && !v.phone.trim()) {
      return Alert.alert('Phone number required', 'Enter the customer’s phone number to schedule automatic reminders.');
    }
    setBusy(true);
    try {
      await addDebtor({
        name: v.name.trim(),
        phone: v.phone.trim(),
        item: v.item.trim(),
        amount,
        days,
        ownerApprovedReminders,
        customerSmsOptIn,
        customerWhatsappOptIn,
      });
      onClose();
    } catch (error) {
      const message = errorMessage(error, 'Please try again.');
      if (message.includes('customer_sms_opt_in') && message.toLowerCase().includes('schema cache')) {
        Alert.alert(
          'Database setup required',
          'The debtor reminder columns are missing from Supabase. Run supabase/debt-reminders-setup.sql in your project’s SQL Editor, then try saving again.',
        );
      } else {
        Alert.alert('Debtor could not be saved', message);
      }
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet title="Add Debtor" onClose={onClose}>
      <Field label="Customer name" value={v.name} onChangeText={set('name')} />
      <Field label="Phone number" keyboardType="phone-pad" value={v.phone} onChangeText={set('phone')} placeholder="e.g. +263 77 123 4567" />
      <Field label="Product owed" value={v.item} onChangeText={set('item')} placeholder="e.g. Fleece 1" />
      <Field label="Amount owed ($)" keyboardType="decimal-pad" value={v.amount} onChangeText={set('amount')} />
      <Field label="Due in (days)" keyboardType="number-pad" value={v.days} onChangeText={set('days')} />
      <Pressable style={f.consentRow} onPress={() => setOwnerApprovedReminders((value) => !value)}>
        <View style={[f.checkbox, ownerApprovedReminders && f.checkboxOn]}>
          {ownerApprovedReminders && <AppIcon name="check" size={14} color="#fff" />}
        </View>
        <Text style={f.consentText}>I approve automatic reminders 24 hours before the due date.</Text>
      </Pressable>
      {ownerApprovedReminders && (
        <View style={f.customerConsent}>
          <Text style={f.consentHeading}>Confirm the customer agreed to receive:</Text>
          <Pressable style={f.consentRow} onPress={() => setCustomerSmsOptIn((value) => !value)}>
            <View style={[f.checkbox, customerSmsOptIn && f.checkboxOn]}>
              {customerSmsOptIn && <AppIcon name="check" size={14} color="#fff" />}
            </View>
            <Text style={f.consentText}>SMS reminders</Text>
          </Pressable>
          <Pressable style={f.consentRow} onPress={() => setCustomerWhatsappOptIn((value) => !value)}>
            <View style={[f.checkbox, customerWhatsappOptIn && f.checkboxOn]}>
              {customerWhatsappOptIn && <AppIcon name="check" size={14} color="#fff" />}
            </View>
            <Text style={f.consentText}>WhatsApp reminders</Text>
          </Pressable>
        </View>
      )}
      <Button label={busy ? 'Saving…' : 'Save Debtor'} disabled={busy} onPress={() => void save()} />
    </Sheet>
  );
}

export function ChangeOwedForm({ onClose }: { onClose: () => void }) {
  const { addChangeOwed } = useApp();
  const [v, setV] = useState({ customerName: '', phone: '', amount: '', note: '' });
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof v) => (value: string) => setV((current) => ({ ...current, [key]: value }));

  const save = async () => {
    const amount = Number.parseFloat(v.amount);
    if (!v.customerName.trim() || !Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Missing details', 'Enter the customer’s name and a change amount greater than zero.');
      return;
    }

    setBusy(true);
    try {
      await addChangeOwed({
        customerName: v.customerName.trim(),
        phone: v.phone.trim(),
        amount,
        note: v.note.trim(),
      });
      onClose();
    } catch (error) {
      Alert.alert('Change could not be saved', errorMessage(error, 'Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="Record Change Owed" onClose={onClose}>
      <Field label="Customer name" value={v.customerName} onChangeText={set('customerName')} placeholder="Who left their change?" />
      <Field label="Phone number (optional)" keyboardType="phone-pad" value={v.phone} onChangeText={set('phone')} placeholder="e.g. +263 77 123 4567" />
      <Field label="Change owed ($)" keyboardType="decimal-pad" value={v.amount} onChangeText={set('amount')} placeholder="0.00" />
      <Field label="Note (optional)" value={v.note} onChangeText={set('note')} placeholder="What was the change from?" />
      <Button label={busy ? 'Saving…' : 'Save Change Owed'} disabled={busy} onPress={() => void save()} />
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
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  checkbox: { width: 22, height: 22, borderWidth: 1.5, borderColor: C.line, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxOn: { backgroundColor: C.green, borderColor: C.green },
  consentText: { flex: 1, color: C.ink, fontSize: 13, lineHeight: 18 },
  customerConsent: { marginVertical: 8, padding: 12, borderRadius: 12, backgroundColor: C.mint },
  consentHeading: { color: C.dark, fontSize: 13, fontWeight: '700', marginBottom: 4 },
});
