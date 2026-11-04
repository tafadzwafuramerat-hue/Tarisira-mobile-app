// Supabase Edge Function: reset-password-phone
// Sends an OTP to a phone number for password reset. No auth required.
// Deploy: supabase functions deploy reset-password-phone

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { phone } = await req.json();
    if (!phone) return new Response('Phone required', { status: 400 });

    const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ phone, data: {}, create_user: false, gotrue_meta_security: {} }),
    });

    const result = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ error: result.message || 'Failed' }), { status: res.status });

    return new Response(JSON.stringify({ ok: true, message_id: result.message_id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});