import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { router } from 'expo-router';
import { Button, Field, Header, Screen, s } from '../components/ui';
import { AppIcon } from '../components/AppIcon';
import { C } from '../constants/theme';
import { useApp } from '../context/AppContext';

const TYPES = ['Tuckshop', 'Clothing store', 'Salon', 'Restaurant', 'Hardware', 'Other'];

export default function BusinessProfile() {
  const { form, setForm } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <Screen>
      <Header title="Business Profile" sub="" />
      <View style={p.avatarWrap}>
        <View style={p.avatar}><AppIcon name="leaf" size={36} color="#fff" /></View>
        <View style={p.editBadge}><AppIcon name="pencil" size={13} color={C.dark} /></View>
      </View>

      <Field label="Business Name" value={form.bizName} onChangeText={(v) => setForm({ bizName: v })} />

      <Text style={s.label}>Business Type</Text>
      <Pressable style={[s.input, p.select]} onPress={() => setOpen(!open)}>
        <Text style={{ fontSize: 16, color: C.ink }}>{form.bizType}</Text><Text style={{ color: C.muted }}>▾</Text>
      </Pressable>
      {open && (
        <View style={p.dropdown}>
          {TYPES.map((x) => (
            <Pressable key={x} style={p.item} onPress={() => { setForm({ bizType: x }); setOpen(false); }}>
              <Text style={{ fontSize: 16, color: C.ink }}>{x}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={{ height: 16 }} />

      <Field label="Location" value={form.location} onChangeText={(v) => setForm({ location: v })} />
      <Field label="Phone Number" keyboardType="phone-pad" value={form.bizPhone} onChangeText={(v) => setForm({ bizPhone: v })} />

      <Text style={s.label}>Currency</Text>
      <View style={[s.input, p.readonly]}>
        <Text style={{ fontSize: 16, color: C.ink }}>{form.currencies[0]} — {form.currencies[0] === 'USD' ? 'US Dollar' : form.currencies[0]}</Text>
      </View>
      <View style={{ height: 20 }} />

      <Button label="Save Changes" onPress={() => router.back()} />
    </Screen>
  );
}

const p = StyleSheet.create({
  avatarWrap: { alignSelf: 'center', marginBottom: 24 },
  avatar: { width: 84, height: 84, borderRadius: 22, backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center' },
  editBadge: { position: 'absolute', right: -4, bottom: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg },
  select: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdown: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 16, marginTop: 6 },
  item: { padding: 14, borderBottomWidth: 1, borderBottomColor: C.line },
  readonly: { justifyContent: 'center', backgroundColor: '#F4F8F6' },
});
