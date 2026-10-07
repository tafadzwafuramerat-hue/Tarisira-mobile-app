import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text as NativeText, TextInput, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { AppIcon } from '../components/AppIcon';
import { C, SERIF, money } from '../constants/theme';
import { useApp } from '../context/AppContext';

type Msg = { id: number; from: 'bot' | 'me'; text: string };

const MENU_EN = '1. Stock\n2. Record Sale\n3. Debtors\n4. Reports\n5. Reminders';
const MENU_SN = '1. Dura rezvinhu\n2. Nyora zvawatengesa\n3. Zvikwereti\n4. Mishumo\n5. Zviyeuchidzo';

function messageLanguage(message: string, fallback: 'en' | 'sn'): 'en' | 'sn' {
  const text = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ' ').trim();
  if (!/[a-z]/.test(text)) return fallback;

  const shonaFrame = /\b(ndinoda|ndiratidze|ndapota|ndibatsire|ndibatsirei|ndinyorere|munogona|ungandiratidza|ndibhadharire)\b/.test(text);
  const shona = /\b(ndinoda|ndiratidze|ndapota|nhasi|mangwana|chii|mari|ndatengesa|nditengese|tengesa|kutengesa|zvatengesa|dura|zvinhu|zvigadzirwa|ndibatsire|ndibatsirei|ndinyorere|bhadhara|wedzera|bvisa|yangu|yapera)\b|tenges|kweret|mushum|mishum|yeuchidz|chikweret/.test(text);
  const english = /\b(please|show|tell|what|how|today|tomorrow|sales?|sold|sell|debts?|debtors?|stock|inventory|products?|reports?|reminders?|help|owe|owed|payment|payments)\b/.test(text);

  if (shonaFrame) return 'sn';
  if (shona && !english) return 'sn';
  if (english && !shona) return 'en';
  if (shona && english) {
    const shonaMatches = text.match(/ndinoda|ndiratidze|ndapota|nhasi|mangwana|chii|mari|ndatengesa|nditengese|tenges|kweret|mushum|yeuchidz|dura|zvinhu|zvigadzirwa|ndibatsire|bhadhara|wedzera|bvisa|yangu|yapera/gi)?.length ?? 0;
    const englishMatches = text.match(/please|show|tell|what|how|today|tomorrow|sales?|sold|sell|debts?|debtors?|stock|inventory|products?|reports?|reminders?|help|owe|owed|payment|payments/gi)?.length ?? 0;
    return shonaMatches > englishMatches ? 'sn' : 'en';
  }

  return fallback;
}

