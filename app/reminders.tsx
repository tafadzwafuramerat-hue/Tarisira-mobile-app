import React from 'react';
import { View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Card, Header, Screen, s } from '../components/ui';
import { C } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function Reminders() {
  const { reminders } = useApp();
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
        </Card>
      ))}
    </Screen>
  );
}
