import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Field, Header, Screen, s } from '../components/ui';
import { AppIcon } from '../components/AppIcon';
import { C, SERIF } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { errorMessage } from '../utils/errors';
import { supabase, supabaseConfigured } from '../lib/supabase';

export default function ResetPassword() {
  const { t } = useApp();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const update = async () => {
    if (password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords do not match', 'Try again.');
      return;
    }
    setBusy(true);
    try {
      if (supabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
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
      <Header title="Reset Password" sub="" />
      <Field label={t.password} placeholder={t.password} secureTextEntry value={password} onChangeText={setPassword} />
      <Field label="Confirm Password" placeholder={t.password} secureTextEntry value={confirm} onChangeText={setConfirm} />
      <Button label={busy ? 'Updating…' : 'Update Password'} onPress={update} />
    </Screen>
  );
}