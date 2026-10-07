import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Field, Screen, s } from '../components/ui';
import { AppIcon } from '../components/AppIcon';
import { C, SERIF } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { t, backendConfigured, signIn } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const doLogin = async () => {
    if (!backendConfigured) {
      router.replace('/home');
      return;
    }
    setBusy(true);
    try {
      await signIn(identifier, password);
      router.replace('/home');
    } catch (error) {
      Alert.alert(t.login, error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <View style={l.logoRow}>
        <View style={l.logoBox}><AppIcon name="leaf" size={21} color="#fff" /></View>
        <Text style={l.logoText}>TARISIRA</Text>
      </View>
      <Text style={[s.h1, { marginTop: 24 }]}>{t.welcome}</Text>
      <Text style={s.sub}>{t.signin}</Text>
      <Field label={t.phoneEmail} placeholder={t.phoneEmail} autoCapitalize="none" value={identifier} onChangeText={setIdentifier} keyboardType="email-address" />
      <Field label={t.password} placeholder={t.password} secureTextEntry value={password} onChangeText={setPassword} />
      <Text style={l.forgot}>{t.forgot}</Text>
      <Button label={busy ? 'Signing in…' : t.login} disabled={busy} onPress={() => void doLogin()} />
      <View style={l.orRow}><View style={l.orLine} /><Text style={l.orText}>{t.or}</Text><View style={l.orLine} /></View>
      <Button outline label={t.create} onPress={() => router.push('/signup')} />
      <Text style={l.foot}>{t.newTo} <Text style={l.bold} onPress={() => router.push('/signup')}>{t.signupFree}</Text></Text>
    </Screen>
  );
}

const l = StyleSheet.create({
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  logoBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: SERIF, fontSize: 22, fontWeight: '800', color: C.dark, letterSpacing: 1 },
  forgot: { textAlign: 'right', color: C.green, fontWeight: '700', fontSize: 13, marginBottom: 20 },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  orLine: { flex: 1, height: 1, backgroundColor: C.line },
  orText: { marginHorizontal: 10, color: C.muted, fontSize: 12 },
  foot: { textAlign: 'center', color: C.muted, marginTop: 20, fontSize: 14 },
  bold: { color: C.dark, fontWeight: '700' },
});
