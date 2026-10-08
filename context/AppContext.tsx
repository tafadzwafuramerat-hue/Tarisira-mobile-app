import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Lang, STR, Strings } from '../constants/strings';
import { supabase, supabaseConfigured } from '../lib/supabase';

export type StockEvent = { id: string | number; label: string; delta: number; date: string };
export type Product = {
  id: string | number; name: string; cat: string; price: number; cost: number;
  qty: number; reorderAt: number; history: StockEvent[];
};

export type PaymentEvent = { id: string | number; label: string; sub: string; amount: number; date: string };
export type Debtor = { id: string | number; name: string; phone: string; amount: number; days: number; history: PaymentEvent[] };

export type Tx = { id: string | number; name: string; cat: string; qty: number; total: number; time: string; date: string; customer?: string; method: string };

export type Reminder = { id: string | number; debtorId: string | number; debtorName: string; amount: number; sendOn: 'Today' | 'Tomorrow' | 'Custom'; createdLabel: string };

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
  businessId: string | null; createBusiness: () => Promise<string | null>;
  signIn: (identifier: string, password: string) => Promise<boolean>;
  signUp: (details: { email: string; phone: string; password: string; name: string }) => Promise<void>;
  signOut: () => Promise<void>;

  products: Product[]; addProduct: (p: { name: string; cat: string; price: number; qty: number }) => Promise<void>;
  adjustStock: (id: string | number, delta: number, label: string) => Promise<void>;

  debtors: Debtor[]; addDebtor: (d: { name: string; amount: number; days: number; phone?: string }) => Promise<void>;
  markPaid: (id: string | number) => void; recordPayment: (id: string | number, amount: number) => Promise<void>;

  reminders: Reminder[]; addReminder: (r: Omit<Reminder, 'id' | 'createdLabel'>) => Promise<void>;

  txs: Tx[]; recordSale: (p: Product, qty: number, customer: string, method: string) => Promise<void>;

  today: number; debtTotal: number; lowCount: number; stockValue: number; cats: [string, number][];
};

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(supabaseConfigured);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [form, setFormState] = useState<Form>({
    name: '', phone: '', email: '', password: '', agree: false,
    bizName: '', bizType: 'Tuckshop', location: '', bizPhone: '',
    size: '1', currencies: ['USD'],
  });
  const [products, setProducts] = useState<Product[]>(supabaseConfigured ? [] : START_PRODUCTS);
  const [debtors, setDebtors] = useState<Debtor[]>(supabaseConfigured ? [] : START_DEBTORS);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let alive = true;
    client.auth.getSession().then(({ data, error }) => {
      if (error) console.warn('Could not restore Supabase session:', error.message);
      if (alive) {
        setSession(data.session);
        setAuthLoading(false);
      }
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client || !session?.user.id) {
      setLoadedUserId(null);
      setBusinessId(null);
      if (supabaseConfigured && !session) {
        setFormState({ name: '', phone: '', email: '', password: '', agree: false, bizName: '', bizType: 'Tuckshop', location: '', bizPhone: '', size: '1', currencies: ['USD'] });
        setProducts([]);
        setDebtors([]);
        setTxs([]);
        setReminders([]);
      }
      return;
    }
    let alive = true;
    const userId = session.user.id;
    const load = async () => {
      setAuthLoading(true);
      const [{ data: preference, error }, { data: membership, error: membershipError }] = await Promise.all([
        client.from('app_state').select('data').eq('user_id', userId).maybeSingle(),
        client.from('business_members').select('business_id').eq('user_id', userId).order('created_at', { ascending: true }).limit(1).maybeSingle(),
      ]);
      if (!alive) return;
      if (error) console.warn('Could not load language preference:', error.message);
      const savedPreference = preference?.data as { lang?: Lang } | undefined;
      if (savedPreference?.lang) setLang(savedPreference.lang);
      if (membershipError) console.warn('Could not load business membership:', membershipError.message);
      setProducts([]);
      setDebtors([]);
      setTxs([]);
      setReminders([]);
      const nextBusinessId = membership?.business_id ?? null;
      setBusinessId(nextBusinessId);
      if (!nextBusinessId) {
        const metadata = session.user.user_metadata ?? {};
        setFormState((current) => ({
          ...current,
          name: typeof metadata.full_name === 'string' ? metadata.full_name : current.name,
          phone: typeof metadata.phone === 'string' ? metadata.phone : current.phone,
          password: '',
        }));
      } else {
        const { data: business, error: businessError } = await client.from('businesses')
          .select('name,business_type,location,phone,currency_codes')
          .eq('id', nextBusinessId)
          .single();
        if (!alive) return;
        if (businessError) {
          console.warn('Could not load business profile:', businessError.message);
        } else {
          setFormState((current) => ({
            ...current,
            bizName: business.name,
            bizType: business.business_type ?? current.bizType,
            location: business.location ?? '',
            bizPhone: business.phone ?? '',
            currencies: business.currency_codes ?? ['USD'],
            password: '',
          }));
        }
      }
      setLoadedUserId(userId);
      setAuthLoading(false);
    };
    void load();
    return () => { alive = false; };
  }, [session?.user.id]);

  useEffect(() => {
    const client = supabase;
    if (!client || !businessId || !session?.user.id) return;
    let alive = true;
    const loadBusinessData = async () => {
      setAuthLoading(true);
      const [productResult, movementResult, debtorResult, paymentResult, saleResult, saleItemResult, reminderResult] = await Promise.all([
        client.from('products').select('*').eq('business_id', businessId),
        client.from('stock_movements').select('*').eq('business_id', businessId).order('created_at', { ascending: false }),
        client.from('debtors').select('*').eq('business_id', businessId),
        client.from('debtor_payments').select('*').eq('business_id', businessId).order('paid_at', { ascending: false }),
        client.from('sales').select('*').eq('business_id', businessId).order('sold_at', { ascending: false }),
        client.from('sale_items').select('*').eq('business_id', businessId),
        client.from('reminders').select('*, debtors(name,current_balance)').eq('business_id', businessId).order('scheduled_for', { ascending: true }),
      ]);
      if (!alive) return;
      const errors = [productResult.error, movementResult.error, debtorResult.error, paymentResult.error, saleResult.error, saleItemResult.error, reminderResult.error].filter(Boolean);
      if (errors.length) {
        console.warn('Could not load normalized business data:', errors.map((error) => error?.message).join('; '));
        setAuthLoading(false);
        return;
      }
      const movements = movementResult.data ?? [];
      setProducts((productResult.data ?? []).map((row) => ({
        id: row.id, name: row.name, cat: row.category, price: Number(row.price), cost: Number(row.cost),
        qty: row.quantity, reorderAt: row.reorder_at,
        history: movements.filter((movement) => movement.product_id === row.id).map((movement) => ({
          id: movement.id, label: movement.label, delta: movement.delta, date: movement.occurred_at,
        })),
      })));
      const payments = paymentResult.data ?? [];
      setDebtors((debtorResult.data ?? []).map((row) => ({
        id: row.id, name: row.name, phone: row.phone ?? '', amount: Number(row.current_balance), days: row.due_in_days,
        history: payments.filter((payment) => payment.debtor_id === row.id).map((payment) => ({
          id: payment.id, label: 'Payment received', sub: payment.note ?? '', amount: -Number(payment.amount), date: new Date(payment.paid_at).toLocaleDateString('en', { day: '2-digit', month: 'short' }),
        })),
      })));
      const items = saleItemResult.data ?? [];
      setTxs((saleResult.data ?? []).flatMap((sale) => items.filter((item) => item.sale_id === sale.id).map((item) => ({
        id: item.id, name: item.product_name, cat: item.category, qty: item.quantity, total: Number(item.line_total),
        time: new Date(sale.sold_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        date: sale.sold_at, customer: sale.customer_name ?? undefined, method: sale.payment_method,
      }))));
      setReminders((reminderResult.data ?? []).map((row) => ({
        id: row.id, debtorId: row.debtor_id, debtorName: row.debtors?.name ?? '', amount: Number(row.debtors?.current_balance ?? 0),
        sendOn: new Date(row.scheduled_for).toDateString() === new Date().toDateString() ? 'Today' : 'Tomorrow',
        createdLabel: new Date(row.created_at).toLocaleDateString('en', { day: '2-digit', month: 'short' }),
      })));
      setAuthLoading(false);
    };
    void loadBusinessData();
    return () => { alive = false; };
  }, [businessId, session?.user.id]);

  const createBusiness = useCallback(async () => {
    if (!supabase || !session?.user.id) return null;
    if (businessId) return businessId;
    const { data, error } = await supabase.rpc('create_business', {
      business_name: form.bizName,
      business_type: form.bizType,
      business_location: form.location,
      business_phone: form.bizPhone || form.phone,
      currencies: form.currencies,
    });
    if (error) throw error;
    const id = data as string;
    setBusinessId(id);
    return id;
  }, [businessId, form, session?.user.id]);

  const signIn = useCallback(async (identifier: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured. Add the project URL and publishable key to your .env file.');
    const credential = identifier.trim();
    const result = credential.includes('@')
      ? await supabase.auth.signInWithPassword({ email: credential, password })
      : await supabase.auth.signInWithPassword({ phone: credential, password });
    if (result.error) throw result.error;
    const userId = result.data.user.id;
    const { data: membership, error: membershipError } = await supabase
      .from('business_members').select('business_id').eq('user_id', userId).limit(1).maybeSingle();
    if (membershipError) throw membershipError;
    return Boolean(membership?.business_id);
  }, []);

  const signUp = useCallback(async ({ email, phone, password, name }: { email: string; phone: string; password: string; name: string }) => {
    if (!supabase) throw new Error('Supabase is not configured. Add the project URL and publishable key to your .env file.');
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const result = cleanEmail
      ? await supabase.auth.signUp({ email: cleanEmail, password, options: { data: { full_name: name, phone: cleanPhone } } })
      : await supabase.auth.signUp({ phone: cleanPhone, password, options: { data: { full_name: name } } });
    if (result.error) throw result.error;
    if (result.data.user && !result.data.session) {
      throw new Error('Account created. Verify your email or phone, then sign in to continue setup.');
    }
    if (result.data.user && result.data.session) {
      await supabase.from('app_state').upsert({
        user_id: result.data.user.id,
        data: { lang },
      });
    }
  }, [form, lang]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setFormState({ name: '', phone: '', email: '', password: '', agree: false, bizName: '', bizType: 'Tuckshop', location: '', bizPhone: '', size: '1', currencies: ['USD'] });
    setBusinessId(null);
    setProducts(supabaseConfigured ? [] : START_PRODUCTS);
    setDebtors(supabaseConfigured ? [] : START_DEBTORS);
    setTxs([]);
    setReminders([]);
    setLoadedUserId(null);
  }, []);

  const appState = useMemo(() => ({ lang }), [lang]);
  useEffect(() => {
    const client = supabase;
    if (!client || !session?.user.id || loadedUserId !== session.user.id) return;
    const timeout = setTimeout(() => {
      void client.from('app_state').upsert({
        user_id: session.user.id,
        data: { lang: appState.lang },
        updated_at: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) console.warn('Could not save language preference:', error.message);
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [appState.lang, loadedUserId, session?.user.id]);

  useEffect(() => {
    const client = supabase;
    if (!client || !businessId || !session?.user.id || loadedUserId !== session.user.id) return;
    const timeout = setTimeout(() => {
      void client.from('businesses').update({
        name: form.bizName,
        business_type: form.bizType,
        location: form.location,
        phone: form.bizPhone || form.phone || null,
        currency_codes: form.currencies,
        updated_at: new Date().toISOString(),
      }).eq('id', businessId).then(({ error }) => {
        if (error) console.warn('Could not save business profile:', error.message);
      });
    }, 700);
    return () => clearTimeout(timeout);
  }, [businessId, form.bizName, form.bizType, form.location, form.bizPhone, form.phone, form.currencies, loadedUserId, session?.user.id]);

  const value = useMemo<Ctx>(() => {
    const cats = { ...BASE_CATS };
    txs.forEach((x) => { cats[x.cat] = (cats[x.cat] || 0) + x.total; });

    const requireBusiness = () => {
      if (supabaseConfigured && !session) {
        throw new Error('Sign in before adding business data.');
      }
      if (supabaseConfigured && !businessId) {
        throw new Error('Finish business setup before adding business data.');
      }
    };

    return {
      lang, setLang, t: STR[lang],
      session, authLoading, backendConfigured: supabaseConfigured, businessId, createBusiness, signIn, signUp, signOut,
      form, setForm: (patch) => setFormState((current) => ({ ...current, ...patch })),

      products,
      addProduct: async (product) => {
        requireBusiness();
        const client = supabase;
        if (client && businessId) {
          const { data, error } = await client.from('products').insert({
            business_id: businessId, name: product.name, category: product.cat, price: product.price,
            cost: Math.round(product.price * 0.7 * 100) / 100, quantity: product.qty, reorder_at: 10,
          }).select('*').single();
          if (error) throw error;
          const history: StockEvent[] = [];
          if (product.qty > 0) {
            const { data: movement, error: movementError } = await client.from('stock_movements').insert({
              business_id: businessId, product_id: data.id, label: 'Initial stock', delta: product.qty,
            }).select('*').single();
            if (movementError) throw movementError;
            history.push({ id: movement.id, label: movement.label, delta: movement.delta, date: movement.occurred_at });
          }
          setProducts((list) => [...list, { id: data.id, name: data.name, cat: data.category, price: Number(data.price), cost: Number(data.cost), qty: data.quantity, reorderAt: data.reorder_at, history }]);
          return;
        }
        setProducts((list) => [...list, {
          ...product, id: Date.now(), cost: Math.round(product.price * 0.7 * 100) / 100, reorderAt: 10,
          history: product.qty > 0 ? [{ id: Date.now(), label: 'Initial stock', delta: product.qty, date: today() }] : [],
        }]);
      },
      adjustStock: async (id, delta, label) => {
        requireBusiness();
        const current = products.find((product) => String(product.id) === String(id));
        if (!current) return;
        const nextQuantity = Math.max(0, current.qty + delta);
        const client = supabase;
        let stockEventId: string | number = Date.now();
        let date = today();
        if (client && businessId && typeof id === 'string') {
          const { data, error } = await client.rpc('adjust_business_stock', {
            target_business_id: businessId, target_product_id: id, stock_delta: delta, movement_label: label,
          });
          if (error) throw error;
          stockEventId = data as string;
        }
        setProducts((list) => list.map((product) => String(product.id) === String(id)
          ? { ...product, qty: nextQuantity, history: [{ id: stockEventId, label, delta, date }, ...product.history] }
          : product));
      },

      debtors,
      addDebtor: async (debtor) => {
        requireBusiness();
        const client = supabase;
        if (client && businessId) {
          const { data, error } = await client.from('debtors').insert({
            business_id: businessId, name: debtor.name, phone: debtor.phone || null,
            opening_balance: debtor.amount, current_balance: debtor.amount, due_in_days: debtor.days,
          }).select('*').single();
          if (error) throw error;
          setDebtors((list) => [...list, { id: data.id, name: data.name, phone: data.phone ?? '', amount: Number(data.current_balance), days: data.due_in_days, history: [{ id: data.id, label: 'Debt recorded', sub: 'Initial amount', amount: Number(data.opening_balance), date: today() }] }]);
          return;
        }
        setDebtors((list) => [...list, {
          id: Date.now(), name: debtor.name, phone: debtor.phone || '+263 77 000 0000', amount: debtor.amount, days: debtor.days,
          history: [{ id: Date.now(), label: 'Debt recorded', sub: 'Initial amount', amount: debtor.amount, date: today() }],
        }]);
      },
      markPaid: (id) => {
        setDebtors((list) => list.filter((debtor) => String(debtor.id) !== String(id)));
        const client = supabase;
        if (client && businessId && typeof id === 'string') void client.from('debtors').delete().eq('business_id', businessId).eq('id', id);
      },
      recordPayment: async (id, amount) => {
        requireBusiness();
        const debtor = debtors.find((item) => String(item.id) === String(id));
        if (!debtor) return;
        const payment = Math.min(amount, debtor.amount);
        const client = supabase;
        let paymentEventId: string | number = Date.now();
        if (client && businessId && typeof id === 'string') {
          const { data, error } = await client.rpc('record_debtor_payment', {
            target_business_id: businessId, target_debtor_id: id, payment_amount: payment, payment_note: 'Recorded payment', method: 'Cash',
          });
          if (error) throw error;
          paymentEventId = data as string;
        }
        setDebtors((list) => list.map((item) => String(item.id) === String(id)
          ? { ...item, amount: Math.max(0, item.amount - payment), history: [{ id: paymentEventId, label: 'Payment received', sub: 'Recorded payment', amount: -payment, date: today() }, ...item.history] }
          : item).filter((item) => item.amount > 0));
      },

      reminders,
      addReminder: async (reminder) => {
        requireBusiness();
        const client = supabase;
        if (client && businessId && typeof reminder.debtorId === 'string') {
          const scheduled = new Date();
          if (reminder.sendOn === 'Tomorrow') scheduled.setDate(scheduled.getDate() + 1);
          if (reminder.sendOn === 'Custom') scheduled.setDate(scheduled.getDate() + 7);
          const { data, error } = await client.from('reminders').insert({
            business_id: businessId, debtor_id: reminder.debtorId,
            message: `Reminder for ${reminder.debtorName}: $${reminder.amount}`, scheduled_for: scheduled.toISOString(),
          }).select('*').single();
          if (error) throw error;
          setReminders((list) => [{ id: data.id, debtorId: data.debtor_id, debtorName: reminder.debtorName, amount: reminder.amount, sendOn: reminder.sendOn, createdLabel: today() }, ...list]);
          return;
        }
        setReminders((list) => [{ ...reminder, id: Date.now(), createdLabel: today() }, ...list]);
      },

      txs,
      recordSale: async (product, qty, customer, method) => {
        requireBusiness();
        const total = Math.round(product.price * qty * 100) / 100;
        const client = supabase;
        if (client && businessId && typeof product.id === 'string') {
          const { data, error } = await client.rpc('record_business_sale', {
            target_business_id: businessId, target_product_id: product.id, sold_quantity: qty, customer, method,
          });
          if (error) throw error;
          const saleId = data as string;
          const soldAt = new Date().toISOString();
          const [{ data: savedSale, error: saleError }, { data: savedItem, error: itemError }] = await Promise.all([
            client.from('sales').select('sold_at').eq('business_id', businessId).eq('id', saleId).single(),
            client.from('sale_items').select('id,line_total').eq('business_id', businessId).eq('sale_id', saleId).single(),
          ]);
          if (saleError) throw saleError;
          if (itemError) throw itemError;
          const date = savedSale.sold_at ?? soldAt;
          const savedTotal = Number(savedItem.line_total ?? total);
          setProducts((list) => list.map((item) => String(item.id) === String(product.id)
            ? { ...item, qty: item.qty - qty, history: [{ id: savedItem.id, label: 'Sale', delta: -qty, date: today() }, ...item.history] }
            : item));
          setTxs((list) => [{ id: savedItem.id, name: product.name, cat: product.cat, qty, total: savedTotal, customer, method, date, time: new Date(date).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) }, ...list]);
          return;
        }
        setProducts((list) => list.map((item) => (item.id === product.id
          ? { ...item, qty: item.qty - qty, history: [{ id: Date.now(), label: 'Sale', delta: -qty, date: today() }, ...item.history] }
          : item)));
        setTxs((list) => [{ id: Date.now(), name: product.name, cat: product.cat, qty, total, customer, method, date: new Date().toISOString(), time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) }, ...list]);
      },

      today: txs.reduce((sum, sale) => sum + sale.total, 0),
      debtTotal: debtors.reduce((sum, debtor) => sum + debtor.amount, 0),
      lowCount: products.filter((product) => product.qty <= product.reorderAt).length,
      stockValue: products.reduce((sum, product) => sum + product.qty * product.price, 0),
      cats: Object.entries(cats).map(([key, amount]) => [key, Math.round(amount * 100) / 100] as [string, number]),
    };
  }, [lang, form, products, debtors, txs, reminders, session, authLoading, businessId, createBusiness, signIn, signUp, signOut]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
