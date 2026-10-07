import React, { useState } from 'react';
import { View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Header, Option, Screen, s } from '../components/ui';
import { Lang } from '../constants/strings';
import { useApp } from '../context/AppContext';

const ITEMS: [Lang, string, string, string][] = [
  ['en', '🇬🇧', 'English', 'Continue in English'],
  ['sn', '🇿🇼', 'Shona', 'Endarera muChiShona'],
];

export default function LanguageSettings() {
  const { lang, setLang } = useApp();
  const [choice, setChoice] = useState<Lang>(lang);

  return (
    <Screen>
      <Header title="Language" sub="" />
      <Text style={[s.sub, { marginTop: -16 }]}>Choose your language. This affects both the app and the WhatsApp bot.</Text>
      {ITEMS.map(([code, flag, name, desc]) => (
        <Option key={code} selected={choice === code} onPress={() => setChoice(code)}>
          <Text style={{ fontSize: 34, marginRight: 16 }}>{flag}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.optTitle}>{name}</Text>
            <Text style={s.optDesc}>{desc}</Text>
          </View>
        </Option>
      ))}
      <Button label="Save" onPress={() => { setLang(choice); router.back(); }} />
    </Screen>
  );
}