export default function WhatsApp() {
  const { lang, today, txs, debtors, debtTotal, products, lowCount } = useApp();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const conversationLanguage = useRef<'en' | 'sn'>(lang);
  const menu = lang === 'sn' ? MENU_SN : MENU_EN;
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 1,
      from: 'bot',
      text: lang === 'sn'
        ? `Titambire zvakare!\n\nMunoda kuita chii?\n\n${menu}`
        : `Welcome back, Boss!\n\nWhat would you like to do?\n\n${menu}`,
    },
  ]);

  useEffect(() => {
    setMsgs((current) => {
      if (current.length !== 1 || current[0].from !== 'bot') return current;
      conversationLanguage.current = lang;
      return [{ ...current[0], text: lang === 'sn'
        ? `Titambire zvakare!\n\nMunoda kuita chii?\n\n${menu}`
        : `Welcome back, Boss!\n\nWhat would you like to do?\n\n${menu}` }];
    });
  }, [lang, menu]);

  const reply = (q: string, replyLang: 'en' | 'sn'): string => {
    const t = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const inShona = replyLang === 'sn';
    const replyMenu = inShona ? MENU_SN : MENU_EN;

    if (/\b(sold|sale|sales|sell)\b|tenges/.test(t) || t === '2') {
      const best = products[0]?.name || 'N/A';
      return inShona
        ? `Zvatengesa nhasi: ${money(today)}\nKutengeserana ${txs.length} kwanyorwa.\n\nChigadzirwa chatengesa zvakanyanya: ${best}`
        : `Today's sales: ${money(today)}\n${txs.length} transactions recorded.\n\nBest seller: ${best}`;
    }
    if (/\b(debt|debts|debtor|debtors)\b|chikweret|kweret/.test(t) || t === '3') {
      const lines = debtors.map((d) => `• ${d.name} — $${d.amount}`).join('\n');
      return inShona
        ? `Vane zvikwereti vasati vabhadhara:\n\n${lines || 'Hapana'}\n\nChikwereti chose: ${money(debtTotal)}\n\nNyora BHADHARA [zita] [mari] kunyora mubhadharo.`
        : `Outstanding debtors:\n\n${lines || 'None'}\n\nTotal: ${money(debtTotal)}\n\nType PAY [name] [amount] to record payment.`;
    }
    if (/\b(stock|inventory)\b|dura|zvinhu|zvigadzirwa/.test(t) || t === '1') {
      return inShona
        ? `Une zvigadzirwa ${products.length}.\nZvigadzirwa ${lowCount} zvava kupera mudura.`
        : `You have ${products.length} products.\n${lowCount} running low on stock.`;
    }
    if (/\b(report|reports)\b|mushum|mishum/.test(t) || t === '4') {
      return inShona
        ? `Mwedzi uno: ${money(2325 + today)} yatengeswa; ${money(debtTotal)} haisati yabhadharwa.`
        : `This month: ${money(2325 + today)} in sales, ${money(debtTotal)} outstanding.`;
    }
    if (/\b(reminder|reminders)\b|yeuchidz|chiyeuchid/.test(t) || t === '5') {
      return inShona
        ? 'Vhura peji reZviyeuchidzo muapp kuti uronge chiyeuchidzo, kana nyora: YEUCHIDZA [zita].'
        : 'Open the Reminders screen in the app to schedule one, or type: REMIND [name].';
    }
    return inShona
      ? `Tine urombo, handina kunzwisisa. Ndinogona kukubatsira nezvinotevera:\n\n${replyMenu}`
      : `Sorry, I didn't catch that. Here's what I can help with:\n\n${replyMenu}`;
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const detectedLanguage = messageLanguage(text, conversationLanguage.current);
    conversationLanguage.current = detectedLanguage;
    const userMsg: Msg = { id: Date.now(), from: 'me', text };
    const botMsg: Msg = { id: Date.now() + 1, from: 'bot', text: reply(text, detectedLanguage) };
    setMsgs((l) => [...l, userMsg, botMsg]);
    setInput('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#E9DFD3' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <View style={[w.bar, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}><Text style={w.back}>‹</Text></Pressable>
        <View style={w.avatar}><AppIcon name="leaf" size={20} color={C.dark} /></View>
        <View>
          <Text style={w.title}>Tarisira</Text>
          <Text style={w.subtitle}>Business Assistant · Online</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        {msgs.map((m) => (
          <View key={m.id} style={[w.bubble, m.from === 'me' ? w.bubbleMe : w.bubbleBot]}>
            <NativeText style={[w.bubbleText, m.from === 'me' && { color: '#fff' }]}>{m.text}</NativeText>
          </View>
        ))}
      </ScrollView>
      <View style={[w.inputRow, { paddingBottom: insets.bottom + 10 }]}>
        <TextInput style={w.input} placeholder={lang === 'sn' ? 'Nyora meseji' : 'Type a message'} placeholderTextColor="#9AA79F" value={input} onChangeText={setInput} onSubmitEditing={send} />
        <Pressable style={w.send} onPress={send}><AppIcon name="send" size={19} color="#fff" /></Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const w = StyleSheet.create({
  bar: { backgroundColor: C.dark, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 12 },
  back: { color: '#fff', fontSize: 26, marginRight: 4 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontFamily: SERIF, fontWeight: '800', fontSize: 16 },
  subtitle: { color: '#BFE3D1', fontSize: 11 },
  bubble: { maxWidth: '82%', borderRadius: 14, padding: 12, marginBottom: 10 },
  bubbleBot: { backgroundColor: '#fff', alignSelf: 'flex-start', borderTopLeftRadius: 2 },
  bubbleMe: { backgroundColor: C.green, alignSelf: 'flex-end', borderTopRightRadius: 2 },
  bubbleText: { color: C.ink, fontSize: 14, lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 10, backgroundColor: '#E9DFD3' },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
});
