import React, { useMemo, useState } from 'react';
import {
  Alert, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const C = {
  bg: '#F2F9F5', dark: '#005F3C', green: '#00A86B', mint: '#E3F4EC', line: '#D5EBE1',
  muted: '#6FA88F', ink: '#14231C', orange: '#000000', red: '#E5252A', pink: '#FDE8E8',
};
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const LOW = 10; // stock at or below this counts as low
const money = (n) => '$' + (Number.isInteger(n) ? n : n.toFixed(2));

const START_PRODUCTS = [
  { id: 1, name: 'Coca-Cola', cat: 'Beverages', price: 1, qty: 85 },
  { id: 2, name: 'Bread', cat: 'Bakery', price: 1.2, qty: 8 },
  { id: 3, name: 'Milk 1L', cat: 'Dairy', price: 1.5, qty: 5 },
  { id: 4, name: 'Sugar 2kg', cat: 'Groceries', price: 2.5, qty: 24 },
  { id: 5, name: 'Cooking Oil', cat: 'Groceries', price: 3, qty: 12 },
  { id: 6, name: 'Salt 1kg', cat: 'Groceries', price: 0.6, qty: 30 },
];
const START_DEBTORS = [
  { id: 1, name: 'John Moyo', amount: 20, days: 2 },
  { id: 2, name: 'Mary Chikwanda', amount: 15, days: 5 },
  { id: 3, name: 'Peter Dube', amount: 35, days: 1 },
];
const BASE_CATS = { Beverages: 85, Bakery: 10, Dairy: 8, Groceries: 96 };
const CAT_COLORS = ['#00A86B', '#000000', '#005F3C', '#9DB8AB', '#6FA88F', '#C9D8CF'];
const soon = () => Alert.alert('Coming soon', 'This feature is not built yet.');

// ---------- shared bits ----------
const Card = ({ children, style }) => <View style={[s.card, style]}>{children}</View>;
const Badge = ({ text, bad }) => (
  <View style={[s.badge, bad && { backgroundColor: C.pink }]}>
    <Text style={[s.badgeText, bad && { color: C.red }]}>{text}</Text>
  </View>
);
const Search = ({ value, onChangeText, placeholder }) => (
  <View style={s.search}>
    <Icon name="magnify" size={18} color={C.muted} />
    <TextInput style={s.searchInput} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8FA79B" />
  </View>
);
const Input = ({ label, ...p }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={s.label}>{label}</Text>
    <TextInput style={s.input} placeholderTextColor="#8FA79B" {...p} />
  </View>
);
const Btn = ({ label, onPress, style }) => (
  <Pressable style={[s.btn, style]} onPress={onPress}><Text style={s.btnText}>{label}</Text></Pressable>
);
function Sheet({ title, onClose, children }) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={s.sheet}>
        <Text style={s.sheetTitle}>{title}</Text>
        <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
      </View>
    </Modal>
  );
}

