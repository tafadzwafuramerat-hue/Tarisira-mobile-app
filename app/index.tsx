import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { AppIcon } from '../components/AppIcon';
import { C, SERIF } from '../constants/theme';

const SPLASH_ORANGE = '#E8A04C';

const CHIPS: { icon: React.ComponentProps<typeof AppIcon>['name']; label: string }[] = [
  { icon: 'package-variant-closed', label: 'Stock' },
  { icon: 'cash-multiple', label: 'Sales' },
  { icon: 'account-group-outline', label: 'Debtors' },
  { icon: 'chart-box-outline', label: 'Reports' },
];

export default function Splash() {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 900, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <View style={{ flex: 1, backgroundColor: '#005F3C' }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View style={[p.top, { opacity: fade }]}>
          {[300, 210, 130].map((d) => (
            <View key={d} style={[p.ring, { width: d * 2, height: d * 2, borderRadius: d }]} />
          ))}
          <View style={p.logo}><AppIcon name="leaf" size={56} color="#fff" /></View>
          <Text style={p.name}>TARISIRA</Text>
          <View style={p.underline} />
          <Text style={p.tag}>SELL MORE. OWE LESS. GROW.</Text>
          <View style={p.chips}>
            {CHIPS.map((c) => <View key={c.label} style={p.chip}><AppIcon name={c.icon} size={16} color="#CBE9DA" /><Text style={p.chipText}>{c.label}</Text></View>)}
          </View>
        </Animated.View>

        <View style={p.bottom}>
          <Pressable style={p.cta} onPress={() => router.push('/language')}>
            <Text style={p.ctaText}>Get Started — It's Free  →</Text>
          </Pressable>
          <Pressable style={p.ghost} onPress={() => router.push('/login')}>
            <Text style={p.ghostText}>I already have an account</Text>
          </Pressable>
          <Text style={p.made}>MADE FOR ZIMBABWE</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const p = StyleSheet.create({
  top: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 20 },
  ring: { position: 'absolute', top: '50%', marginTop: -190, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  logo: { width: 96, height: 96, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  name: { fontFamily: SERIF, fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: 6 },
  underline: { width: 52, height: 3, borderRadius: 2, backgroundColor: SPLASH_ORANGE, marginTop: 14, marginBottom: 16 },
  tag: { color: '#9CCFB6', fontSize: 13, letterSpacing: 3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 22, paddingHorizontal: 40 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  chipText: { color: '#CBE9DA', fontSize: 13 },
  bottom: { paddingHorizontal: 20, paddingBottom: 16 },
  cta: { backgroundColor: SPLASH_ORANGE, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  ctaText: { color: '#1B1B12', fontWeight: '800', fontSize: 16 },
  ghost: { marginTop: 12, borderRadius: 16, paddingVertical: 17, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  ghostText: { color: '#DDF1E6', fontWeight: '700', fontSize: 16 },
  made: { textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 11, letterSpacing: 2, marginTop: 22 },
});
