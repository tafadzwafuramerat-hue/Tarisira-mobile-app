import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { AppIcon } from '../components/AppIcon';
import { C, SERIF } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { errorMessage } from '../utils/errors';

type Row = { icon: React.ComponentProps<typeof AppIcon>['name']; label: string; right?: string; onPress?: () => void };
const soon = () => Alert.alert('Coming soon', 'This page is not built yet.');

export default function Settings() {
  const { form, lang, signOut, backendConfigured } = useApp();
  const insets = useSafeAreaInsets();

  const groups: Row[][] = [
    [
      { icon: 'domain', label: 'Business Profile', onPress: () => router.push('/business-profile') },
      { icon: 'web', label: 'Language', right: lang === 'en' ? 'English' : 'Shona', onPress: () => router.push('/language-settings') },
      { icon: 'bell-outline', label: 'Notifications', onPress: () => router.push('/notifications') },
      { icon: 'star-outline', label: 'Subscription', onPress: () => router.push('/subscription') },
    ],
    [
      { icon: 'lock-outline', label: 'Privacy & Security' },
      { icon: 'export-variant', label: 'Export Data', onPress: () => router.push('/export-data') },
      { icon: 'message-text-outline', label: 'WhatsApp Bot', onPress: () => router.push('/whatsapp') },
      { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => router.push('/help') },
    ],
  ];

  const logout = () =>
    Alert.alert('Log out?', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        try {
          if (backendConfigured) await signOut();
          router.replace('/login');
        } catch (error) {
          Alert.alert('Log out failed', error instanceof Error ? error.message : 'Please try again.');
        }
      } },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: C.page }}>
      <StatusBar style="light" />
      <View style={[z.bar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}><Text style={z.back}>‹</Text></Pressable>
        <Text style={z.barTitle}>Settings</Text>
      </View>
      <ScrollView>
        <View style={z.profile}>
          <View style={z.bigLogo}><AppIcon name="leaf" size={36} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={z.name}>{form.bizName || 'Your Business'}</Text>
            <Text style={z.muted}>{form.bizPhone || form.phone || '+263'} · {form.location.split(',')[0]}</Text>
            <View style={z.badge}><Text style={z.badgeText}>Free Trial · 60 days left</Text></View>
          </View>
        </View>
        {groups.map((g, i) => (
          <View key={i} style={z.group}>
            {g.map((r) => (
              <Pressable key={r.label} style={z.row} onPress={r.onPress ?? soon}>
                <View style={z.iconBox}><AppIcon name={r.icon} size={22} color={C.dark} /></View>
                <Text style={z.label}>{r.label}</Text>
                {r.right ? <Text style={{ color: C.muted, fontWeight: '700' }}>{r.right}</Text> : <Text style={z.chev}>›</Text>}
              </Pressable>
            ))}
          </View>
        ))}
        <View style={[z.group, { marginBottom: 32 }]}>
          <Pressable style={z.row} onPress={logout}>
            <View style={[z.iconBox, { backgroundColor: C.pink }]}><AppIcon name="logout" size={22} color={C.red} /></View>
            <Text style={[z.label, { color: C.red }]}>Log Out</Text><Text style={z.chev}>›</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const z = StyleSheet.create({
  bar: { backgroundColor: C.dark, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14 },
  back: { color: '#fff', fontSize: 30, marginRight: 12, lineHeight: 30 },
  barTitle: { fontFamily: SERIF, fontSize: 20, fontWeight: '800', color: '#fff' },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#fff', padding: 20 },
  bigLogo: { width: 68, height: 68, borderRadius: 18, backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 19, fontWeight: '800', color: C.ink, marginBottom: 2 },
  muted: { color: C.muted, fontSize: 13 },
  badge: { alignSelf: 'flex-start', backgroundColor: C.mint, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, marginTop: 8 },
  badgeText: { color: C.dark, fontWeight: '800', fontSize: 12 },
  group: { backgroundColor: '#fff', marginTop: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EAF3EE' },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F6F3', alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 16, fontWeight: '600', color: C.ink },
  chev: { color: '#B5C7BD', fontSize: 24 },
});
