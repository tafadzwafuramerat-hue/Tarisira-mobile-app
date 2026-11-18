import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../../components/LocalizedText';
import { ChangeOwedForm } from '../../components/forms';
import { AppIcon } from '../../components/AppIcon';
import { Badge, Card, Search, s } from '../../components/ui';
import { C, SERIF, money } from '../../constants/theme';
import { ChangeOwed, useApp } from '../../context/AppContext';
import { errorMessage } from '../../utils/errors';

type CustomerBalance = {
  key: string;
  customerName: string;
  phone: string;
  amount: number;
  records: ChangeOwed[];
};

function customerKey(record: ChangeOwed): string {
  const phone = record.phone.replace(/\s/g, '');
  return phone ? `phone:${phone}` : `name:${record.customerName.trim().toLowerCase()}`;
}

export default function ChangeOwedPage() {
  const { changeOwed, settleChangeOwed } = useApp();
  const [adding, setAdding] = useState(false);
  const [showSettled, setShowSettled] = useState(false);
  const [query, setQuery] = useState('');
  const [settling, setSettling] = useState<string | null>(null);

  const balances = useMemo(() => {
    const groups = new Map<string, CustomerBalance>();
    for (const record of changeOwed) {
      if (record.settled !== showSettled) continue;
      const key = customerKey(record);
      const existing = groups.get(key);
      if (existing) {
        existing.amount += record.amount;
        existing.records.push(record);
      } else {
        groups.set(key, {
          key,
          customerName: record.customerName,
          phone: record.phone,
          amount: record.amount,
          records: [record],
        });
      }
    }
    return [...groups.values()]
      .filter((customer) =>
        customer.customerName.toLowerCase().includes(query.trim().toLowerCase())
        || customer.phone.includes(query.trim()),
      )
      .sort((a, b) => b.amount - a.amount);
  }, [changeOwed, query, showSettled]);

  const outstanding = changeOwed.filter((record) => !record.settled);
  const customerCount = new Set(outstanding.map(customerKey)).size;
  const totalOwed = outstanding.reduce((sum, record) => sum + record.amount, 0);

  const confirmSettlement = (customer: CustomerBalance) => {
    Alert.alert(
      'Mark change as repaid?',
      `This will settle ${money(customer.amount)} owed to ${customer.customerName}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Repaid',
          onPress: () => {
            void (async () => {
              setSettling(customer.key);
              try {
                for (const record of customer.records) await settleChangeOwed(record.id);
              } catch (error) {
                Alert.alert('Could not settle change', errorMessage(error, 'Please try again.'));
              } finally {
                setSettling(null);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={p.content} keyboardShouldPersistTaps="handled">
      <View style={p.hero}>
        <View style={p.heroIcon}><AppIcon name="cash-refund" size={24} color="#fff" /></View>
        <Text style={p.heroLabel}>Total change the tuckshop owes customers</Text>
        <Text style={p.heroAmount}>{money(totalOwed)}</Text>
        <Text style={p.heroCount}>{customerCount} {customerCount === 1 ? 'person' : 'people'} waiting for change</Text>
      </View>

      <Pressable style={p.addButton} onPress={() => setAdding(true)}>
        <AppIcon name="plus" size={20} color="#fff" />
        <Text style={p.addText}>Record Change Owed</Text>
      </Pressable>

      <View style={p.sectionHeader}>
        <Text style={p.sectionTitle}>{showSettled ? 'Repaid Change' : 'People Owed Change'}</Text>
        <Pressable onPress={() => setShowSettled((value) => !value)}>
          <Text style={p.historyLink}>{showSettled ? 'View outstanding' : 'View repaid'}</Text>
        </Pressable>
      </View>
      <View style={p.search}><Search value={query} onChangeText={setQuery} placeholder="Search by name or phone" /></View>

      {balances.map((customer) => (
        <Card key={customer.key} style={p.customerCard}>
          <View style={p.customerTop}>
            <View style={p.personIcon}><AppIcon name="account-outline" size={22} color={C.dark} /></View>
            <View style={p.customerInfo}>
              <Text style={p.customerName}>{customer.customerName}</Text>
              {customer.phone ? <Text style={s.muted}>{customer.phone}</Text> : null}
            </View>
            <View style={p.amountBox}>
              <Text style={p.amount}>{money(customer.amount)}</Text>
              <Text style={p.amountCaption}>{showSettled ? 'repaid' : 'owed'}</Text>
            </View>
          </View>
          <View style={p.recordInfo}>
            <Badge text={`${customer.records.length} ${customer.records.length === 1 ? 'entry' : 'entries'}`} />
            {customer.records[0]?.note ? <Text style={p.note} numberOfLines={2}>{customer.records[0].note}</Text> : null}
          </View>
          {!showSettled && (
            <Pressable
              style={[p.settleButton, settling === customer.key && p.settleDisabled]}
              disabled={settling === customer.key}
              onPress={() => confirmSettlement(customer)}
            >
              <AppIcon name="check-circle-outline" size={18} color={C.dark} />
              <Text style={p.settleText}>{settling === customer.key ? 'Saving…' : 'Mark repaid'}</Text>
            </Pressable>
          )}
        </Card>
      ))}

      {balances.length === 0 && (
        <View style={p.empty}>
          <AppIcon name={showSettled ? 'check-circle-outline' : 'cash-check'} size={34} color={C.muted} />
          <Text style={p.emptyTitle}>{query ? 'No matching people' : showSettled ? 'No repaid change yet' : 'No change owed yet'}</Text>
          <Text style={p.emptyText}>
            {query ? 'Try another name or phone number.' : showSettled ? 'Repaid change records will appear here.' : 'Record change left by a customer to track what the tuckshop owes.'}
          </Text>
        </View>
      )}

      {adding && <ChangeOwedForm onClose={() => setAdding(false)} />}
    </ScrollView>
  );
}

const p = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  hero: { backgroundColor: C.dark, borderRadius: 18, padding: 20, alignItems: 'center' },
  heroIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroLabel: { color: '#CBE9DA', fontSize: 13, textAlign: 'center' },
  heroAmount: { fontFamily: SERIF, color: '#fff', fontSize: 38, fontWeight: '800', marginTop: 6 },
  heroCount: { color: '#CBE9DA', fontSize: 13, marginTop: 4 },
  addButton: { backgroundColor: C.green, borderRadius: 14, paddingVertical: 15, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: C.ink },
  historyLink: { fontSize: 13, fontWeight: '700', color: C.dark },
  search: { marginBottom: 12 },
  customerCard: { padding: 15 },
  customerTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  personIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '800', color: C.ink, marginBottom: 3 },
  amountBox: { alignItems: 'flex-end' },
  amount: { fontFamily: SERIF, fontSize: 20, fontWeight: '800', color: C.dark },
  amountCaption: { color: C.muted, fontSize: 11, marginTop: 1 },
  recordInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  note: { flex: 1, color: C.muted, fontSize: 12 },
  settleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderTopWidth: 1, borderTopColor: C.line, marginTop: 12, paddingTop: 12 },
  settleDisabled: { opacity: 0.6 },
  settleText: { color: C.dark, fontWeight: '800', fontSize: 13 },
  empty: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 36 },
  emptyTitle: { color: C.ink, fontSize: 16, fontWeight: '800', marginTop: 12 },
  emptyText: { color: C.muted, textAlign: 'center', fontSize: 13, lineHeight: 19, marginTop: 5 },
});
