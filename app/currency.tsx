import React from 'react';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Header, Option, Screen, s } from '../components/ui';
import { C } from '../constants/theme';
import { useApp } from '../context/AppContext';

const CURRENCIES: [string, string, string][] = [
  ['USD', 'US Dollar', '🇺🇸'], ['ZWL', 'Zimbabwe Dollar', '🇿🇼'], ['ZAR', 'South African Rand', '🇿🇦'],
  ['TZS', 'Tanzanian Shilling', '🇹🇿'], ['GBP', 'British Pound', '🇬🇧'], ['EUR', 'Euro', '🇪🇺'],
];

export default function Currency() {
  const { t, form, setForm } = useApp();
  const toggle = (code: string) => {
    const has = form.currencies.includes(code);
    if (has && form.currencies.length === 1) return; // keep at least one
    setForm({ currencies: has ? form.currencies.filter((x) => x !== code) : [...form.currencies, code] });
  };
  return (
    <Screen>
      <Header step={4} title={t.curTitle} sub={t.curSub} />
      <Text style={{ color: C.green, fontWeight: '700', fontSize: 13, marginTop: -16, marginBottom: 16 }}>{t.multi}</Text>
      {CURRENCIES.map(([code, name, flag]) => (
        <Option multi key={code} selected={form.currencies.includes(code)} onPress={() => toggle(code)}>
          <Text style={{ fontSize: 28, marginRight: 14 }}>{flag}</Text>
          <Text style={[s.optTitle, { marginRight: 8 }]}>{code}</Text>
          <Text style={[s.optDesc, { flex: 1 }]}>{name}</Text>
        </Option>
      ))}
      <Button label={t.finish} onPress={() => router.push('/done')} />
    </Screen>
  );
}
