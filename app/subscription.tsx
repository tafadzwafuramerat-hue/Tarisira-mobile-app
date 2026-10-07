import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Header, Screen } from '../components/ui';
import { AppIcon } from '../components/AppIcon';
import { C, SERIF } from '../constants/theme';

const PERKS = [
  'Unlimited products & sales', 'Debt management & reminders', 'Business reports',
  'WhatsApp bot (English & Shona)', 'Data export (PDF & CSV)', 'Priority support',
];

export default function Subscription() {
  const daysLeft = 42, trialDays = 60;
  const pct = Math.round(((trialDays - daysLeft) / trialDays) * 100);
  const endDate = new Date(Date.now() + daysLeft * 86400000).toLocaleDateString('en', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Screen>
      <Header title="Subscription" sub="" />
      <View style={v.card}>
        <Text style={v.label}>CURRENT PLAN</Text>
        <Text style={v.plan}>FREE TRIAL</Text>
        <Text style={v.days}>{daysLeft} days remaining</Text>
        <View style={v.track}><View style={[v.fill, { width: `${pct}%` }]} /></View>
        <Text style={v.muted}>Trial ends {endDate}</Text>
        <View style={v.divider} />
        <Text style={v.muted}>After your free trial</Text>
        <Text style={v.price}>$3 / month</Text>
      </View>

      <Button label="Subscribe Now" onPress={() => router.push('/subscribe')} />

      <View style={v.includeCard}>
        <Text style={v.includeTitle}>What's included</Text>
        {PERKS.map((p, i) => (
          <View key={p} style={[v.perkRow, i === PERKS.length - 1 && { borderBottomWidth: 0 }]}>
            <AppIcon name="check" size={16} color={C.green} />
            <Text style={v.perkText}>{p}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const v = StyleSheet.create({
  card: { backgroundColor: C.mint, borderWidth: 1.5, borderColor: C.green, borderRadius: 7, padding: 20, alignItems: 'center', marginBottom: 18 },
  label: { color: C.green, fontWeight: '800', fontSize: 12, letterSpacing: 1.5 },
  plan: { fontFamily: SERIF, fontSize: 26, fontWeight: '800', color: C.dark, marginVertical: 6 },
  days: { fontWeight: '700', color: C.ink, marginBottom: 12 },
  track: { width: '100%', height: 6, borderRadius: 3, backgroundColor: '#C9E4D6', marginBottom: 10 },
  fill: { height: 6, borderRadius: 3, backgroundColor: C.green },
  muted: { color: C.muted, fontSize: 13 },
  divider: { width: '100%', height: 1, backgroundColor: C.line, marginVertical: 14 },
  price: { fontFamily: SERIF, fontSize: 28, fontWeight: '800', color: C.orange, marginTop: 4 },
  includeCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 7, padding: 18, marginTop: 10 },
  includeTitle: { fontWeight: '800', fontSize: 16, color: C.ink, marginBottom: 10 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  perkText: { color: C.ink, fontSize: 14 },
});
