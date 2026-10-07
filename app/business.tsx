import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Field, Header, Screen, s } from '../components/ui';
import { C } from '../constants/theme';
import { useApp } from '../context/AppContext';

const TYPES = ['Tuckshop', 'Clothing store', 'Salon', 'Restaurant', 'Hardware', 'Other'];

export default function Business() {
  const { t, form, setForm } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <Screen>
      <Header step={2} title={t.bizTitle} sub={t.bizSub} />
      <Field label={t.bizName} placeholder="e.g. Tafadzwa's Tuckshop" value={form.bizName} onChangeText={(v) => setForm({ bizName: v })} />
      <Text style={s.label}>{t.bizType}</Text>
      <Pressable style={[s.input, b.select]} onPress={() => setOpen(!open)}>
        <Text style={{ fontSize: 16, color: C.ink }}>{form.bizType}</Text><Text style={{ color: C.muted }}>▾</Text>
      </Pressable>
      {open && (
        <View style={b.dropdown}>
          {TYPES.map((x) => (
            <Pressable key={x} style={b.item} onPress={() => { setForm({ bizType: x }); setOpen(false); }}>
              <Text style={{ fontSize: 16, color: C.ink }}>{x}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={{ height: 16 }} />
      <Field label={t.location} placeholder="e.g. Mufakose, Harare" value={form.location} onChangeText={(v) => setForm({ location: v })} />
      <Field label={t.phone} placeholder="+263 77 123 4567" keyboardType="phone-pad" value={form.bizPhone} onChangeText={(v) => setForm({ bizPhone: v })} />
      <Button label={t.cont} disabled={!form.bizName || !form.location} onPress={() => router.push('/business-size')} />
    </Screen>
  );
}

const b = StyleSheet.create({
  select: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdown: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 16, marginTop: 6 },
  item: { padding: 14, borderBottomWidth: 1, borderBottomColor: C.line },
});
