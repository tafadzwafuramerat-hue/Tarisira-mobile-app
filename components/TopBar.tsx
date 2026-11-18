import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from './LocalizedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { AppIcon } from './AppIcon';
import { BrandSymbol } from './BrandSymbol';
import { C } from '../constants/theme';

export function TopBar({ title }: { title?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[b.bar, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="light" />
      <View style={b.left}>
        {title ? (
          <BrandSymbol size={32} reversed />
        ) : (
          <Image source={require('../assets/tarisira-logo-reversed.png')} style={b.wordmark} resizeMode="contain" />
        )}
        {title ? <Text style={b.title}>{title}</Text> : null}
      </View>
      <Pressable style={b.gear} onPress={() => router.push('/settings')}><AppIcon name="cog-outline" size={20} color="#fff" /></Pressable>
    </View>
  );
}

const b = StyleSheet.create({
  bar: { backgroundColor: C.dark, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  wordmark: { width: 112, height: 32 },
  title: { color: '#fff', fontWeight: '800', fontSize: 17, marginLeft: 4, flexShrink: 1 },
  gear: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#1F7A57', alignItems: 'center', justifyContent: 'center' },
});
