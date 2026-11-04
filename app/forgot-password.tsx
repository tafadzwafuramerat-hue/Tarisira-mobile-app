import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Field, Header, Screen, s } from '../components/ui';
import { AppIcon } from '../components/AppIcon';
import { C, SERIF } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { errorMessage } from '../utils/errors';
import { supabase, supabaseConfigured, supabaseUrlString } from '../lib/supabase';

export default function ForgotPassword() {
  const { t, session } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const reset = async () => {
    if (!identifier.trim()) {
      Alert.alert(t.forgot, 'Enter your email or phone number.');
      return;
    }
    setBusy(true);
    try {
      const cred = identifier.trim();
      if (cred.includes('@')) {
        if (supabaseConfigured && supabase) {
          const { error } = await supabase.auth.resetPasswordForEmail(cred, {
            redirectTo: 'tarisira://reset-password',
          });
          if (error) throw error;
        }
      } else {
        if (supabaseConfigured && supabaseUrlString) {
          const res = await fetch(`${supabaseUrlString}/functions/v1/reset-password-phone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: cred }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Failed' }));
            throw new Error(err.error || 'Failed');
          }
        }
      }
      setSent(true);
    } catch (error) {
      Alert.alert(t.forgot, errorMessage(error, 'Could not send reset link.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title={t.forgot} sub="" />
      {sent ? (
        <View style={f.center}>
          <View style={f.iconBox}><AppIcon name="email-check-outline" size={32} color={C.green} /></View>
          <Text style={[s.h1, { marginTop: 16, fontSize: 22 }]}>{t.forgot} sent</Text>
          <Text style={[s.muted, { textAlign: 'center', marginTop: 8 }]}>Check your email or phone for a reset link.</Text>
          <Button label="Back to Login" style={{ marginTop: 24, paddingVertical: 15, paddingHorizontal: 10 }} onPress={() => router.replace('/login')} />
        </View>
      ) : (
        <>
          <Text style={s.muted}>Enter the email or phone number associated with your account. We will send you a reset link.</Text>
          <Field label={t.phoneEmail} placeholder={t.phoneEmail} autoCapitalize="none" value={identifier} onChangeText={setIdentifier} keyboardType="email-address" />
          <Button label={busy ? 'Sending…' : 'Send Reset Link'} onPress={reset} />
          <View style={{ height: 16 }} />
          <Button outline label="Back to Login" style={{ paddingVertical: 15, paddingHorizontal: 10 }} onPress={() => router.back()} />
        </>
      )}
    </Screen>
  );
}

const f = StyleSheet.create({
  center: { alignItems: 'center', marginTop: 40 },
  iconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
});