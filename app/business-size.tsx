import React from 'react';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Header, Option, Screen, s } from '../components/ui';
import { C } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function BusinessSize() {
  const { t, form, setForm } = useApp();
  const opts: [string, string][] = [['1', t.justMe], ['2-5', t.p25], ['6-10', t.p610], ['10+', t.p10]];
  return (
    <Screen>
      <Header step={3} title={t.sizeTitle} sub={t.sizeSub} />
      {opts.map(([k, label]) => (
        <Option key={k} selected={form.size === k} onPress={() => setForm({ size: k })}>
          <Text style={[s.optTitle, { flex: 1 }, form.size === k && { color: C.dark }]}>{label}</Text>
        </Option>
      ))}
      <Button label={t.cont} onPress={() => router.push('/currency')} />
    </Screen>
  );
}
