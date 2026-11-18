import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../components/LocalizedText';
import { ReportExportButtons } from '../components/ReportExportButtons';
import { Card, Header, Screen, s } from '../components/ui';
import { C, SERIF, money } from '../constants/theme';
import { Product, useApp } from '../context/AppContext';

type ProductSales = { product: Product; quantity: number; revenue: number };
type DailySales = { date: Date; revenue: number };

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getDailySales(sales: ReturnType<typeof useApp>['txs']): DailySales[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return { date, revenue: 0 };
  });
  const totals = new Map(days.map((day) => [dateKey(day.date), day]));

  sales.forEach((sale) => {
    const soldAt = new Date(sale.date);
    const day = totals.get(dateKey(soldAt));
    if (day) day.revenue += sale.total;
  });

  return days;
}

function getProductSales(products: Product[], sales: ReturnType<typeof useApp>['txs']): ProductSales[] {
  return products
    .map((product) => {
      const productSales = sales.filter((sale) => sale.name.trim().toLowerCase() === product.name.trim().toLowerCase());
      return {
        product,
        quantity: productSales.reduce((sum, sale) => sum + sale.qty, 0),
        revenue: productSales.reduce((sum, sale) => sum + sale.total, 0),
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity || a.product.name.localeCompare(b.product.name));
}

export default function SalesReport() {
  const { products, txs } = useApp();
  const revenue = txs.reduce((sum, sale) => sum + sale.total, 0);
  const unitsSold = txs.reduce((sum, sale) => sum + sale.qty, 0);
  const dailySales = getDailySales(txs);
  const maxDailyRevenue = Math.max(...dailySales.map((day) => day.revenue), 0);
  const productSales = getProductSales(products, txs);

  return (
    <Screen>
      <Header title="Sales Report" sub="" />
      <View style={r.summary}>
        <View style={[s.card, r.summaryCard]}>
          <Text style={s.muted}>Total Revenue</Text>
          <Text style={[r.value, { color: C.orange }]}>{money(revenue)}</Text>
        </View>
        <View style={[s.card, r.summaryCard]}>
          <Text style={s.muted}>Units Sold</Text>
          <Text style={r.value}>{unitsSold}</Text>
        </View>
      </View>

      <Card>
        <Text style={r.title}>Sales — Last 7 Days</Text>
        {maxDailyRevenue === 0 ? (
          <Text style={[s.muted, { marginTop: 8 }]}>No sales recorded in the last 7 days.</Text>
        ) : dailySales.map(({ date, revenue: dayRevenue }) => (
          <View key={dateKey(date)} style={r.dailyRow}>
            <Text style={r.date}>{date.toLocaleDateString('en', { weekday: 'short', day: 'numeric' })}</Text>
            <View style={r.bar}>
              <View style={[r.barFill, { width: `${(dayRevenue / maxDailyRevenue) * 100}%` }]} />
            </View>
            <Text style={r.dailyAmount}>{money(dayRevenue)}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={r.title}>Sales by Product</Text>
        {productSales.length === 0 ? (
          <Text style={[s.muted, { marginTop: 8 }]}>No products have been added yet.</Text>
        ) : productSales.map(({ product, quantity, revenue: productRevenue }) => (
          <View key={product.id} style={r.productRow}>
            <View style={r.productDetails}>
              <Text style={r.prodName}>{product.name}</Text>
              <Text style={s.muted}>Sold: {quantity} · In stock: {product.qty}</Text>
            </View>
            <Text style={r.prodAmt}>{money(productRevenue)}</Text>
          </View>
        ))}
      </Card>

      <ReportExportButtons kind="sales" />
    </Screen>
  );
}

const r = StyleSheet.create({
  summary: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  summaryCard: { flex: 1, marginBottom: 0 },
  value: { fontFamily: SERIF, fontSize: 26, fontWeight: '800', color: C.dark, marginTop: 6 },
  title: { fontWeight: '800', fontSize: 16, color: C.ink, marginBottom: 6 },
  dailyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  date: { width: 48, color: C.muted, fontSize: 12 },
  bar: { height: 8, flex: 1, borderRadius: 4, backgroundColor: C.line, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: C.green },
  dailyAmount: { width: 68, textAlign: 'right', fontWeight: '700', color: C.ink, fontSize: 12 },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  productDetails: { flex: 1 },
  prodName: { fontWeight: '700', color: C.ink, marginBottom: 4 },
  prodAmt: { fontWeight: '800', color: C.orange },
});
