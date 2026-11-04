import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { Button, Header, Screen } from '../components/ui';
import { AppIcon } from '../components/AppIcon';
import { C, SERIF } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { errorMessage } from '../utils/errors';

const METHODS: { id: string; icon: React.ComponentProps<typeof AppIcon>['name']; title: string; sub: string }[] = [
  { id: 'ecocash', icon: 'cellphone', title: 'EcoCash', sub: 'Pay via EcoCash' },
  { id: 'onemoney', icon: 'cellphone', title: 'OneMoney', sub: 'Pay via OneMoney' },
  { id: 'mukuru', icon: 'cellphone', title: 'Mukuru', sub: 'Pay via Mukuru' },
  { id: 'card', icon: 'credit-card-outline', title: 'Card', sub: 'Visa / Mastercard' },
];

export default function Subscribe() {
  const { recordSubscriptionPayment, hasSubscription } = useApp();
  const [method, setMethod] = useState('ecocash');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  const pay = async () => {
    if (!phone.trim()) {
      Alert.alert('Phone required', 'Enter your mobile money number.');
      return;
    }
    setBusy(true);
    try {
      const subscriptionId = await recordSubscriptionPayment(3.00, method, phone.trim());
      if (!subscriptionId) {
        Alert.alert('Error', 'Could not process payment.');
        return;
      }
      Alert.alert(
        'Payment initiated',
        'Complete the payment on the Paynow page that opened. Your subscription will activate once confirmed.',
        [{ text: 'OK' }]
      );
      setPhone('');
    } catch (error) {
      Alert.alert('Payment failed', errorMessage(error, 'Could not start payment.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="Subscribe" sub="" />
      <View style={p.plan}>
        <Text style={p.planLabel}>STANDARD PLAN</Text>
        <Text style={p.price}>$3 / month</Text>
        <Text style={p.muted}>Cancel anytime · No contracts</Text>
        {hasSubscription ? <Text style={{ color: C.green, fontWeight: '700', marginTop: 8 }}>Active subscription</Text> : null}
      </View>

      <Text style={p.sectionLabel}>Payment Method</Text>
      {METHODS.map((m) => (
        <Pressable key={m.id} style={[p.method, method === m.id && p.methodOn]} onPress={() => setMethod(m.id)}>
          <AppIcon name={m.icon} size={26} color={C.dark} />
          <View style={{ flex: 1 }}>
            <Text style={p.methodTitle}>{m.title}</Text>
            <Text style={p.muted}>{m.sub}</Text>
          </View>
          {method === m.id && <AppIcon name="check" size={18} color={C.green} />}
        </Pressable>
      ))}
      {method !== 'card' && (
        <View style={{ marginBottom: 12 }}>
          <Text style={p.sectionLabel}>Mobile Money Number</Text>
          <View style={p.phoneRow}>
            <Pressable style={p.country}><Text style={p.countryText}>+263</Text></Pressable>
            <TextInput style={p.phoneInput} placeholder="77 123 4567" keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholderTextColor="#8FA79B" />
          </View>
        </View>
      )}
      <Button label={busy ? 'Recording…' : 'Pay $3.00'} style={{ backgroundColor: C.orange }} onPress={pay} />
    </Screen>
  );
}

const p = StyleSheet.create({
  plan: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: C.orange, borderRadius: 7, padding: 22, alignItems: 'center', marginBottom: 20 },
  planLabel: { color: C.orange, fontWeight: '800', fontSize: 12, letterSpacing: 1.5 },
  price: { fontFamily: SERIF, fontSize: 30, fontWeight: '800', color: C.orange, marginVertical: 8 },
  muted: { color: C.muted, fontSize: 13 },
  sectionLabel: { color: C.dark, fontWeight: '700', fontSize: 13, marginBottom: 10 },
  method: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 7, padding: 16, marginBottom: 12 },
  methodOn: { backgroundColor: C.mint, borderColor: C.green },
  methodTitle: { fontWeight: '800', color: C.ink, fontSize: 15, marginBottom: 2 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  country: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 7, paddingHorizontal: 14, paddingVertical: 15 },
  countryText: { color: C.ink, fontWeight: '700' },
  phoneInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 7, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16, color: C.ink },
});
