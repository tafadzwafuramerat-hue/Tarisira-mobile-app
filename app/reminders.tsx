import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Card, Header, Screen, s } from '../components/ui';
import { C } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { normalizePhone, whatsappUrl, smsUrl } from '../utils/message';

type Channel = 'WhatsApp' | 'SMS';

export default function Reminders() {
  const { reminders, debtors } = useApp();

  const send = async (debtorId: string | number, channel: Channel) => {
    const d = debtors.find((x) => String(x.id) === String(debtorId));
    const digits = normalizePhone(d?.phone ?? '');
    if (!d || !digits) return Alert.alert('No phone number', 'This debtor has no phone number.');
    const itemLine = d.item ? ` for ${d.item}` : '';
    const message = `Hello ${d.name}, this is a friendly reminder. You have an outstanding balance of $${d.amount}${itemLine}. Kindly settle at your earliest convenience. Thank you!`;
    const url = channel === 'WhatsApp' ? whatsappUrl(d.phone, message) : smsUrl(d.phone, message);
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) return Alert.alert('Not available', channel === 'WhatsApp' ? 'WhatsApp is not installed on this device.' : 'SMS is not available on this device.');
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open', `Could not open ${channel}.`);
    }
  };

  return (
    <Screen>
      <Header title="Reminders" sub="" />
      <Button label="+ Create Reminder" onPress={() => router.push('/create-reminder')} />
      <View style={{ height: 20 }} />
      {reminders.length === 0 ? (
        <Text style={{ textAlign: 'center', color: C.muted, marginTop: 30 }}>No reminders scheduled yet</Text>
      ) : reminders.map((r) => (
        <Card key={r.id}>
          <Text style={{ fontWeight: '800', color: C.ink, fontSize: 15, marginBottom: 4 }}>{r.debtorName} · ${r.amount}</Text>
          <Text style={s.muted}>Sending {r.sendOn.toLowerCase()} · scheduled {r.createdLabel}</Text>
          <View style={c.row}>
            <Pressable style={c.chip} onPress={() => void send(r.debtorId, 'WhatsApp')}>
              <Text style={c.chipText}>WhatsApp</Text>
            </Pressable>
            <Pressable style={c.chip} onPress={() => void send(r.debtorId, 'SMS')}>
              <Text style={c.chipText}>SMS</Text>
            </Pressable>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const c = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  chip: { flex: 1, borderWidth: 1.5, borderColor: C.line, borderRadius: 12, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff' },
  chipText: { fontWeight: '700', color: C.dark, fontSize: 14 },
});
