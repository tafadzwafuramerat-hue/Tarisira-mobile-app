import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { Button, Header, Screen } from '../components/ui';
import { AppIcon } from '../components/AppIcon';
import { C, SERIF } from '../constants/theme';

const METHODS: { id: string; icon: React.ComponentProps<typeof AppIcon>['name']; title: string; sub: string }[] = [
  { id: 'mobile', icon: 'cellphone', title: 'Mobile Money', sub: 'EcoCash, OneMoney, Mukuru' },
  { id: 'card', icon: 'credit-card-outline', title: 'Card', sub: 'Visa / Mastercard' },
  { id: 'bank', icon: 'bank-outline', title: 'Bank Transfer', sub: 'Local or international' },
];

export default function Subscribe() {
  const [method, setMethod] = useState('mobile');
  return (
    <Screen>
      <Header title="Subscribe" sub="" />
      <View style={p.plan}>
        <Text style={p.planLabel}>STANDARD PLAN</Text>
        <Text style={p.price}>$3 / month</Text>
        <Text style={p.muted}>Cancel anytime · No contracts</Text>
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

      <Button label="Pay $3.00" style={{ backgroundColor: C.orange }} onPress={() => Alert.alert('Coming soon', 'Payments are not connected yet.')} />
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
});
