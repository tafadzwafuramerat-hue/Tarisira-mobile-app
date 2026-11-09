// Supabase Edge Function: paynow-webhook
// Receives Paynow status updates and marks subscriptions as paid/failed.
// Deploy with: supabase functions deploy paynow-webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PAYNOW_MERCHANT_KEY = Deno.env.get('PAYNOW_MERCHANT_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

async function hashData(data: Record<string, string>, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const message = Object.keys(data).sort().map(k => `${k}=${data[k]}`).join('&');
  const msgData = encoder.encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  try {
    const formData = await req.formData();
    const fields: Record<string, string> = {};
    for (const [k, v] of formData.entries()) fields[k] = String(v);

    const { reference, status, amount, paynowreference, hash } = fields;
    if (!reference || !status) {
      return new Response('Missing fields', { status: 400 });
    }

    // Verify hash signature
    const { hash: _, ...data } = fields;
    const expectedHash = await hashData(data, PAYNOW_MERCHANT_KEY!);
    if (hash !== expectedHash) {
      return new Response('Invalid signature', { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!);

    const paid = status.toLowerCase() === 'paid' || status.toLowerCase() === 'complete';
    const now = new Date().toISOString();
    const startDate = now;
    const endDate = new Date(Date.now() + 60 * 86400000).toISOString();
    const update: Record<string, unknown> = {
      status: paid ? 'active' : 'failed',
      start_date: paid ? startDate : null,
      end_date: paid ? endDate : null,
      updated_at: now,
    };
    if (paid) update.paid_at = now;

    const { error } = await supabase
      .from('subscriptions')
      .update(update)
      .eq('paynow_reference', reference);

    if (error) throw error;

    return new Response('OK', { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});