import React from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Field, Header, Screen, s } from '../components/ui';
import { AppIcon } from '../components/AppIcon';
import { C } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { errorMessage } from '../utils/errors';

export default function Signup() {
  const { t, form, setForm, backendConfigured, signUp } = useApp();
  const ok = form.name && form.phone && form.password && form.agree;
  const [busy, setBusy] = React.useState(false);
  const continueSignup = async () => {
    if (!ok) return;
    if (!backendConfigured) {
      router.push('/business');
      return;
    }
    setBusy(true);
    try {
      await signUp({ email: form.email, phone: form.phone, password: form.password, name: form.name });
      router.push('/business');
    } catch (error) {
      Alert.alert(t.createTitle, error instanceof Error ? error.message : 'Unable to create account.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Header step={1} title={t.createTitle} sub={t.personal} />
      <Field label={t.fullName} placeholder={t.fullName} value={form.name} onChangeText={(v) => setForm({ name: v })} />
      <Field label="Email (optional)" placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(v) => setForm({ email: v })} />
      <Field label={t.phone} placeholder="+263 XX XXX XXXX" keyboardType="phone-pad" value={form.phone} onChangeText={(v) => setForm({ phone: v })} />
      <Field label={t.password} placeholder={t.password} secureTextEntry value={form.password} onChangeText={(v) => setForm({ password: v })} />
      <Pressable style={g.row} onPress={() => setForm({ agree: !form.agree })}>
        <Pressable style={[s.check, form.agree && { backgroundColor: C.green, borderColor: C.green }]} onPress={() => setForm({ agree: !form.agree })}>
          {form.agree && <AppIcon name="check" size={14} color="#fff" />}
        </Pressable>
        <Text style={g.text}>{t.agree} <Text style={g.bold}>{t.tos}</Text> {t.and} <Text style={g.bold}>{t.pp}</Text></Text>
      </Pressable>
      <Button label={busy ? 'Creating account…' : t.cont} disabled={!ok || busy} onPress={() => void continueSignup()} />
      <Text style={g.foot}>{t.have} <Text style={g.bold} onPress={() => router.replace('/login')}>{t.login}</Text></Text>
    </Screen>
  );
}

const g = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  text: { flex: 1, color: C.muted, fontSize: 13, lineHeight: 20 },
  bold: { color: C.dark, fontWeight: '700' },
  foot: { textAlign: 'center', color: C.muted, marginTop: 20, fontSize: 14 },
});
