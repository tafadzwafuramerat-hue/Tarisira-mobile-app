import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Debtor, Product, Tx } from '../context/AppContext';

export type ReportKind = 'sales' | 'stock' | 'debt';
export type ExportFormat = 'pdf' | 'csv' | 'excel';

type ReportData = {
  sales?: Tx[];
  products?: Product[];
  debtors?: Debtor[];
};

const TITLES: Record<ReportKind, string> = {
  sales: 'Sales Report',
  stock: 'Stock Report',
  debt: 'Debt Report',
};

const COLUMNS: Record<ReportKind, string[]> = {
  sales: ['Date', 'Time', 'Product', 'Category', 'Quantity', 'Unit price', 'Total', 'Customer', 'Payment method'],
  stock: ['Product', 'Category', 'Quantity', 'Reorder level', 'Unit price', 'Stock value'],
  debt: ['Debtor', 'Phone', 'Balance', 'Days outstanding'],
};

function rowsFor(kind: ReportKind, data: ReportData): (string | number)[][] {
  if (kind === 'sales') {
    return (data.sales ?? []).map((sale) => [
      sale.date ? new Date(sale.date).toLocaleDateString() : '', sale.time, sale.name, sale.cat, sale.qty,
      sale.qty ? (sale.total / sale.qty).toFixed(2) : '0.00',
      sale.total.toFixed(2), sale.customer ?? '', sale.method,
    ]);
  }
  if (kind === 'stock') {
    return (data.products ?? []).map((product) => [
      product.name, product.cat, product.qty, product.reorderAt,
      product.price.toFixed(2), (product.qty * product.price).toFixed(2),
    ]);
  }
  return (data.debtors ?? []).map((debtor) => [debtor.name, debtor.phone, debtor.amount.toFixed(2), debtor.days]);
}

