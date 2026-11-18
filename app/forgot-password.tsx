import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Field, Header, Screen, s } from '../components/ui';
import { AppIcon } from '../components/AppIcon';
import { C } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { errorMessage } from '../utils/errors';
import { supabase, supabaseConfigured } from '../lib/supabase';

export default function ForgotPassword() {
  const { t } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'identifier' | 'code' | 'password' | 'email-sent'>('identifier');

  const reset = async () => {
    if (!identifier.trim()) {
      Alert.alert(t.forgot, 'Enter your email or phone number.');
      return;
    }
    if (!supabaseConfigured || !supabase) {
      Alert.alert(t.forgot, 'Password recovery is unavailable because Supabase is not configured.');
      return;
    }

    setBusy(true);
    try {
      const cred = identifier.trim();
      if (cred.includes('@')) {
        const { error } = await supabase.auth.resetPasswordForEmail(cred, {
          redirectTo: 'tarisira://reset-password',
        });
        if (error) throw error;
        setStep('email-sent');
      } else {
        const normalizedPhone = cred.replace(/[\s()-]/g, '');
        if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
          throw new Error('Enter the phone number in international format, including its country code (for example, +263771234567).');
        }
        const { error } = await supabase.auth.signInWithOtp({
          phone: normalizedPhone,
          options: { shouldCreateUser: false },
        });
        if (error) throw error;
        setPhone(normalizedPhone);
        setStep('code');
      }
    } catch (error) {
      Alert.alert(t.forgot, errorMessage(error, 'Could not start password recovery.'));
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    const token = code.trim();
    if (!token) {
      Alert.alert(t.forgot, 'Enter the verification code from the SMS.');
      return;
    }
    if (!supabase) {
      Alert.alert(t.forgot, 'Password recovery is unavailable because Supabase is not configured.');
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });
      if (error) throw error;
      setStep('password');
    } catch (error) {
      Alert.alert(t.forgot, errorMessage(error, 'Could not verify the code.'));
    } finally {
      setBusy(false);
    }
  };

  const updatePassword = async () => {
    if (password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Try again.');
      return;
    }
    if (!supabase) {
      Alert.alert(t.forgot, 'Password recovery is unavailable because Supabase is not configured.');
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
      if (signOutError) {
        Alert.alert(
          'Password updated',
          'Your password was changed, but this device could not sign you out. Please sign out manually.',
          [{ text: 'OK', onPress: () => router.replace('/login') }],
        );
        return;
      }

      Alert.alert('Password updated', 'Your password has been reset. Sign in to continue.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (error) {
      Alert.alert('Reset failed', errorMessage(error, 'Could not update password.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title={t.forgot} sub="" />
      {step === 'email-sent' ? (
        <View style={f.center}>
          <View style={f.iconBox}><AppIcon name="email-check-outline" size={32} color={C.green} /></View>
          <Text style={[s.h1, { marginTop: 16, fontSize: 22 }]}>Reset email sent</Text>
          <Text style={[s.muted, { textAlign: 'center', marginTop: 8 }]}>Check your email for the password reset link.</Text>
          <Button label="Back to Login" style={{ marginTop: 24, paddingVertical: 15, paddingHorizontal: 10 }} onPress={() => router.replace('/login')} />
        </View>
      ) : step === 'code' ? (
        <>
          <Text style={s.muted}>Enter the verification code sent by SMS to {phone}.</Text>
          <Field label="SMS verification code" placeholder="Enter code" keyboardType="number-pad" autoCapitalize="none" value={code} onChangeText={setCode} />
          <Button label={busy ? 'Verifying…' : 'Verify Code'} disabled={busy} onPress={() => void verifyCode()} />
          <Button outline label={busy ? 'Sending…' : 'Resend Code'} disabled={busy} style={{ marginTop: 12 }} onPress={() => void reset()} />
          <Button outline label="Change Phone Number" disabled={busy} style={{ marginTop: 12 }} onPress={() => setStep('identifier')} />
        </>
      ) : step === 'password' ? (
        <>
          <Text style={s.muted}>Choose a new password for your account.</Text>
          <Field label={t.password} placeholder={t.password} secureTextEntry value={password} onChangeText={setPassword} />
          <Field label="Confirm Password" placeholder="Confirm Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
          <Button label={busy ? 'Updating…' : 'Update Password'} disabled={busy} onPress={() => void updatePassword()} />
        </>
      ) : (
        <>
          <Text style={s.muted}>Enter the email or phone number associated with your account. We will email a reset link or text a verification code.</Text>
          <Field label={t.phoneEmail} placeholder={t.phoneEmail} autoCapitalize="none" value={identifier} onChangeText={setIdentifier} />
          <Button label={busy ? 'Sending…' : 'Continue'} disabled={busy} onPress={() => void reset()} />
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