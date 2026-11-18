import React, { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text as NativeText, TextInput, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { AppIcon } from '../components/AppIcon';
import { BrandSymbol } from '../components/BrandSymbol';
import { C, SERIF, money } from '../constants/theme';
import { Product, useApp } from '../context/AppContext';

type Msg = { id: number; from: 'bot' | 'me'; text: string };
type PendingAction =
  | { type: 'stock'; product: Product; quantity: number }
  | { type: 'debt'; name: string; amount: number }
  | { type: 'payment'; debtorId: string | number; name: string; amount: number };

const MENU_EN = '1. Stock\n2. Record Sale\n3. Debtors\n4. Reports\n5. Reminders';
const MENU_SN = '1. Dura rezvinhu\n2. Nyora zvawatengesa\n3. Zvikwereti\n4. Mishumo\n5. Zviyeuchidzo';

function messageLanguage(message: string, fallback: 'en' | 'sn'): 'en' | 'sn' {
  const text = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ' ').trim();
  if (!/[a-z]/.test(text)) return fallback;

  const shonaFrame = /\b(ndinoda|ndiratidze|ndapota|ndibatsire|ndibatsirei|ndinyorere|munogona|ungandiratidza|ndibhadharire)\b/.test(text);
  const shona = /\b(ndinoda|ndiratidze|ndapota|nhasi|mangwana|chii|mari|ndatengesa|nditengese|tengesa|kutengesa|zvatengesa|dura|zvinhu|zvigadzirwa|ndibatsire|ndibatsirei|ndinyorere|bhadhara|wedzera|bvisa|yangu|yapera|mhoro|mhoroi|masikati|mangwanani)\b|tenges|kweret|mushum|mishum|yeuchidz|chikweret/.test(text);
  const english = /\b(hi|hello|hey|good|please|show|tell|what|how|today|tomorrow|sales?|sold|sell|debts?|debtors?|stock|inventory|products?|reports?|reminders?|help|owe|owed|payment|payments|add|put|restock|increase|pay)\b/.test(text);

  if (shonaFrame) return 'sn';
  if (shona && !english) return 'sn';
  if (english && !shona) return 'en';
  if (shona && english) {
    const shonaMatches = text.match(/ndinoda|ndiratidze|ndapota|nhasi|mangwana|chii|mari|ndatengesa|nditengese|tenges|kweret|mushum|yeuchidz|dura|zvinhu|zvigadzirwa|ndibatsire|bhadhara|wedzera|bvisa|yangu|yapera|mhoro|mhoroi|masikati|mangwanani/gi)?.length ?? 0;
    const englishMatches = text.match(/\b(?:hi|hello|hey|good|please|show|tell|what|how|today|tomorrow|sales?|sold|sell|debts?|debtors?|stock|inventory|products?|reports?|reminders?|help|owe|owed|payment|payments|add|put|restock|increase|pay)\b/gi)?.length ?? 0;
    return shonaMatches > englishMatches ? 'sn' : 'en';
  }

  return fallback;
}

function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w.$\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeName(text: string): string {
  return normalizeText(text).replace(/[^a-z0-9]/g, '');
}

