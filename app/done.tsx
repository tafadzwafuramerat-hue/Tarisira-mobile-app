import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Screen, s } from '../components/ui';
import { AppIcon } from '../components/AppIcon';
import { C, SERIF } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function Done() {
  const { t } = useApp();
  return (
    <Screen>
      <View style={{ alignItems: 'center', paddingTop: 32 }}>
        <View style={d.circle}><AppIcon name="check" size={36} color={C.dark} /></View>
        <Text style={[s.h1, { marginTop: 24 }]}>{t.done}</Text>
        <Text style={[s.sub, { textAlign: 'center' }]}>{t.trial}</Text>
        <View style={d.card}>
          <Text style={d.label}>{t.plan}</Text>
          <Text style={d.big}>{t.free}</Text>
          <View style={d.divider} />
          <Text style={s.optDesc}>{t.after}</Text>
          <Text style={d.price}>{t.price}</Text>
          <Text style={s.optDesc}>{t.cancel}</Text>
        </View>
        <View style={{ width: '100%' }}><Button label={t.dash} onPress={() => router.replace('/home')} /></View>
      </View>
    </Screen>
  );
}

const d = StyleSheet.create({
  circle: { width: 76, height: 76, borderRadius: 38, borderWidth: 2.5, borderColor: C.green, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', backgroundColor: C.mint, borderWidth: 1.5, borderColor: C.green, borderRadius: 7, padding: 22, alignItems: 'center', marginBottom: 18 },
  label: { color: C.green, fontWeight: '800', fontSize: 12, letterSpacing: 1.5 },
  big: { fontFamily: SERIF, fontSize: 32, fontWeight: '800', color: C.dark, marginVertical: 12 },
  divider: { width: '100%', height: 1, backgroundColor: C.line, marginBottom: 14 },
  price: { fontFamily: SERIF, fontSize: 30, fontWeight: '800', color: C.orange, marginVertical: 6 },
});