// ---------- forms ----------
function SaleForm({ products, onSave, onClose }) {
  const [pid, setPid] = useState(products[0]?.id);
  const [qty, setQty] = useState('1');
  const p = products.find((x) => x.id === pid);
  const n = parseInt(qty, 10) || 0;
  const save = () => {
    if (!p || n < 1) return Alert.alert('Check the quantity', 'Enter at least 1.');
    if (n > p.qty) return Alert.alert('Not enough stock', `Only ${p.qty} ${p.name} left.`);
    onSave(p, n);
  };
  return (
    <Sheet title="Record Sale" onClose={onClose}>
      <Text style={s.label}>Product</Text>
      {products.map((x) => (
        <Pressable key={x.id} style={[s.pick, pid === x.id && s.pickOn]} onPress={() => setPid(x.id)}>
          <Text style={s.pickName}>{x.name}</Text>
          <Text style={s.muted}>{money(x.price)} · {x.qty} left</Text>
        </Pressable>
      ))}
      <Input label="Quantity" keyboardType="number-pad" value={qty} onChangeText={setQty} />
      <Text style={s.total}>Total: {money((p?.price || 0) * n)}</Text>
      <Btn label="Save Sale" onPress={save} />
    </Sheet>
  );
}
function ProductForm({ onSave, onClose }) {
  const [f, setF] = useState({ name: '', cat: '', price: '', qty: '' });
  const set = (k) => (v) => setF({ ...f, [k]: v });
  const save = () => {
    const price = parseFloat(f.price), qty = parseInt(f.qty, 10);
    if (!f.name.trim() || !(price > 0) || !(qty >= 0)) return Alert.alert('Missing details', 'Enter a name, a price and a quantity.');
    onSave({ name: f.name.trim(), cat: f.cat.trim() || 'Other', price, qty });
  };
  return (
    <Sheet title="Add Product" onClose={onClose}>
      <Input label="Product name" value={f.name} onChangeText={set('name')} placeholder="e.g. Rice 5kg" />
      <Input label="Category" value={f.cat} onChangeText={set('cat')} placeholder="e.g. Groceries" />
      <Input label="Price per unit ($)" keyboardType="decimal-pad" value={f.price} onChangeText={set('price')} />
      <Input label="Quantity in stock" keyboardType="number-pad" value={f.qty} onChangeText={set('qty')} />
      <Btn label="Save Product" onPress={save} />
    </Sheet>
  );
}
function DebtorForm({ onSave, onClose }) {
  const [f, setF] = useState({ name: '', amount: '', days: '7' });
  const set = (k) => (v) => setF({ ...f, [k]: v });
  const save = () => {
    const amount = parseFloat(f.amount), days = parseInt(f.days, 10);
    if (!f.name.trim() || !(amount > 0)) return Alert.alert('Missing details', 'Enter a name and the amount owed.');
    onSave({ name: f.name.trim(), amount, days: days >= 0 ? days : 7 });
  };
  return (
    <Sheet title="Add Debtor" onClose={onClose}>
      <Input label="Customer name" value={f.name} onChangeText={set('name')} />
      <Input label="Amount owed ($)" keyboardType="decimal-pad" value={f.amount} onChangeText={set('amount')} />
      <Input label="Due in (days)" keyboardType="number-pad" value={f.days} onChangeText={set('days')} />
      <Btn label="Save Debtor" onPress={save} />
    </Sheet>
  );
}

