import React from 'react';
import { Pressable, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Option, Screen, s } from '../components/ui';
import { Lang } from '../constants/strings';
import { useApp } from '../context/AppContext';

const ITEMS: [Lang, string, string, string][] = [
  ['en', '🇬🇧', 'English', 'Continue in English'],
  ['sn', '🇿🇼', 'Shona', 'Endarera muChiShona'],
];

export default function Language() {
  const { lang, setLang, t } = useApp();
  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={10}><Text style={[s.back, { marginBottom: 32 }]}>‹ {t.back}</Text></Pressable>
      <Text style={s.h1}>Choose language</Text>
      <Text style={s.sub}>Select your preferred language</Text>
      {ITEMS.map(([code, flag, name, desc]) => (
        <Option key={code} selected={lang === code} onPress={() => setLang(code)}>
          <Text style={{ fontSize: 37, marginRight: 16 }}>{flag}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.optTitle}>{name}</Text>
            <Text style={s.optDesc}>{desc}</Text>
          </View>
        </Option>
      ))}
      <Button label={t.cont} onPress={() => router.push('/signup')} />
    </Screen>
  );
}