export default function WhatsApp() {
  const { form, lang, today, txs, debtors, debtTotal, products, lowCount, adjustStock, addDebtor, recordPayment } = useApp();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const conversationLanguage = useRef<'en' | 'sn'>(lang);
  const menu = lang === 'sn' ? MENU_SN : MENU_EN;
  const firstName = form.name.trim().split(/\s+/)[0];
  const welcome = lang === 'sn'
    ? `Titambire zvakare${firstName ? `, ${firstName}` : ''}!`
    : `Welcome back${firstName ? `, ${firstName}` : ''}!`;
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 1,
      from: 'bot',
      text: lang === 'sn'
        ? `${welcome}\n\nMunoda kuita chii?\n\n${menu}`
        : `${welcome}\n\nWhat would you like to do?\n\n${menu}`,
    },
  ]);

  useEffect(() => {
    setMsgs((current) => {
      if (current.length !== 1 || current[0].from !== 'bot') return current;
      conversationLanguage.current = lang;
      return [{ ...current[0], text: lang === 'sn'
        ? `${welcome}\n\nMunoda kuita chii?\n\n${menu}`
        : `${welcome}\n\nWhat would you like to do?\n\n${menu}` }];
    });
  }, [lang, menu, welcome]);

  const reply = (q: string, replyLang: 'en' | 'sn'): string => {
    const t = normalizeText(q);
    const inShona = replyLang === 'sn';
    const replyMenu = inShona ? MENU_SN : MENU_EN;

    if (/^(hi|hello|hey|good morning|good afternoon|good evening|mhoro|mhoroi|masikati|mangwanani)$/.test(t)) {
      return inShona
        ? `Mhoro! Ndingakubatsirei nhasi?\n\n${replyMenu}\n\nNyora “dura” kuona stock, kana “zvikwereti” kuona vane zvikwereti.`
        : `Hello! How can I help with your business today?\n\n${replyMenu}\n\nAsk “show stock” or “show debtors,” or type “help” for examples.`;
    }
    if (/^(help|menu|start|0|help me|ndibatsire|ndibatsirei)$/.test(t)) {
      return inShona
        ? `Ndinogona kukuratidza stock, zvawatengesa, zvikwereti, mishumo, nezviyeuchidzo.\n\nKuwedzera stock: “wedzera [zita rechigadzirwa] [nhamba]”\nKunyora chikwereti: “chikwereti [zita] [mari]”\n\n${replyMenu}`
        : `I can show stock, sales, debtors, reports, and reminders. You can also:\n• Add stock: “add [product] [quantity]”\n• Add a debt: “add debt [name] [$amount]”\n• Record a payment: “pay [name] [$amount]”\n\n${replyMenu}`;
    }
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
      const stockList = products.map((product) => `• ${product.name}: ${product.qty}`).join('\n');
      return inShona
        ? `Une zvigadzirwa ${products.length}; ${lowCount} zvava kupera mudura.\n\n${stockList || 'Hapana zvigadzirwa zvanyorwa.'}`
        : `You have ${products.length} products; ${lowCount} are running low.\n\n${stockList || 'No products have been added yet.'}`;
    }
    if (/\b(report|reports)\b|mushum|mishum/.test(t) || t === '4') {
      return inShona
        ? `Mwedzi uno: ${money(today)} yatengeswa; ${money(debtTotal)} haisati yabhadharwa.`
        : `This month: ${money(today)} in sales, ${money(debtTotal)} outstanding.`;
    }
    if (/\b(reminder|reminders)\b|yeuchidz|chiyeuchid/.test(t) || t === '5') {
      return inShona
        ? 'Vhura peji reZviyeuchidzo muapp kuti uronge chiyeuchidzo, kana nyora: YEUCHIDZA [zita].'
        : 'Open the Reminders screen in the app to schedule one, or type: REMIND [name].';
    }
    return inShona
      ? `Ndinogona kubatsira nezve stock, zvawatengesa, zvikwereti, mishumo, uye zviyeuchidzo. Nyora “ndibatsire” kuti uone mienzaniso.\n\n${replyMenu}`
      : `I can help with stock, sales, debts, reports, and reminders. Type “help” to see examples.\n\n${replyMenu}`;
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const detectedLanguage = messageLanguage(text, conversationLanguage.current);
    conversationLanguage.current = detectedLanguage;
    const inShona = detectedLanguage === 'sn';
    setMsgs((list) => [...list, { id: Date.now(), from: 'me', text }]);
    setInput('');

    const t = normalizeText(text);
    const affirmative = /^(yes|y|yeah|yep|confirm|ok|okay|uhu|hongu|ehe)$/.test(t);
    const negative = /^(no|n|nope|cancel|cancel it|stop|kwete|ramba)$/.test(t);
    if (pendingAction) {
      if (negative) {
        setPendingAction(null);
        setMsgs((list) => [...list, { id: Date.now() + 1, from: 'bot', text: inShona ? 'Zvaita, hapana chachinjwa.' : 'Cancelled. Nothing was changed.' }]);
        return;
      }
      if (!affirmative) {
        setMsgs((list) => [...list, { id: Date.now() + 1, from: 'bot', text: inShona ? 'Pindura “hongu” kuti usimbise kana “kwete” kukanzura.' : 'Reply “yes” to confirm or “no” to cancel this action.' }]);
        return;
      }

      const action = pendingAction;
      setPendingAction(null);
      try {
        if (action.type === 'stock') {
          await adjustStock(action.product.id, action.quantity, 'Stock added via assistant');
          setMsgs((list) => [...list, { id: Date.now() + 1, from: 'bot', text: inShona ? `Zvaita — stock ye${action.product.name} yawedzerwa ne${action.quantity}.` : `Done — added ${action.quantity} to ${action.product.name}.` }]);
        } else if (action.type === 'debt') {
          await addDebtor({ name: action.name, amount: action.amount, days: 30 });
          setMsgs((list) => [...list, { id: Date.now() + 1, from: 'bot', text: inShona ? `Chikwereti cha${action.name} chanyorwa: ${money(action.amount)}.` : `Debt recorded for ${action.name}: ${money(action.amount)}.` }]);
        } else {
          await recordPayment(action.debtorId, action.amount);
          setMsgs((list) => [...list, { id: Date.now() + 1, from: 'bot', text: inShona ? `Mubhadharo wa${action.name} wanyorwa: ${money(action.amount)}.` : `Payment recorded for ${action.name}: ${money(action.amount)}.` }]);
        }
      } catch (error) {
        console.error('Assistant action failed:', error);
        const details = error instanceof Error ? ` ${error.message}` : '';
        setMsgs((list) => [...list, { id: Date.now() + 1, from: 'bot', text: inShona ? `Handina kukwanisa kuita izvozvo.${details}` : `I couldn't complete that action.${details}` }]);
      }
      return;
    }

    const owesIntent = !/^(?:who|what|how)\b/.test(t) && /^.+\s+owes?(?:\s+me)?\s+\$?\d/.test(t);
    const debtIntent = /\b(?:add|record|create)\s+(?:a\s+)?(?:debt|debtor|chikwereti)\b/.test(t)
      || /^(?:debt|debtor|chikwereti)\s+.+\s+\$?\d/.test(t)
      || owesIntent;
    const paymentIntent = /\b(?:pay|record payment|bhadhara)\b/.test(t);
    const stockIntent = /^(?:please\s+)?(?:add|put|restock|increase|stock up|wedzera)\b/.test(t);
    let action: PendingAction | null = null;
    let actionError = '';

    if (debtIntent) {
      const match = t.match(/^(?:please\s+)?(?:add|record|create)\s+(?:a\s+)?(?:debt|debtor|chikwereti)\s+(?:for\s+)?(.+?)(?:\s+of)?\s+\$?(\d+(?:\.\d{1,2})?)$/)
        || t.match(/^(?:debt|debtor|chikwereti)\s+(?:for\s+)?(.+?)(?:\s+of)?\s+\$?(\d+(?:\.\d{1,2})?)$/)
        || t.match(/^(.+?)\s+owes?(?:\s+me)?\s+\$?(\d+(?:\.\d{1,2})?)$/);
      const name = match?.[1]?.replace(/\s+(?:of|for)$/, '').trim() ?? '';
      const amount = Number(match?.[2]);
      if (!name || !Number.isFinite(amount) || amount <= 0) {
        actionError = inShona ? 'Nyora: chikwereti [zita] [mari], semuenzaniso “chikwereti Tawanda 20”.' : 'Use: add debt [name] [$amount], for example “add debt Tawanda $20”.';
      } else {
        action = { type: 'debt', name, amount };
      }
    } else if (paymentIntent) {
      const match = t.match(/^(?:(?:please\s+)?record\s+payment|pay|bhadhara)\s+(?:for\s+)?(.+?)\s+\$?(\d+(?:\.\d{1,2})?)$/);
      const name = match?.[1]?.trim() ?? '';
      const amount = Number(match?.[2]);
      const debtor = debtors.find((item) => normalizeName(item.name) === normalizeName(name));
      if (!name || !Number.isFinite(amount) || amount <= 0) {
        actionError = inShona ? 'Nyora: bhadhara [zita] [mari].' : 'Use: pay [name] [$amount], for example “pay Tawanda $10”.';
      } else if (!debtor) {
        actionError = inShona ? `Handina kuwana chikwereti cha${name}.` : `I couldn't find an outstanding debt for ${name}.`;
      } else {
        action = { type: 'payment', debtorId: debtor.id, name: debtor.name, amount };
      }
    } else if (stockIntent) {
      const qtyFirst = t.match(/^(?:please\s+)?(?:add|put|restock|increase|stock up|wedzera)(?:\s+stock)?(?:\s+of)?\s+(\d+)\s+(?:to\s+)?(.+)$/);
      const nameFirst = t.match(/^(?:please\s+)?(?:add|put|restock|increase|stock up|wedzera)(?:\s+stock)?(?:\s+of)?\s+(.+?)(?:\s+by)?\s+(\d+)$/);
      const quantity = Number(qtyFirst?.[1] ?? nameFirst?.[2]);
      const productName = (qtyFirst?.[2] ?? nameFirst?.[1] ?? '').replace(/^(?:to|of)\s+/, '').trim();
      const product = products.find((item) => normalizeName(item.name) === normalizeName(productName));
      if (!Number.isInteger(quantity) || quantity <= 0) {
        actionError = inShona ? 'Nyora: wedzera [zita rechigadzirwa] [nhamba].' : 'Use: add [product name] [positive whole quantity], for example “add Bread 5”.';
      } else if (!product) {
        actionError = inShona ? `Handina kuwana “${productName || text}” paStock. Tarisa zita rechigadzirwa.` : `I couldn't find “${productName || text}” in your stock. Check the product name on the Stock screen.`;
      } else {
        action = { type: 'stock', product, quantity };
      }
    }

    if (actionError) {
      setMsgs((list) => [...list, { id: Date.now() + 1, from: 'bot', text: actionError }]);
      return;
    }
    if (action) {
      setPendingAction(action);
      const prompt = action.type === 'stock'
        ? (inShona
          ? `Ndiwedzere stock ye${action.product.name} ne${action.quantity}? Pindura “hongu” kusimbisa kana “kwete” kukanzura.`
          : `Add ${action.quantity} to ${action.product.name}? Reply “yes” to confirm or “no” to cancel.`)
        : action.type === 'debt'
          ? (inShona
            ? `Ndinonyore chikwereti cha${action.name}: ${money(action.amount)}? Pindura “hongu” kusimbisa kana “kwete” kukanzura.`
            : `Record a debt of ${money(action.amount)} for ${action.name}? Reply “yes” to confirm or “no” to cancel.`)
          : (inShona
            ? `Ndinonyore mubhadharo wa${action.name}: ${money(action.amount)}? Pindura “hongu” kusimbisa kana “kwete” kukanzura.`
            : `Record a payment of ${money(action.amount)} for ${action.name}? Reply “yes” to confirm or “no” to cancel.`);
      setMsgs((list) => [...list, { id: Date.now() + 1, from: 'bot', text: prompt }]);
      return;
    }

    setMsgs((list) => [...list, { id: Date.now() + 1, from: 'bot', text: reply(text, detectedLanguage) }]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#E9DFD3' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <View style={[w.bar, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}><Text style={w.back}>‹</Text></Pressable>
        <View style={w.avatar}><BrandSymbol size={30} /></View>
        <View>
          <Text style={w.title}>Tarisira</Text>
          <Text style={w.subtitle}>{lang === 'sn' ? 'Mubatsiri wemuno · Hapana internet' : 'Free assistant · Works offline'}</Text>
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
