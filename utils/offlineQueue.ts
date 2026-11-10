import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { supabase, supabaseConfigured } from '../lib/supabase';

const QUEUE_KEY = 'tarisira_offline_queue_v1';

export type OfflineAction =
  | { type: 'recordSale'; payload: { productId: string; qty: number; customer: string; method: string; price: number; name: string; cat: string } }
  | { type: 'adjustStock'; payload: { productId: string; delta: number; label: string } }
  | { type: 'addDebtor'; payload: { name: string; amount: number; days: number; phone?: string; item?: string } }
  | { type: 'recordPayment'; payload: { debtorId: string; amount: number } };

export type QueueEntry = {
  id: string;
  createdAt: number;
  attempts: number;
  action: OfflineAction;
};

function storage() {
  if (Platform.OS === 'web') return globalThis.localStorage;
  return {
    getItem: (k: string) => SecureStore.getItemAsync(k),
    setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
    removeItem: (k: string) => SecureStore.deleteItemAsync(k),
  };
}

export async function enqueue(action: OfflineAction): Promise<QueueEntry> {
  const entry: QueueEntry = { id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, createdAt: Date.now(), attempts: 0, action };
  const s = storage();
  const raw = await s.getItem(QUEUE_KEY);
  const list: QueueEntry[] = raw ? JSON.parse(raw) : [];
  list.push(entry);
  await s.setItem(QUEUE_KEY, JSON.stringify(list));
  return entry;
}

export async function dequeue(id: string): Promise<void> {
  const s = storage();
  const raw = await s.getItem(QUEUE_KEY);
  if (!raw) return;
  const list: QueueEntry[] = JSON.parse(raw).filter((entry: QueueEntry) => entry.id !== id);
  await s.setItem(QUEUE_KEY, JSON.stringify(list));
}

export async function getQueue(): Promise<QueueEntry[]> {
  const s = storage();
  const raw = await s.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function clearQueue(): Promise<void> {
  const s = storage();
  await s.setItem(QUEUE_KEY, JSON.stringify([]));
}

export async function isOnline(): Promise<boolean> {
  if (!supabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('business_members').select('business_id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function syncQueue(businessId: string): Promise<{ synced: number; failed: number }> {
  const queue = await getQueue();
  let synced = 0;
  let failed = 0;
  for (const entry of queue) {
    try {
      if (entry.action.type === 'recordSale') {
        const p = entry.action.payload;
        const { error } = await supabase!.rpc('record_business_sale', {
          target_business_id: businessId, target_product_id: p.productId, sold_quantity: p.qty, customer: p.customer, method: p.method,
        });
        if (error) throw error;
      } else if (entry.action.type === 'adjustStock') {
        const p = entry.action.payload;
        const { error } = await supabase!.rpc('adjust_business_stock', {
          target_business_id: businessId, target_product_id: p.productId, stock_delta: p.delta, movement_label: p.label,
        });
        if (error) throw error;
      } else if (entry.action.type === 'addDebtor') {
        const p = entry.action.payload;
        const { error } = await supabase!.from('debtors').insert({
          business_id: businessId, name: p.name, phone: p.phone || null, item_owed: p.item || null,
          opening_balance: p.amount, current_balance: p.amount, due_in_days: p.days,
        });
        if (error) throw error;
      } else if (entry.action.type === 'recordPayment') {
        const p = entry.action.payload;
        const { error } = await supabase!.rpc('record_debtor_payment', {
          target_business_id: businessId, target_debtor_id: p.debtorId, payment_amount: p.amount,
        });
        if (error) throw error;
      }
      await dequeue(entry.id);
      synced++;
    } catch (err) {
      failed++;
    }
  }
  return { synced, failed };
}

export function startAutoSync(
  businessId: string,
  onSync?: (result: { synced: number; failed: number }) => void
): ReturnType<typeof setInterval> {
  return setInterval(async () => {
    const online = await isOnline();
    if (!online) return;
    const result = await syncQueue(businessId);
    if (result.synced > 0 || result.failed > 0) onSync?.(result);
  }, 30000);
}