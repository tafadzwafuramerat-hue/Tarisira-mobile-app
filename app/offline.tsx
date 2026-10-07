import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../components/ui';
import { AppIcon } from '../components/AppIcon';
import { C, SERIF, money } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function Offline() {
  const { today, txs, debtors, products } = useApp();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.page }}>
      <StatusBar style="light" />
      <View style={o.bar}><Text style={o.barTitle}>Tarisira</Text></View>
      <View style={{ padding: 20, alignItems: 'center', flex: 1 }}>
        <View style={o.icon}><AppIcon name="wifi-off" size={36} color="#fff" /></View>
        <Text style={o.title}>No connection</Text>
        <Text style={o.sub}>Please check your internet connection and try again.</Text>
        <Button label="Retry" onPress={() => {}} style={{ width: '100%' }} />

        <View style={o.divider} />
        <Text style={o.cachedLabel}>Last cached data</Text>
        {[
          ["Today's sales", money(today)],
          ['Transactions', String(txs.length)],
          ['Debtors', String(debtors.length)],
          ['Top product', products[0]?.name || '—'],
        ].map(([label, value]) => (
          <View key={label} style={o.row}>
            <Text style={o.rowLabel}>{label}</Text>
            <Text style={o.rowValue}>{value}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const o = StyleSheet.create({
  bar: { backgroundColor: C.dark, paddingHorizontal: 16, paddingVertical: 14 },
  barTitle: { color: '#fff', fontFamily: SERIF, fontWeight: '800', fontSize: 18 },
  icon: { width: 84, height: 84, borderRadius: 20, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center', marginTop: 50, marginBottom: 20 },
  title: { fontFamily: SERIF, fontSize: 22, fontWeight: '800', color: C.ink, marginBottom: 8 },
  sub: { color: C.muted, textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 },
  divider: { width: '100%', height: 1, backgroundColor: C.line, marginVertical: 24 },
  cachedLabel: { color: C.dark, fontWeight: '800', fontSize: 12, letterSpacing: 1, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  rowLabel: { color: C.muted },
  rowValue: { fontWeight: '800', color: C.ink },
});
