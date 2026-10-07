import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { Button, Header, Screen, s } from '../components/ui';
import { AppIcon } from '../components/AppIcon';
import { C } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { exportAllReports, ExportFormat } from '../utils/reportExport';

const FORMATS: { id: ExportFormat; icon: React.ComponentProps<typeof AppIcon>['name']; title: string; sub: string }[] = [
  { id: 'pdf', icon: 'file-pdf-box', title: 'PDF', sub: 'Formatted report, ready to share' },
  { id: 'csv', icon: 'file-delimited-outline', title: 'CSV', sub: 'Raw data for spreadsheets' },
  { id: 'excel', icon: 'microsoft-excel', title: 'Excel', sub: 'Excel-compatible spreadsheet (.xls)' },
];
const RANGES = ['This Month', 'Last Month', 'All Time'];

export default function ExportData() {
  const [format, setFormat] = useState('pdf');
  const [range, setRange] = useState('This Month');
  const [busy, setBusy] = useState(false);
  const { txs, products, debtors } = useApp();
  const label = FORMATS.find((f) => f.id === format)?.title ?? 'PDF';

  const exportData = async () => {
    setBusy(true);
    try {
      const now = new Date();
      const filteredSales = txs.filter((sale) => {
        if (range === 'All Time') return true;
        const saleDate = sale.date ? new Date(sale.date) : now;
        if (Number.isNaN(saleDate.getTime())) return range === 'This Month';
        if (range === 'This Month') return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return saleDate.getMonth() === previous.getMonth() && saleDate.getFullYear() === previous.getFullYear();
      });
      await exportAllReports(format as ExportFormat, { sales: filteredSales, products, debtors });
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'The reports could not be exported.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="Export Data" sub="" />
      <Text style={[s.sub, { marginTop: -16 }]}>Export your complete business data at any time. Your information always belongs to you.</Text>

      <Text style={s.label}>Format</Text>
      {FORMATS.map((f) => (
        <Pressable key={f.id} style={[e.row, format === f.id && e.rowOn]} onPress={() => setFormat(f.id)}>
          <AppIcon name={f.icon} size={24} color={C.dark} />
          <View style={{ flex: 1 }}>
            <Text style={e.title}>{f.title}</Text>
            <Text style={s.muted}>{f.sub}</Text>
          </View>
          {format === f.id && <AppIcon name="check" size={18} color={C.green} />}
        </Pressable>
      ))}

      <Text style={[s.label, { marginTop: 8 }]}>Date Range</Text>
      <View style={e.rangeRow}>
        {RANGES.map((r) => (
          <Pressable key={r} style={[e.rangeChip, range === r && e.rangeChipOn]} onPress={() => setRange(r)}>
            <Text style={[e.rangeText, range === r && { color: C.dark }]}>{r}</Text>
          </Pressable>
        ))}
      </View>

      <Button label={busy ? 'Preparing export…' : `Export all reports as ${label}${format === 'excel' ? ' (.xls)' : ''}`} disabled={busy} onPress={() => void exportData()} />
    </Screen>
  );
}

const e = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 7, padding: 16, marginBottom: 12 },
  rowOn: { backgroundColor: C.mint, borderColor: C.green },
  title: { fontWeight: '800', color: C.ink, fontSize: 15, marginBottom: 2 },
  rangeRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  rangeChip: { flex: 1, borderWidth: 1.5, borderColor: C.line, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff' },
  rangeChipOn: { backgroundColor: C.mint, borderColor: C.green },
  rangeText: { fontWeight: '700', color: C.ink },
});
