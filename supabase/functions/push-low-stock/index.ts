// Supabase Edge Function: push-low-stock
// Sends push notifications for low-stock items when the app is closed.
// Deploy: supabase functions deploy push-low-stock
// Secret: EXPO_PUSH_PROJECT_ID (optional), EXPO_TOKEN (optional)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

    // Find products at or below reorder threshold
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, quantity, reorder_at, business_id')
      .lte('quantity', supabase.sql`reorder_at`);

    if (error) throw error;
    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Group by business
    const byBusiness = new Map<string, { name: string; qty: number }[]>();
    for (const p of products) {
      const list = byBusiness.get(p.business_id) || [];
      list.push({ name: p.name, qty: p.quantity });
      byBusiness.set(p.business_id, list);
    }

    let sent = 0;
    for (const [businessId, items] of byBusiness) {
      // Get push tokens for this business
      const { data: appStateRows } = await supabase
        .from('app_state')
        .select('data')
        .eq('data->>business_id', businessId);

      const tokens = new Set<string>();
      for (const row of appStateRows || []) {
        const token = row?.data?.pushToken;
        if (token) tokens.add(token);
      }

      for (const token of tokens) {
        for (const item of items) {
          try {
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('EXPO_PUSH_TOKEN') || ''}`,
              },
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

    return new Response(JSON.stringify({ sent }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});