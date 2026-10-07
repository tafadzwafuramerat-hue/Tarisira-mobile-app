import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Lang, STR, Strings } from '../constants/strings';
import { supabase, supabaseConfigured } from '../lib/supabase';

export type StockEvent = { id: number; label: string; delta: number; date: string };
export type Product = {
  id: number; name: string; cat: string; price: number; cost: number;
  qty: number; reorderAt: number; history: StockEvent[];
};

export type PaymentEvent = { id: number; label: string; sub: string; amount: number; date: string };
export type Debtor = { id: number; name: string; phone: string; amount: number; days: number; history: PaymentEvent[] };

export type Tx = { id: number; name: string; cat: string; qty: number; total: number; time: string; date: string; customer?: string; method: string };

export type Reminder = { id: number; debtorId: number; debtorName: string; amount: number; sendOn: 'Today' | 'Tomorrow' | 'Custom'; createdLabel: string };

export type Form = {
  name: string; phone: string; email: string; password: string; agree: boolean;
  bizName: string; bizType: string; location: string; bizPhone: string;
  size: string; currencies: string[];
};

const today = (d = 0) => {
  const t = new Date(); t.setDate(t.getDate() - d);
  return t.toLocaleDateString('en', { day: '2-digit', month: 'short' });
};

const BASE_CATS: Record<string, number> = { Beverages: 85, Bakery: 10, Dairy: 8, Groceries: 96 };

const START_PRODUCTS: Product[] = [
  { id: 1, name: 'Coca-Cola', cat: 'Beverages', price: 1, cost: 0.7, qty: 85, reorderAt: 20, history: [{ id: 1, label: 'Restock', delta: 100, date: today(10) }] },
  {
    id: 2, name: 'Bread', cat: 'Bakery', price: 1.2, cost: 0.8, qty: 8, reorderAt: 15,
    history: [{ id: 1, label: 'Restock', delta: 20, date: today(6) }, { id: 2, label: 'Sale', delta: -12, date: today(2) }],
  },
  {
    id: 3, name: 'Milk 1L', cat: 'Dairy', price: 1.5, cost: 1.0, qty: 5, reorderAt: 10,
    history: [
      { id: 1, label: 'Restock', delta: 100, date: today(7) },
      { id: 2, label: 'Sale', delta: -10, date: today(4) },
      { id: 3, label: 'Sale', delta: -5, date: today(5) },
      { id: 4, label: 'Restock', delta: 50, date: today(1) },
    ],
  },
  { id: 4, name: 'Sugar 2kg', cat: 'Groceries', price: 2.5, cost: 1.8, qty: 24, reorderAt: 10, history: [{ id: 1, label: 'Restock', delta: 30, date: today(8) }] },
  { id: 5, name: 'Cooking Oil', cat: 'Groceries', price: 3, cost: 2.2, qty: 12, reorderAt: 10, history: [{ id: 1, label: 'Restock', delta: 15, date: today(9) }] },
  { id: 6, name: 'Maize Meal', cat: 'Groceries', price: 4, cost: 3, qty: 30, reorderAt: 10, history: [{ id: 1, label: 'Restock', delta: 40, date: today(12) }] },
];

const START_DEBTORS: Debtor[] = [
  { id: 1, name: 'John Moyo', phone: '+263 77 111 2222', amount: 20, days: 2, history: [{ id: 1, label: 'Debt recorded', sub: 'Initial amount', amount: 20, date: today(3) }] },
  { id: 2, name: 'Mary Chikwanda', phone: '+263 77 222 3333', amount: 15, days: 5, history: [{ id: 1, label: 'Debt recorded', sub: 'Initial amount', amount: 15, date: today(1) }] },
  { id: 3, name: 'Peter Dube', phone: '+263 77 333 4444', amount: 35, days: 1, history: [{ id: 1, label: 'Debt recorded', sub: 'Initial amount', amount: 35, date: today(4) }] },
];

