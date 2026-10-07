import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from './LocalizedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { AppIcon } from './AppIcon';
import { C, SERIF } from '../constants/theme';

export function TopBar({ title }: { title?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[b.bar, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="light" />
      <View style={b.left}>
        <View style={b.logo}><AppIcon name="leaf" size={19} color="#fff" /></View>
        <Text style={b.name}>TARISIRA</Text>
        {title ? <Text style={b.title}>{title}</Text> : null}
      </View>
      <Pressable style={b.gear} onPress={() => router.push('/settings')}><AppIcon name="cog-outline" size={20} color="#fff" /></Pressable>
    </View>
  );
}

const b = StyleSheet.create({
  bar: { backgroundColor: C.dark, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#0B7A50', alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: SERIF, fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  title: { color: '#fff', fontWeight: '800', fontSize: 17, marginLeft: 14 },
  gear: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#1F7A57', alignItems: 'center', justifyContent: 'center' },
});
