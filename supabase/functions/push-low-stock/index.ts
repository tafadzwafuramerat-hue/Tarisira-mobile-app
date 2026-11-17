// Supabase Edge Function: push-low-stock
// Sends push notifications for low-stock items when the app is closed.
// Deploy: supabase functions deploy push-low-stock
// Secret: SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

type Row = {
  id: string;
  name: string;
  quantity: number;
  reorder_at: number;
  business_id: string;
};

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!);

    const { data, error } = await supabase
      .from('products')
      .select('id, name, quantity, reorder_at, business_id');

    if (error) throw error;

    const low = (data ?? []).filter(
      (p: Row) => Number(p.quantity) <= Number(p.reorder_at),
    );

    if (low.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const byBusiness = new Map<string, { name: string; qty: number }[]>();
    for (const p of low as Row[]) {
      const list = byBusiness.get(p.business_id) ?? [];
      list.push({ name: p.name, qty: Number(p.quantity) });
      byBusiness.set(p.business_id, list);
    }

    let sent = 0;
    for (const [businessId, items] of byBusiness) {
      const { data: appStateRows } = await supabase
        .from('app_state')
        .select('data')
        .filter('data->>business_id', 'eq', businessId);

      const tokens = new Set<string>();
      for (const row of appStateRows ?? []) {
        const token = (row as { data?: { pushToken?: string } })?.data?.pushToken;
        if (token) tokens.add(token);
      }

      for (const token of tokens) {
        for (const item of items) {
          try {
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: token,
                title: 'Tarisira — Low Stock Alert',
                body: `${item.name} is running low (${item.qty} left).`,
                data: { type: 'lowStock', businessId },
              }),
            });
            sent++;
          } catch {
            // ignore individual failures
          }
        }
      }
    }

    return new Response(JSON.stringify({ sent }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});