type Ctx = {
  lang: Lang; setLang: (l: Lang) => void; t: Strings;
  form: Form; setForm: (patch: Partial<Form>) => void;
  session: Session | null; authLoading: boolean; backendConfigured: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (details: { email: string; phone: string; password: string; name: string }) => Promise<void>;
  signOut: () => Promise<void>;

  products: Product[]; addProduct: (p: { name: string; cat: string; price: number; qty: number }) => void;
  adjustStock: (id: number, delta: number, label: string) => void;

  debtors: Debtor[]; addDebtor: (d: { name: string; amount: number; days: number; phone?: string }) => void;
  markPaid: (id: number) => void; recordPayment: (id: number, amount: number) => void;

  reminders: Reminder[]; addReminder: (r: Omit<Reminder, 'id' | 'createdLabel'>) => void;

  txs: Tx[]; recordSale: (p: Product, qty: number, customer: string, method: string) => void;

  today: number; debtTotal: number; lowCount: number; stockValue: number; cats: [string, number][];
};

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(supabaseConfigured);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [form, setFormState] = useState<Form>({
    name: '', phone: '', email: '', password: '', agree: false,
    bizName: '', bizType: 'Tuckshop', location: '', bizPhone: '',
    size: '1', currencies: ['USD'],
  });
  const [products, setProducts] = useState(START_PRODUCTS);
  const [debtors, setDebtors] = useState(START_DEBTORS);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.warn('Could not restore Supabase session:', error.message);
      if (alive) {
        setSession(data.session);
        setAuthLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user.id) {
      setLoadedUserId(null);
      return;
    }
    let alive = true;
    const userId = session.user.id;
    const load = async () => {
      setAuthLoading(true);
      const { data, error } = await supabase.from('app_state').select('data').eq('user_id', userId).maybeSingle();
      if (!alive) return;
      if (error) {
        console.warn('Could not load saved app state:', error.message);
      } else if (data?.data) {
        const saved = data.data as Partial<{ lang: Lang; form: Form; products: Product[]; debtors: Debtor[]; txs: Tx[]; reminders: Reminder[] }>;
        if (saved.lang) setLang(saved.lang);
        if (saved.form) setFormState((current) => ({ ...current, ...saved.form, password: '' }));
        if (saved.products) setProducts(saved.products);
        if (saved.debtors) setDebtors(saved.debtors);
        if (saved.txs) setTxs(saved.txs);
        if (saved.reminders) setReminders(saved.reminders);
      } else {
        const metadata = session.user.user_metadata ?? {};
        setFormState((current) => ({
          ...current,
          name: typeof metadata.full_name === 'string' ? metadata.full_name : current.name,
          phone: typeof metadata.phone === 'string' ? metadata.phone : current.phone,
          password: '',
        }));
        setProducts([]);
        setDebtors([]);
        setTxs([]);
        setReminders([]);
      }
      setLoadedUserId(userId);
      setAuthLoading(false);
    };
    void load();
    return () => { alive = false; };
  }, [session?.user.id]);

  const signIn = useCallback(async (identifier: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured. Add the project URL and publishable key to your .env file.');
    const credential = identifier.trim();
    const result = credential.includes('@')
      ? await supabase.auth.signInWithPassword({ email: credential, password })
      : await supabase.auth.signInWithPassword({ phone: credential, password });
    if (result.error) throw result.error;
  }, []);

  const signUp = useCallback(async ({ email, phone, password, name }: { email: string; phone: string; password: string; name: string }) => {
    if (!supabase) throw new Error('Supabase is not configured. Add the project URL and publishable key to your .env file.');
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const result = cleanEmail
      ? await supabase.auth.signUp({ email: cleanEmail, password, options: { data: { full_name: name, phone: cleanPhone } } })
      : await supabase.auth.signUp({ phone: cleanPhone, password, options: { data: { full_name: name } } });
    if (result.error) throw result.error;
    if (result.data.user && result.data.session) {
      await supabase.from('app_state').upsert({
        user_id: result.data.user.id,
        data: { lang, form: { ...form, name, phone: cleanPhone } },
      });
    }
  }, [form, lang]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setFormState({ name: '', phone: '', email: '', password: '', agree: false, bizName: '', bizType: 'Tuckshop', location: '', bizPhone: '', size: '1', currencies: ['USD'] });
    setProducts(START_PRODUCTS);
    setDebtors(START_DEBTORS);
    setTxs([]);
    setReminders([]);
    setLoadedUserId(null);
  }, []);

  const appState = useMemo(() => ({
    lang,
    form: { ...form, password: '' },
    products,
    debtors,
    txs,
    reminders,
  }), [lang, form, products, debtors, txs, reminders]);
  useEffect(() => {
    if (!supabase || !session?.user.id || loadedUserId !== session.user.id) return;
    const timeout = setTimeout(() => {
      void supabase.from('app_state').upsert({
        user_id: session.user.id,
        data: appState,
        updated_at: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) console.warn('Could not save app state:', error.message);
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [appState, loadedUserId, session?.user.id]);

  const value = useMemo<Ctx>(() => {
    const cats = { ...BASE_CATS };
    txs.forEach((x) => { cats[x.cat] = (cats[x.cat] || 0) + x.total; });

    return {
      lang, setLang, t: STR[lang],
      session, authLoading, backendConfigured: supabaseConfigured, signIn, signUp, signOut,
      form, setForm: (patch) => setFormState((f) => ({ ...f, ...patch })),

      products,
      addProduct: (p) => setProducts((l) => [...l, {
        ...p, id: Date.now(), cost: Math.round(p.price * 0.7 * 100) / 100, reorderAt: 10,
        history: p.qty > 0 ? [{ id: Date.now(), label: 'Initial stock', delta: p.qty, date: today() }] : [],
      }]),
      adjustStock: (id, delta, label) => setProducts((l) => l.map((p) => (p.id === id
        ? { ...p, qty: Math.max(0, p.qty + delta), history: [{ id: Date.now(), label, delta, date: today() }, ...p.history] }
        : p))),

      debtors,
      addDebtor: (d) => setDebtors((l) => [...l, {
        id: Date.now(), name: d.name, phone: d.phone || '+263 77 000 0000', amount: d.amount, days: d.days,
        history: [{ id: Date.now(), label: 'Debt recorded', sub: 'Initial amount', amount: d.amount, date: today() }],
      }]),
      markPaid: (id) => setDebtors((l) => l.filter((d) => d.id !== id)),
      recordPayment: (id, amount) => setDebtors((l) => l
        .map((d) => (d.id === id
          ? { ...d, amount: Math.max(0, d.amount - amount), history: [{ id: Date.now(), label: 'Payment received', sub: 'Recorded payment', amount: -amount, date: today() }, ...d.history] }
          : d))
        .filter((d) => d.amount > 0)),

      reminders,
      addReminder: (r) => setReminders((l) => [{ ...r, id: Date.now(), createdLabel: today() }, ...l]),

      txs,
      recordSale: (p, qty, customer, method) => {
        const total = Math.round(p.price * qty * 100) / 100;
        setProducts((l) => l.map((x) => (x.id === p.id
          ? { ...x, qty: x.qty - qty, history: [{ id: Date.now(), label: 'Sale', delta: -qty, date: today() }, ...x.history] }
          : x)));
        setTxs((l) => [{
          id: Date.now(), name: p.name, cat: p.cat, qty, total, customer, method,
          date: new Date().toISOString(),
          time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        }, ...l]);
      },

      today: txs.reduce((a, x) => a + x.total, 0),
      debtTotal: debtors.reduce((a, d) => a + d.amount, 0),
      lowCount: products.filter((p) => p.qty <= p.reorderAt).length,
      stockValue: products.reduce((a, p) => a + p.qty * p.price, 0),
      cats: Object.entries(cats).map(([k, v]) => [k, Math.round(v * 100) / 100] as [string, number]),
    };
  }, [lang, form, products, debtors, txs, reminders]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