// ---------- charts ----------
const WEEK = [22, 30, 24, 40, 34, 52, 8];
const WEEK_LABELS = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
function LineChart() {
  const W = 300, H = 100, max = 60;
  const pts = WEEK.slice(1).map((v, i, a) => [(i / (a.length - 1)) * W, H - (v / max) * H]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return (
    <View>
      <Svg width="100%" height={110} viewBox={`0 0 ${W} ${H + 6}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.green} stopOpacity="0.22" />
            <Stop offset="1" stopColor={C.green} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={`${d} L${W},${H} L0,${H} Z`} fill="url(#g)" />
        <Path d={d} stroke={C.green} strokeWidth="2.5" fill="none" />
      </Svg>
      <View style={s.weekRow}>{WEEK_LABELS.map((l) => <Text key={l} style={s.weekLabel}>{l}</Text>)}</View>
    </View>
  );
}
const BARS = [[1, 14], [5, 20], [10, 17], [15, 24], [20, 21], [25, 28], [30, 1]];
function BarChart() {
  return (
    <View style={s.bars}>
      {BARS.map(([d, v]) => (
        <View key={d} style={{ alignItems: 'center', flex: 1 }}>
          <View style={{ height: 70, justifyContent: 'flex-end' }}>
            <View style={{ width: 20, height: v * 2, backgroundColor: C.green, borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
          </View>
          <Text style={[s.weekLabel, { marginTop: 8 }]}>{d}</Text>
        </View>
      ))}
    </View>
  );
}
function Donut({ data }) {
  const total = data.reduce((a, b) => a + b[1], 0) || 1;
  const R = 40, CIRC = 2 * Math.PI * R;
  let acc = 0;
  return (
    <Svg width={130} height={130} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r={R} stroke={C.line} strokeWidth="14" fill="none" />
      {data.map(([name, v], i) => {
        const len = (v / total) * CIRC;
        const el = (
          <Circle key={name} cx="50" cy="50" r={R} fill="none" stroke={CAT_COLORS[i % CAT_COLORS.length]} strokeWidth="14"
            strokeDasharray={`${len} ${CIRC - len}`} strokeDashoffset={-acc} rotation="-90" origin="50, 50" />
        );
        acc += len;
        return el;
      })}
    </Svg>
  );
}

// ---------- tabs ----------
const Stat = ({ icon, label, value, note, color, style }) => (
  <View style={[s.stat, style]}>
    <View style={s.statLabel}>{icon}<Text style={s.muted}>{label}</Text></View>
    <Text style={[s.statValue, { color: color || C.dark }]}>{value}</Text>
    {note ? <Text style={s.muted}>{note}</Text> : null}
  </View>
);

function Home({ name, greet, today, txCount, debtTotal, debtCount, products, lowCount, go, openSale }) {
  const month = new Date().toLocaleString('en', { month: 'short', year: 'numeric' });
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={s.h1}>{greet}, {name}</Text>
      <Text style={[s.muted, { marginBottom: 16, fontSize: 15 }]}>Here's your business overview</Text>
      <View style={s.grid}>
        <Stat icon={<Icon name="cash-multiple" size={16} color={C.orange} />} label="Today's Sales" value={money(today)} color={C.orange} note={`${txCount} transactions`} />
        <Stat icon={<Icon name="account-group-outline" size={16} color={C.muted} />} label="Debts Owed" value={money(debtTotal)} note={`${debtCount} debtors`} />
        <Stat icon={<Icon name="package-variant-closed" size={16} color={C.muted} />} label="Products" value={String(products)} />
        <Stat icon={<Icon name="alert-outline" size={16} color={C.red} />} label="Low Stock" value={String(lowCount)} note="Needs attention" />
      </View>
      <Card style={{ marginTop: 14 }}>
        <View style={s.rowBetween}><Text style={s.cardTitle}>Sales This Week</Text><Text style={s.muted}>{month}</Text></View>
        <LineChart />
      </Card>
      <View style={s.actionRow}>
        <Pressable style={[s.action, { backgroundColor: C.dark }]} onPress={openSale}><Text style={[s.actionText, { color: '#fff' }]}>+ Record Sale</Text></Pressable>
        <Pressable style={[s.action, { backgroundColor: C.mint, borderColor: C.line }]} onPress={soon}><View style={s.iconText}><Icon name="message-text-outline" size={18} color={C.dark} /><Text style={s.actionText}>WhatsApp</Text></View></Pressable>
      </View>
      <View style={s.actionRow}>
        <Pressable style={[s.action, s.actionSm]} onPress={soon}><View style={s.iconText}><Icon name="bell-outline" size={18} color={C.dark} /><Text style={s.actionText}>Reminders</Text></View></Pressable>
        <Pressable style={[s.action, s.actionSm]} onPress={() => go('reports')}><View style={s.iconText}><Icon name="chart-box-outline" size={18} color={C.dark} /><Text style={s.actionText}>Reports</Text></View></Pressable>
      </View>
    </ScrollView>
  );
}

function StockTab({ products, lowCount, onAdd }) {
  const [q, setQ] = useState('');
  const list = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Search value={q} onChangeText={setQ} placeholder="Search products..." /></View>
        <Pressable style={s.addBtn} onPress={onAdd}><Text style={s.btnText}>+ Add</Text></Pressable>
      </View>
      {lowCount > 0 && (
        <View style={s.alertBox}><Icon name="alert-outline" size={20} color={C.red} />
          <Text style={s.alertText}>{lowCount} product{lowCount > 1 ? 's' : ''} running low on stock</Text></View>
      )}
      {list.map((p) => {
        const low = p.qty <= LOW;
        return (
          <Card key={p.id} style={s.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={s.itemName}>{p.name}</Text>
              <Text style={s.muted}>{p.cat} · {money(p.price)} / unit</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <Text style={[s.qty, low && { color: C.red }]}>{p.qty}</Text>
              <Badge text={low ? 'Low Stock' : 'In Stock'} bad={low} />
            </View>
          </Card>
        );
      })}
      {list.length === 0 && <Text style={s.empty}>No products found.</Text>}
    </ScrollView>
  );
}

function SalesTab({ week, month, today, txs, onSale }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[['Today', today, C.orange], ['Week', week], ['Month', month]].map(([l, v, c]) => (
          <View key={l} style={[s.card, { flex: 1, padding: 14, marginBottom: 0 }]}>
            <Text style={s.muted}>{l}</Text>
            <Text style={[s.statValue, { fontSize: 24, color: c || C.dark }]}>{money(v)}</Text>
          </View>
        ))}
      </View>
      <Pressable style={[s.btn, { marginVertical: 16 }]} onPress={onSale}><Text style={s.btnText}>+ Record Sale</Text></Pressable>
      <Card>
        <View style={s.rowBetween}><Text style={s.cardTitle}>Monthly Trend</Text><Text style={s.muted}>{new Date().toLocaleString('en', { month: 'long', year: 'numeric' })}</Text></View>
        <BarChart />
      </Card>
      <Card>
        <Text style={s.cardTitle}>Recent Transactions</Text>
        {txs.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 18 }}>
            <Text style={{ color: C.muted, fontSize: 15 }}>No sales recorded yet.</Text>
            <Text style={[s.muted, { marginTop: 4 }]}>Tap '+ Record Sale' to start.</Text>
          </View>
        ) : txs.map((t) => (
          <View key={t.id} style={[s.rowBetween, s.txRow]}>
            <View><Text style={s.itemName}>{t.name} × {t.qty}</Text><Text style={s.muted}>{t.time}</Text></View>
            <Text style={[s.qty, { fontSize: 18 }]}>{money(t.total)}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

function DebtorsTab({ debtors, total, onAdd, onPaid }) {
  const [q, setQ] = useState('');
  const list = debtors.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()));
  const due = (d) => (d.days === 0 ? 'Due today' : d.days === 1 ? 'Due tomorrow' : `Due in ${d.days} days`);
  const shade = ['#004D30', '#0B6B45', '#005F3C'];
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={s.debtHero}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#B9DDCB', fontSize: 13 }}>Total Outstanding</Text>
          <Text style={s.heroAmt}>{money(total)}</Text>
          <Text style={{ color: '#B9DDCB', fontSize: 13 }}>{debtors.length} debtors</Text>
        </View>
        <Pressable style={s.heroAdd} onPress={onAdd}><Text style={s.btnText}>+ Add</Text></Pressable>
      </View>
      <View style={{ marginVertical: 14 }}><Search value={q} onChangeText={setQ} placeholder="Search debtors..." /></View>
      {list.map((d, i) => (
        <Pressable key={d.id} onPress={() => Alert.alert(d.name, `${money(d.amount)} owed · ${due(d)}`, [
          { text: 'Mark as paid', onPress: () => onPaid(d.id) }, { text: 'Cancel', style: 'cancel' }])}>
          <Card style={s.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
              <View style={[s.avatar, { backgroundColor: shade[i % 3] }]}><Text style={s.avatarText}>{d.name[0].toUpperCase()}</Text></View>
              <View><Text style={s.itemName}>{d.name}</Text><Text style={s.muted}>{due(d)}</Text></View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={[s.qty, { color: C.orange, fontSize: 20 }]}>{money(d.amount)}</Text>
              {d.days <= 2 && <Badge text="Due Soon" bad />}
            </View>
          </Card>
        </Pressable>
      ))}
      {list.length === 0 && <Text style={s.empty}>No debtors found. Tap a debtor to mark them as paid.</Text>}
    </ScrollView>
  );
}

function ReportsTab({ month, stockValue, debtTotal, count, cats }) {
  const rows = [['chart-box-outline', 'Sales Report', 'Revenue, products & trends'], ['package-variant-closed', 'Stock Report', 'Levels, value & movement'], ['account-group-outline', 'Debt Report', 'Outstanding & paid debts']];
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={s.grid}>
        <Stat icon={<Icon name="cash-multiple" size={16} color={C.orange} />} label="Monthly Sales" value={money(month)} color={C.orange} />
        <Stat icon={<Icon name="package-variant-closed" size={16} color={C.muted} />} label="Stock Value" value={money(Math.round(stockValue))} />
        <Stat icon={<Icon name="account-group-outline" size={16} color={C.muted} />} label="Total Debt" value={money(debtTotal)} style={{ minHeight: 90 }} />
        <Stat icon={<Icon name="archive-outline" size={16} color={C.muted} />} label="Products" value={String(count)} style={{ minHeight: 90 }} />
      </View>
      {rows.map(([i, t, d]) => (
        <Pressable key={t} onPress={soon}>
          <Card style={[s.rowBetween, { marginTop: 12, marginBottom: 0 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={s.iconBox}><Icon name={i} size={22} color={C.dark} /></View>
              <View><Text style={s.itemName}>{t}</Text><Text style={s.muted}>{d}</Text></View>
            </View>
            <Text style={s.chev}>›</Text>
          </Card>
        </Pressable>
      ))}
      <Card style={{ marginTop: 12 }}>
        <Text style={s.cardTitle}>Sales by Category</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 }}>
          <Donut data={cats} />
          <View style={{ flex: 1, gap: 10 }}>
            {cats.map(([n, v], i) => (
              <View key={n} style={s.rowBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                  <Text style={{ color: C.ink }}>{n}</Text>
                </View>
                <Text style={{ fontWeight: '800', color: C.ink }}>{money(v)}</Text>
              </View>
            ))}
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

// ---------- settings ----------
function Settings({ data, lang, setLang, onBack, onLogout }) {
  const groups = [
    [['domain', 'Business Profile'], ['web', 'Language', lang === 'en' ? 'English' : 'Shona', () => setLang(lang === 'en' ? 'sn' : 'en')],
      ['bell-outline', 'Notifications'], ['star-outline', 'Subscription']],
    [['lock-outline', 'Privacy & Security'], ['export-variant', 'Export Data'], ['message-text-outline', 'WhatsApp Bot'], ['help-circle-outline', 'Help & Support']],
  ];
  const Row = ([icon, label, right, fn]) => (
    <Pressable key={label} style={s.setRow} onPress={fn || soon}>
      <View style={s.iconBox}><Icon name={icon} size={22} color={C.dark} /></View>
      <Text style={s.setLabel}>{label}</Text>
      {right ? <Text style={{ color: C.muted, fontWeight: '700' }}>{right}</Text> : <Text style={s.chev}>›</Text>}
    </Pressable>
  );
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <SafeAreaView style={{ backgroundColor: C.dark }}>
        <View style={s.topBar}>
          <Pressable onPress={onBack} hitSlop={12}><Text style={{ color: '#fff', fontSize: 26, marginRight: 12 }}>‹</Text></Pressable>
          <Text style={[s.logoText, { fontSize: 20 }]}>Settings</Text>
        </View>
      </SafeAreaView>
      <ScrollView style={{ backgroundColor: C.bg }}>
        <View style={s.profile}>
          <View style={s.bigLogo}><Icon name="leaf" size={36} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.profName}>{data.bizName || 'Your Business'}</Text>
            <Text style={s.muted}>{data.bizPhone || data.phone || '+263'} · {(data.location || '').split(',')[0]}</Text>
            <View style={[s.badge, { alignSelf: 'flex-start', marginTop: 8 }]}><Text style={s.badgeText}>Free Trial · 60 days left</Text></View>
          </View>
        </View>
        {groups.map((g, i) => <View key={i} style={s.group}>{g.map(Row)}</View>)}
        <View style={s.group}>
          <Pressable style={s.setRow} onPress={() => Alert.alert('Log out?', 'You will need to sign in again.', [
            { text: 'Cancel', style: 'cancel' }, { text: 'Log Out', style: 'destructive', onPress: onLogout }])}>
            <View style={[s.iconBox, { backgroundColor: C.pink }]}><Icon name="logout" size={22} color={C.red} /></View>
            <Text style={[s.setLabel, { color: C.red }]}>Log Out</Text><Text style={s.chev}>›</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ---------- root of the signed-in app ----------
const TABS = [['home', 'view-dashboard-outline', 'Home'], ['stock', 'package-variant-closed', 'Stock'], ['sales', 'cash-multiple', 'Sales'], ['debtors', 'account-group-outline', 'Debtors'], ['reports', 'chart-box-outline', 'Reports']];

export default function Dashboard({ data, lang, setLang, onLogout }) {
  const [tab, setTab] = useState('home');
  const [settings, setSettings] = useState(false);
  const [modal, setModal] = useState(null);
  const [products, setProducts] = useState(START_PRODUCTS);
  const [debtors, setDebtors] = useState(START_DEBTORS);
  const [txs, setTxs] = useState([]);

  const today = txs.reduce((a, t) => a + t.total, 0);
  const debtTotal = debtors.reduce((a, d) => a + d.amount, 0);
  const lowCount = products.filter((p) => p.qty <= LOW).length;
  const stockValue = products.reduce((a, p) => a + p.qty * p.price, 0);
  const cats = useMemo(() => {
    const m = { ...BASE_CATS };
    txs.forEach((t) => { m[t.cat] = (m[t.cat] || 0) + t.total; });
    return Object.entries(m).map(([k, v]) => [k, Math.round(v * 100) / 100]);
  }, [txs]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = data.name ? data.name.split(' ')[0] : 'Boss';

  const saveSale = (p, n) => {
    const total = Math.round(p.price * n * 100) / 100;
    setProducts(products.map((x) => (x.id === p.id ? { ...x, qty: x.qty - n } : x)));
    setTxs([{ id: Date.now(), name: p.name, cat: p.cat, qty: n, total, time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) }, ...txs]);
    setModal(null);
  };

  if (settings) return <Settings data={data} lang={lang} setLang={setLang} onBack={() => setSettings(false)} onLogout={onLogout} />;

  const title = TABS.find((x) => x[0] === tab)[2];
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView style={{ backgroundColor: C.dark }}>
        <View style={[s.topBar, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={s.smallLogo}><Icon name="leaf" size={18} color="#fff" /></View>
            <Text style={s.logoText}>TARISIRA</Text>
            {tab !== 'home' && <Text style={s.pageTitle}>{title}</Text>}
          </View>
          <Pressable style={s.gear} onPress={() => setSettings(true)}><Icon name="cog-outline" size={20} color="#fff" /></Pressable>
        </View>
      </SafeAreaView>

      {tab === 'home' && <Home name={name} greet={greet} today={today} txCount={txs.length} debtTotal={debtTotal} debtCount={debtors.length}
        products={products.length} lowCount={lowCount} go={setTab} openSale={() => setModal('sale')} />}
      {tab === 'stock' && <StockTab products={products} lowCount={lowCount} onAdd={() => setModal('product')} />}
      {tab === 'sales' && <SalesTab today={today} week={595 + today} month={2325 + today} txs={txs} onSale={() => setModal('sale')} />}
      {tab === 'debtors' && <DebtorsTab debtors={debtors} total={debtTotal} onAdd={() => setModal('debtor')} onPaid={(id) => setDebtors(debtors.filter((d) => d.id !== id))} />}
      {tab === 'reports' && <ReportsTab month={2325 + today} stockValue={stockValue} debtTotal={debtTotal} count={products.length} cats={cats} />}

      {modal === 'sale' && <SaleForm products={products} onSave={saveSale} onClose={() => setModal(null)} />}
      {modal === 'product' && <ProductForm onClose={() => setModal(null)} onSave={(p) => { setProducts([...products, { ...p, id: Date.now() }]); setModal(null); }} />}
      {modal === 'debtor' && <DebtorForm onClose={() => setModal(null)} onSave={(d) => { setDebtors([...debtors, { ...d, id: Date.now() }]); setModal(null); }} />}

      <SafeAreaView style={{ backgroundColor: '#fff' }}>
        <View style={s.tabBar}>
          {TABS.map(([k, icon, label]) => (
            <Pressable key={k} style={s.tab} onPress={() => setTab(k)}>
              <Icon name={icon} size={20} color={tab === k ? C.dark : C.muted} />
              <Text style={[s.tabLabel, tab === k && { color: C.dark, fontWeight: '800' }]}>{label}</Text>
              {tab === k && <View style={s.tabDot} />}
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: SERIF, fontSize: 26, fontWeight: '800', color: C.ink },
  muted: { color: C.muted, fontSize: 13 },
  label: { color: C.dark, fontWeight: '700', fontSize: 13, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: C.ink },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  smallLogo: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#0B7A50', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: SERIF, fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  pageTitle: { color: '#fff', fontWeight: '800', fontSize: 17, marginLeft: 14 },
  gear: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#1F7A57', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 7, padding: 18, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: C.ink },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  stat: { width: '48%', minHeight: 120, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 7, padding: 16 },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontFamily: SERIF, fontSize: 30, fontWeight: '800', color: C.dark, marginTop: 8 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 6 },
  weekLabel: { color: C.muted, fontSize: 12 },
  bars: { flexDirection: 'row', marginTop: 16, alignItems: 'flex-end' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  action: { flex: 1, paddingVertical: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  actionSm: { paddingVertical: 14, backgroundColor: '#F7FBF9', borderColor: C.line },
  actionText: { fontWeight: '800', fontSize: 15, color: C.dark },
  iconText: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  btn: { backgroundColor: C.dark, borderRadius: 14, paddingVertical: 17, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  addBtn: { backgroundColor: C.dark, borderRadius: 16, paddingHorizontal: 18, justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 16, paddingHorizontal: 14 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: C.ink },
  alertBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FDECEC', borderWidth: 1, borderColor: '#F7C9C9', borderRadius: 14, padding: 14, marginVertical: 14 },
  alertText: { color: '#B42318', fontWeight: '600' },
  itemName: { fontSize: 17, fontWeight: '800', color: C.ink, marginBottom: 4 },
  qty: { fontFamily: SERIF, fontSize: 22, fontWeight: '800', color: C.dark },
  badge: { backgroundColor: C.mint, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { color: C.dark, fontWeight: '800', fontSize: 12 },
  empty: { textAlign: 'center', color: C.muted, marginTop: 24 },
  txRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  debtHero: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B6B45', borderRadius: 7, padding: 20 },
  heroAmt: { fontFamily: SERIF, fontSize: 38, fontWeight: '800', color: '#fff', marginVertical: 6 },
  heroAdd: { backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12 },
  avatar: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F6F3', alignItems: 'center', justifyContent: 'center' },
  chev: { color: '#B5C7BD', fontSize: 24 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, paddingBottom: 4 },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  tabLabel: { fontSize: 11, color: C.muted },
  tabDot: { width: 22, height: 2, borderRadius: 1, backgroundColor: C.dark, marginTop: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  sheetTitle: { fontFamily: SERIF, fontSize: 22, fontWeight: '800', color: C.ink, marginBottom: 14 },
  pick: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 14, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  pickOn: { backgroundColor: C.mint, borderColor: C.green },
  pickName: { fontWeight: '700', color: C.ink },
  total: { fontFamily: SERIF, fontSize: 22, fontWeight: '800', color: C.dark, marginBottom: 14 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#fff', padding: 20 },
  bigLogo: { width: 68, height: 68, borderRadius: 18, backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center' },
  profName: { fontSize: 19, fontWeight: '800', color: C.ink, marginBottom: 2 },
  group: { backgroundColor: '#fff', marginTop: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EAF3EE' },
  setLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: C.ink },
});
