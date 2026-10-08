import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Header, Screen, s } from '../components/ui';
import { AppIcon } from '../components/AppIcon';
import { C } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { normalizePhone, whatsappUrl, smsUrl } from '../utils/message';

type SendOn = 'Today' | 'Tomorrow' | 'Custom';
type Channel = 'WhatsApp' | 'SMS';

export default function CreateReminder() {
  const { debtorId } = useLocalSearchParams<{ debtorId?: string }>();
  const { debtors, form, addReminder } = useApp();
  const [open, setOpen] = useState(false);
  const [did, setDid] = useState<string | number | undefined>(debtorId ?? debtors[0]?.id);
  const [sendOn, setSendOn] = useState<SendOn>('Tomorrow');
  const [channel, setChannel] = useState<Channel>('WhatsApp');
  const [sending, setSending] = useState(false);

  const d = debtors.find((x) => String(x.id) === String(did));
  const bizName = form.bizName || 'your business';
  const dueText = d ? (d.days === 0 ? 'today' : d.days === 1 ? 'tomorrow' : `in ${d.days} days`) : '';
  const itemLine = d?.item ? ` for ${d.item}` : '';
  const message = d
    ? `Hello ${d.name}, this is a friendly reminder from ${bizName}. You have an outstanding balance of $${d.amount}${itemLine}, due ${dueText}. Kindly settle at your earliest convenience. Thank you!`
    : '';

  const digits = normalizePhone(d?.phone ?? '');
  const canSend = Boolean(d && digits.length > 0);

  const sendNow = async () => {
    if (!d || !digits) return Alert.alert('No phone number', 'Add a phone number for this debtor first.');
    const url = channel === 'WhatsApp' ? whatsappUrl(d.phone, message) : smsUrl(d.phone, message);
    setSending(true);
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) {
        return Alert.alert('Not available', channel === 'WhatsApp' ? 'WhatsApp is not installed on this device.' : 'SMS is not available on this device.');
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open', `Could not open ${channel}.`);
    } finally {
      setSending(false);
    }
  };

  const save = () => {
    if (!d) return;
    addReminder({ debtorId: d.id, debtorName: d.name, amount: d.amount, sendOn });
    router.back();
  };

  return (
    <Screen>
      <Header title="Create Reminder" sub="" />
      <Text style={s.label}>Select Debtor</Text>
      <Pressable style={[s.input, c.select]} onPress={() => setOpen(!open)}>
        <Text style={{ fontSize: 16, color: C.ink }}>{d ? `${d.name} — $${d.amount}` : 'No debtors'}</Text>
        <Text style={{ color: C.muted }}>▾</Text>
      </Pressable>
      {open && (
        <View style={c.dropdown}>
          {debtors.map((x) => (
            <Pressable key={x.id} style={c.item} onPress={() => { setDid(x.id); setOpen(false); }}>
              <Text style={{ fontSize: 16, color: C.ink }}>{x.name} — ${x.amount}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={{ height: 20 }} />

      <Text style={s.label}>Message Preview</Text>
      <View style={c.preview}><Text style={c.previewText}>{message}</Text></View>
      <View style={{ height: 20 }} />

      <Text style={s.label}>Send Via</Text>
      <View style={c.sendRow}>
        {(['WhatsApp', 'SMS'] as Channel[]).map((opt) => (
          <Pressable key={opt} style={[c.sendChip, channel === opt && c.sendChipOn]} onPress={() => setChannel(opt)}>
            <Text style={[c.sendText, channel === opt && { color: C.dark }]}>{opt}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>Send On</Text>
      <View style={c.sendRow}>
        {(['Today', 'Tomorrow', 'Custom'] as SendOn[]).map((opt) => (
          <Pressable key={opt} style={[c.sendChip, sendOn === opt && c.sendChipOn]} onPress={() => setSendOn(opt)}>
            <Text style={[c.sendText, sendOn === opt && { color: C.dark }]}>{opt}</Text>
          </Pressable>
        ))}
      </View>

      <View style={c.notice}>
        <AppIcon name="message-text-outline" size={18} color={C.dark} />
        <Text style={c.noticeText}>Sends to <Text style={{ fontWeight: '800' }}>{d?.phone || '—'}</Text> via {channel}</Text>
      </View>

      <Button label={sending ? 'Opening…' : `Send via ${channel}`} disabled={!canSend || sending} onPress={() => void sendNow()} />
      <View style={{ height: 12 }} />
      <Button label="Schedule Reminder" outline onPress={save} disabled={!d} />
    </Screen>
  );
}

const c = StyleSheet.create({
  select: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdown: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 16, marginTop: 6 },
  item: { padding: 14, borderBottomWidth: 1, borderBottomColor: C.line },
  preview: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 7, padding: 16 },
  previewText: { color: C.ink, lineHeight: 21, fontSize: 14 },
  sendRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  sendChip: { flex: 1, borderWidth: 1.5, borderColor: C.line, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff' },
  sendChipOn: { backgroundColor: C.mint, borderColor: C.green },
  sendText: { fontWeight: '700', color: C.ink },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.mint, borderRadius: 14, padding: 14, marginBottom: 20 },
  noticeText: { color: C.dark, fontSize: 13 },
});
