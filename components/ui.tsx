import React, { ReactNode } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { AppIcon } from './AppIcon';
import { LocalizedText as Text } from './LocalizedText';
import { shonaText } from '../constants/shona';
import { C, SERIF } from '../constants/theme';
import { useApp } from '../context/AppContext';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: 20, paddingTop: 16 }}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Button({ label, onPress, disabled, outline, style }: {
  label: string; onPress: () => void; disabled?: boolean; outline?: boolean; style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={[s.btn, outline && s.btnOutline, disabled && { backgroundColor: C.disabled }, style]}>
      <Text style={[s.btnText, outline && { color: C.dark }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: { label: string } & TextInputProps) {
  const { lang } = useApp();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor="#8FA79B" style={s.input} {...props} placeholder={lang === 'sn' && props.placeholder ? shonaText(props.placeholder) : props.placeholder} />
    </View>
  );
}

export function Header({ title, sub, step }: { title: string; sub: string; step?: number }) {
  const { t } = useApp();
  return (
    <View>
      <Pressable onPress={() => router.back()} hitSlop={10}><Text style={s.back}>‹ {t.back}</Text></Pressable>
      {step != null && (
        <View style={s.progress}>
          {[1, 2, 3, 4, 5, 6].map((i) => <View key={i} style={[s.seg, i <= step && { backgroundColor: C.green }]} />)}
        </View>
      )}
      <Text style={s.h1}>{title}</Text>
      <Text style={s.sub}>{sub}</Text>
    </View>
  );
}

export function Option({ selected, onPress, children, multi }: {
  selected: boolean; onPress: () => void; children: ReactNode; multi?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[s.option, selected && s.optionOn]}>
      {children}
      <View style={[multi ? s.check : s.radio, selected && { backgroundColor: C.green, borderColor: C.green }]}>
        {selected && <AppIcon name="check" size={14} color="#fff" />}
      </View>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Badge({ text, bad }: { text: string; bad?: boolean }) {
  return (
    <View style={[s.badge, bad && { backgroundColor: C.pink }]}>
      <Text style={[s.badgeText, bad && { color: C.red }]}>{text}</Text>
    </View>
  );
}

export function Search({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  const { lang } = useApp();
  return (
    <View style={s.search}>
      <AppIcon name="magnify" size={18} color={C.muted} />
      <TextInput style={s.searchInput} value={value} onChangeText={onChangeText} placeholder={lang === 'sn' ? shonaText(placeholder) : placeholder} placeholderTextColor="#8FA79B" />
    </View>
  );
}

export const s = StyleSheet.create({
  h1: { fontFamily: SERIF, fontSize: 28, fontWeight: '800', color: C.ink },
  sub: { color: C.muted, fontSize: 15, marginTop: 6, marginBottom: 24 },
  muted: { color: C.muted, fontSize: 13 },
  back: { color: C.muted, fontSize: 15, marginBottom: 8 },
  label: { color: C.dark, fontWeight: '700', fontSize: 13, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16, color: C.ink },
  btn: { backgroundColor: C.dark, borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginTop: 8 },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.dark },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  progress: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  seg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: C.line },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 7, padding: 18, marginBottom: 12 },
  optionOn: { backgroundColor: C.mint, borderColor: C.green },
  optTitle: { fontSize: 17, fontWeight: '700', color: C.ink },
  optDesc: { fontSize: 13, color: C.muted, marginTop: 2 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  check: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 7, padding: 18, marginBottom: 12 },
  badge: { backgroundColor: C.mint, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { color: C.dark, fontWeight: '800', fontSize: 12 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 16, paddingHorizontal: 14 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: C.ink },
});
