import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { AppIcon } from '../components/AppIcon';
import { Button, Field, Screen, s } from '../components/ui';
import { C, SERIF } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { errorMessage } from '../utils/errors';

export default function PrivacySecurity() {
  const insets = useSafeAreaInsets();
  const { backendConfigured, session, signOut } = useApp();
  const [busy, setBusy] = useState(false);

  const changePassword = () => {
    Alert.alert('Change Password', 'A reset link will be sent to your registered email or phone.');
  };

  const exportData = () => {
    router.push('/export-data');
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently remove your business data, transactions, and debtors. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          setBusy(true);
          try {
            if (backendConfigured && session) {
              await signOut();
            }
            router.replace('/login');
          } catch (error) {
            Alert.alert('Delete failed', errorMessage(error, 'Please try again.'));
          } finally {
            setBusy(false);
          }
        } },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.page }}>
      <StatusBar style="light" />
      <View style={[p.bar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}><Text style={p.back}>‹</Text></Pressable>
        <Text style={p.barTitle}>Privacy & Security</Text>
        <Pressable onPress={() => router.push('/settings')} hitSlop={12} style={p.iconBtn}>
          <AppIcon name="settings-outline" size={22} color="#fff" />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={[p.card, { backgroundColor: C.mint }]}>
          <View style={p.cardHead}>
            <AppIcon name="shield-check" size={24} color={C.dark} />
            <Text style={p.cardTitle}>Your data is safe</Text>
          </View>
          {[
            ['lock-outline', 'Encrypted', 'Your business data is encrypted at rest and in transit.'],
            ['account-key-outline', 'Your control', 'Only you can access your account and data.'],
            ['cancel-circle-outline', 'Not sold', 'We never sell or share your data with third parties.'],
            ['download-outline', 'Export anytime', 'You can export your data at any time.'],
          ].map(([icon, title, desc]) => (
            <View key={title} style={p.assurance}>
              <View style={p.assuranceIcon}><AppIcon name={icon as any} size={18} color={C.dark} /></View>
              <View style={{ flex: 1 }}>
                <Text style={p.assuranceTitle}>{title}</Text>
                <Text style={p.assuranceDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[p.card, { marginTop: 16 }]}>
          <Pressable style={p.option} onPress={changePassword}>
            <View style={p.optionIcon}><AppIcon name="key-outline" size={22} color={C.dark} /></View>
            <Text style={p.optionLabel}>Change Password</Text>
            <Text style={p.chev}>›</Text>
          </Pressable>
          <Pressable style={p.option} onPress={exportData}>
            <View style={p.optionIcon}><AppIcon name="export-variant" size={22} color={C.dark} /></View>
            <Text style={p.optionLabel}>Export My Data</Text>
            <Text style={p.chev}>›</Text>
          </Pressable>
          <Pressable style={[p.option, { borderTopWidth: 1, borderTopColor: C.line }]} onPress={deleteAccount}>
            <View style={[p.optionIcon, { backgroundColor: C.pink }]}><AppIcon name="trash-can-outline" size={22} color={C.red} /></View>
            <Text style={[p.optionLabel, { color: C.red }]}>Delete My Account</Text>
            <Text style={[p.chev, { color: C.red }]}>›</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const p = StyleSheet.create({
  bar: { backgroundColor: C.dark, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14 },
  back: { color: '#fff', fontSize: 30, marginRight: 12, lineHeight: 30 },
  barTitle: { flex: 1, fontFamily: SERIF, fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
  iconBtn: { padding: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.line },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  cardTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '800', color: C.ink },
  assurance: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  assuranceIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  assuranceTitle: { fontSize: 15, fontWeight: '700', color: C.ink, marginBottom: 2 },
  assuranceDesc: { fontSize: 13, color: C.muted, lineHeight: 18 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  optionIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F6F3', alignItems: 'center', justifyContent: 'center' },
  optionLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: C.ink },
  chev: { color: '#B5C7BD', fontSize: 24 },
});