function escapeCsv(value: string | number): string {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvFor(kind: ReportKind, data: ReportData): string {
  return [COLUMNS[kind], ...rowsFor(kind, data)]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\r\n');
}

function excelHtmlFor(kind: ReportKind, data: ReportData): string {
  const headers = COLUMNS[kind].map((heading) => `<th>${escapeHtml(heading)}</th>`).join('');
  const rows = rowsFor(kind, data).map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('');
  return `<html><head><meta charset="utf-8"></head><body><h1>Tarisira — ${TITLES[kind]}</h1><table border="1"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

function escapeHtml(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character);
}

function htmlFor(kind: ReportKind, data: ReportData): string {
  const headers = COLUMNS[kind].map((heading) => `<th>${escapeHtml(heading)}</th>`).join('');
  const rows = rowsFor(kind, data).map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('');
  const emptyRow = `<tr><td colspan="${COLUMNS[kind].length}">No records available</td></tr>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${TITLES[kind]}</title><style>
    body{font-family:Arial,sans-serif;padding:28px;color:#14231c}h1{color:#005f3c;margin:0 0 8px}p{color:#6f887c;margin:0 0 22px;font-size:12px}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#005f3c;color:#fff;text-align:left}th,td{padding:9px 8px;border:1px solid #d5ebe1}tr:nth-child(even){background:#f2f9f5}
    </style></head><body><h1>Tarisira — ${TITLES[kind]}</h1><p>Generated ${escapeHtml(new Date().toLocaleString())}</p><table><thead><tr>${headers}</tr></thead><tbody>${rows || emptyRow}</tbody></table></body></html>`;
}

function downloadOnWeb(contents: string, filename: string, mime: string): void {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function asciiPdfText(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapPdfLine(line: string, width = 92): string[] {
  const words = line.split(/\s+/);
  const wrapped: string[] = [];
  let current = '';
  for (const word of words) {
    if (current && `${current} ${word}`.length > width) {
      wrapped.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) wrapped.push(current);
  return wrapped.length ? wrapped : [''];
}

function pdfFromLines(sourceLines: string[]): string {
  const lines = sourceLines.flatMap((line) => wrapPdfLine(line).map(asciiPdfText));
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += 48) pages.push(lines.slice(index, index + 48));
  if (!pages.length) pages.push(['']);

  const objects: string[] = [];
  const pageIds = pages.map((_page, index) => 4 + index * 2);
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  pages.forEach((pageLines, index) => {
    const pageId = pageIds[index];
    const streamId = pageId + 1;
    const drawing = [
      'BT',
      '/F1 10 Tf',
      '50 790 Td',
      ...pageLines.flatMap((line, lineIndex) => [
        `(${line}) Tj`,
        lineIndex < pageLines.length - 1 ? '0 -14 Td' : '',
      ]).filter(Boolean),
      'ET',
    ].join('\n');
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`;
    objects[streamId] = `<< /Length ${drawing.length} >>\nstream\n${drawing}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

function pdfLinesForReport(kind: ReportKind, data: ReportData): string[] {
  return [
    `Tarisira - ${TITLES[kind]}`,
    `Generated: ${new Date().toLocaleString()}`,
    '',
    COLUMNS[kind].join(' | '),
    '-'.repeat(72),
    ...rowsFor(kind, data).map((row) => row.join(' | ')),
    ...(rowsFor(kind, data).length ? [] : ['No records available']),
  ];
}

async function shareNativeFile(uri: string, mimeType: string, dialogTitle: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is unavailable on this device.');
  await Sharing.shareAsync(uri, { mimeType, dialogTitle, UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text' });
}

export async function exportReport(kind: ReportKind, format: ExportFormat, data: ReportData): Promise<void> {
  const suffix = new Date().toISOString().slice(0, 10);
  const title = TITLES[kind].replace(/\s+/g, '-').toLowerCase();

  if (format === 'pdf') {
    const html = htmlFor(kind, data);
    if (Platform.OS === 'web') {
      downloadOnWeb(pdfFromLines(pdfLinesForReport(kind, data)), `${title}-${suffix}.pdf`, 'application/pdf');
      return;
    }
    const { uri } = await Print.printToFileAsync({ html });
    await shareNativeFile(uri, 'application/pdf', TITLES[kind]);
    return;
  }

  const contents = format === 'excel' ? excelHtmlFor(kind, data) : `\uFEFF${csvFor(kind, data)}`;
  const extension = format === 'excel' ? 'xls' : 'csv';
  const filename = `${title}-${suffix}.${extension}`;
  if (Platform.OS === 'web') {
    downloadOnWeb(contents, filename, format === 'excel' ? 'application/vnd.ms-excel;charset=utf-8' : 'text/csv;charset=utf-8');
    return;
  }

  const directory = FileSystem.cacheDirectory;
  if (!directory) throw new Error('File storage is unavailable on this device.');
  const uri = `${directory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, contents, { encoding: FileSystem.EncodingType.UTF8 });
  await shareNativeFile(uri, format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv', TITLES[kind]);
}

export async function exportAllReports(format: ExportFormat, data: Required<ReportData>): Promise<void> {
  const suffix = new Date().toISOString().slice(0, 10);
  const filename = `tarisira-all-reports-${suffix}`;
  const kinds: ReportKind[] = ['sales', 'stock', 'debt'];

  if (format === 'pdf') {
    const sections = kinds.map((kind) => {
      const rows = rowsFor(kind, data);
      const headers = COLUMNS[kind].map((heading) => `<th>${escapeHtml(heading)}</th>`).join('');
      const body = rows.map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('');
      return `<section><h2>${TITLES[kind]}</h2><table><thead><tr>${headers}</tr></thead><tbody>${body || `<tr><td colspan="${COLUMNS[kind].length}">No records available</td></tr>`}</tbody></table></section>`;
    }).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Tarisira Reports</title><style>
      body{font-family:Arial,sans-serif;padding:28px;color:#14231c}h1{color:#005f3c;margin:0 0 8px}h2{color:#005f3c;margin:26px 0 10px}p{color:#6f887c;margin:0 0 22px;font-size:12px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#005f3c;color:#fff;text-align:left}th,td{padding:8px 6px;border:1px solid #d5ebe1}tr:nth-child(even){background:#f2f9f5}section{page-break-inside:avoid}
      </style></head><body><h1>Tarisira — All Reports</h1><p>Generated ${escapeHtml(new Date().toLocaleString())}</p>${sections}</body></html>`;
    if (Platform.OS === 'web') {
      const lines = [
        'Tarisira - All Reports',
        `Generated: ${new Date().toLocaleString()}`,
        '',
        ...kinds.flatMap((kind) => [
          '',
          TITLES[kind],
          COLUMNS[kind].join(' | '),
          '-'.repeat(72),
          ...rowsFor(kind, data).map((row) => row.join(' | ')),
          ...(rowsFor(kind, data).length ? [] : ['No records available']),
        ]),
      ];
      downloadOnWeb(pdfFromLines(lines), `${filename}.pdf`, 'application/pdf');
      return;
    }
    const { uri } = await Print.printToFileAsync({ html });
    await shareNativeFile(uri, 'application/pdf', 'Tarisira All Reports');
    return;
  }

  const rows: (string | number)[][] = [['Report', 'Field', 'Value']];
  for (const kind of kinds) {
    for (const record of rowsFor(kind, data)) {
      COLUMNS[kind].forEach((column, index) => rows.push([TITLES[kind], column, record[index] ?? '']));
    }
  }
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')}`;
  const excelRows = rows.map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('');
  const contents = format === 'excel'
    ? `<html><head><meta charset="utf-8"></head><body><h1>Tarisira — All Reports</h1><table border="1">${excelRows}</table></body></html>`
    : csv;
  const extension = format === 'excel' ? 'xls' : 'csv';
  const outputName = `${filename}.${extension}`;
  if (Platform.OS === 'web') {
    downloadOnWeb(contents, outputName, format === 'excel' ? 'application/vnd.ms-excel;charset=utf-8' : 'text/csv;charset=utf-8');
    return;
  }
  const directory = FileSystem.cacheDirectory;
  if (!directory) throw new Error('File storage is unavailable on this device.');
  const uri = `${directory}${outputName}`;
  await FileSystem.writeAsStringAsync(uri, contents, { encoding: FileSystem.EncodingType.UTF8 });
  await shareNativeFile(uri, format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv', 'Tarisira All Reports');
}
