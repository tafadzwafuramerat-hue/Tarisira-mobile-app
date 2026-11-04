// Supabase Edge Function: paynow-create
// Creates a Paynow payment and stores it in the subscriptions table.
// Deploy with: supabase functions deploy paynow-create
// Set secrets: PAYNOW_MERCHANT_ID, PAYNOW_MERCHANT_KEY, PAYNOW_BASE_URL

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PAYNOW_MERCHANT_ID = Deno.env.get('PAYNOW_MERCHANT_ID');
const PAYNOW_MERCHANT_KEY = Deno.env.get('PAYNOW_MERCHANT_KEY');
const PAYNOW_BASE_URL = Deno.env.get('PAYNOW_BASE_URL') || 'https://www.paynow.co.zw';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

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
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return new Response('Unauthorized', { status: 401 });

    const { businessId, amount, phone, method, note } = await req.json();
    if (!businessId || !amount || !phone) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Verify user is member of this business
    const { data: membership } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .maybeSingle();
    if (!membership) return new Response('Forbidden', { status: 403 });

    const reference = `TARISIRA-${user.id.slice(0, 8)}-${Date.now()}`;
    const returnurl = `${SUPABASE_URL}/functions/v1/paynow-webhook`;
    const callbackurl = `${SUPABASE_URL}/functions/v1/paynow-webhook`;

    const data: Record<string, string> = {
      merchant_id: PAYNOW_MERCHANT_ID!,
      merchant_key: PAYNOW_MERCHANT_KEY!,
      amount: String(amount),
      reference,
      email: user.email || '',
      phone,
      first_name: user.user_metadata?.full_name || 'Customer',
      last_name: 'Tarisira',
      description: note || 'Tarisira subscription',
      transaction_id: reference,
      returnurl,
      callbackurl,
    };
    data['hash'] = await hashData(data, PAYNOW_MERCHANT_KEY!);

    const formBody = Object.keys(data)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(data[k])}`)
      .join('&');

    const paynowRes = await fetch(`${PAYNOW_BASE_URL}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    });
    const paynowText = await paynowRes.text();

    // Paynow returns an HTML page with a poll URL or form action
    const pollMatch = paynowText.match(/<iframe[^>]*src="([^"]+)"/i) || paynowText.match(/window\.location\.href\s*=\s*'([^']+)'/i);
    const pollUrl = pollMatch ? pollMatch[1] : null;

    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        business_id: businessId,
        amount,
        provider: method,
        phone,
        paynow_reference: reference,
        paynow_poll_url: pollUrl,
        note: note || null,
        status: 'pending',
        created_by: user.id,
      })
      .select()
      .single();

    if (subError) throw subError;

    return new Response(JSON.stringify({
      subscriptionId: sub.id,
      reference,
      pollUrl,
      paynowUrl: `${PAYNOW_BASE_URL}/pay`,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});