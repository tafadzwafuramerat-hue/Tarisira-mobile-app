import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { Card, Header, Screen, s } from '../components/ui';
import { AppIcon } from '../components/AppIcon';
import { C } from '../constants/theme';

const FAQS = [
  ['How do I record a sale?', "Go to the Sales tab or Home screen and tap '+ Record Sale'. Pick the product, quantity and payment method."],
  ['How do debt reminders work?', 'Open a debtor from the Debtors tab, tap Send Reminder, and it will be sent to them on WhatsApp.'],
  ['Can I use more than one currency?', 'Yes. You chose your currencies during setup, and you can change them in Business Profile.'],
  ['Is my data backed up?', "We're working on cloud backup for your account. For now, use Export Data to keep a copy."],
];

const CONTACTS: { icon: React.ComponentProps<typeof AppIcon>['name']; title: string; action: () => void }[] = [
  { icon: 'message-text-outline', title: 'Chat on WhatsApp', action: () => Linking.openURL('https://wa.me/263771234567') },
  { icon: 'email-outline', title: 'Email support', action: () => Linking.openURL('mailto:support@tarisira.app') },
];

export default function Help() {
  return (
    <Screen>
      <Header title="Help & Support" sub="" />
      <Card>
        <Text style={h.title}>Contact us</Text>
        {CONTACTS.map((c) => (
          <Pressable key={c.title} style={h.contactRow} onPress={c.action}>
            <AppIcon name={c.icon} size={22} color={C.dark} />
            <Text style={h.contactText}>{c.title}</Text>
            <Text style={{ color: '#B5C7BD', fontSize: 22, marginLeft: 'auto' }}>›</Text>
          </Pressable>
        ))}
      </Card>
      <Card>
        <Text style={h.title}>Frequently asked questions</Text>
        {FAQS.map(([q, a], i) => (
          <View key={q} style={[h.faqRow, i === FAQS.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={h.q}>{q}</Text>
            <Text style={s.muted}>{a}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const h = StyleSheet.create({
  title: { fontWeight: '800', fontSize: 16, color: C.ink, marginBottom: 10 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  contactText: { fontWeight: '700', color: C.ink, fontSize: 15 },
  faqRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  q: { fontWeight: '800', color: C.ink, fontSize: 14, marginBottom: 4 },
});
