import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Button } from './ui';
import { exportReport, ExportFormat, ReportKind } from '../utils/reportExport';
import { useApp } from '../context/AppContext';

export function ReportExportButtons({ kind }: { kind: ReportKind }) {
  const { txs, products, debtors } = useApp();
  const [busy, setBusy] = useState<ExportFormat | null>(null);

  const runExport = async (format: ExportFormat) => {
    setBusy(format);
    try {
      await exportReport(kind, format, { sales: txs, products, debtors });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The report could not be exported.';
      Alert.alert('Export failed', message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <View>
      <Button label={busy === 'pdf' ? 'Preparing PDF…' : 'Download PDF'} disabled={busy !== null} onPress={() => void runExport('pdf')} />
      <Button label={busy === 'csv' ? 'Preparing CSV…' : 'Download CSV'} outline disabled={busy !== null} onPress={() => void runExport('csv')} />
      <Button label={busy === 'excel' ? 'Preparing Excel…' : 'Download Excel-compatible (.xls)'} outline disabled={busy !== null} onPress={() => void runExport('excel')} />
    </View>
  );
}