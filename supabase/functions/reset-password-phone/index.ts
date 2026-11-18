import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY');
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_SMS_FROM = Deno.env.get('TWILIO_SMS_FROM');
const TWILIO_MESSAGING_SERVICE_SID = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID');
const RESET_LINK = 'tarisira://forgot-password?token=';
const GENERIC_RESPONSE = { ok: true, message: 'If this number belongs to a verified Tarisira account, a reset link will be sent.' };

function response(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sendSms(to: string, body: string): Promise<void> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || (!TWILIO_SMS_FROM && !TWILIO_MESSAGING_SERVICE_SID)) {
    throw new Error('Twilio SMS secrets are not configured.');
  }
  const fields: Record<string, string> = { To: to, Body: body };
  if (TWILIO_MESSAGING_SERVICE_SID) fields.MessagingServiceSid = TWILIO_MESSAGING_SERVICE_SID;
  else fields.From = TWILIO_SMS_FROM!;

  const result = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(fields),
  });
  if (!result.ok) throw new Error(`Twilio rejected the password reset SMS (${result.status}): ${(await result.text()).slice(0, 500)}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return response({});
  if (req.method !== 'POST') return response({ error: 'Method not allowed' }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return response({ error: 'Supabase service credentials are not configured.' }, 500);

  try {
    const body = await req.json() as { action?: string; phone?: string; token?: string; password?: string };
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (body.action === 'request') {
      const phone = body.phone?.trim();
      if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) return response({ error: 'Enter a valid phone number in international format.' }, 400);
      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || (!TWILIO_SMS_FROM && !TWILIO_MESSAGING_SERVICE_SID)) {
        return response({ error: 'SMS delivery is not configured. Set the Twilio secrets and redeploy the password recovery function.' }, 503);
      }

      const { data: userId, error: lookupError } = await supabase.rpc('find_verified_auth_user_id_by_phone', {
        phone_to_find: phone,
      });
      if (lookupError) {
        if (['42883', 'PGRST202'].includes(lookupError.code ?? '')) {
          return response({ error: 'Phone recovery is not set up in this database. Run supabase/phone-password-reset-setup.sql in the Supabase SQL Editor.' }, 503);
        }
        throw lookupError;
      }
      if (!userId) return response(GENERIC_RESPONSE);

      const { data: previousReset, error: previousResetError } = await supabase
        .from('phone_password_reset_tokens')
        .select('requested_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (previousResetError) {
        if (['42P01', 'PGRST205'].includes(previousResetError.code ?? '')) {
          return response({ error: 'Phone recovery is not set up in this database. Run supabase/phone-password-reset-setup.sql in the Supabase SQL Editor.' }, 503);
        }
        throw previousResetError;
      }
      if (previousReset && Date.now() - new Date(previousReset.requested_at).getTime() < 60_000) {
        return response(GENERIC_RESPONSE);
      }

      const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
      const token = Array.from(tokenBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
      const now = new Date();
      const { error: saveError } = await supabase.from('phone_password_reset_tokens').upsert({
        user_id: userId,
        token_hash: await hashToken(token),
        expires_at: new Date(now.getTime() + 15 * 60_000).toISOString(),
        requested_at: now.toISOString(),
        consumed_at: null,
      });
      if (saveError) {
        if (['42P01', 'PGRST205'].includes(saveError.code ?? '')) {
          return response({ error: 'Phone recovery is not set up in this database. Run supabase/phone-password-reset-setup.sql in the Supabase SQL Editor.' }, 503);
        }
        throw saveError;
      }

      try {
        await sendSms(phone, `Tarisira password reset: open this link within 15 minutes to choose a new password: ${RESET_LINK}${token}. If you did not request this, ignore this message.`);
      } catch (error) {
        await supabase.from('phone_password_reset_tokens').delete().eq('user_id', userId);
        throw error;
      }
      return response(GENERIC_RESPONSE);
    }

    if (body.action === 'complete') {
      const token = body.token;
      const password = body.password;
      if (!token || !/^[a-f0-9]{64}$/.test(token)) return response({ error: 'This reset link is invalid or expired. Request a new one.' }, 400);
      if (!password || password.length < 6) return response({ error: 'Password must be at least 6 characters.' }, 400);

      const { data: reset, error: consumeError } = await supabase
        .from('phone_password_reset_tokens')
        .update({ consumed_at: new Date().toISOString() })
        .eq('token_hash', await hashToken(token))
        .is('consumed_at', null)
        .gt('expires_at', new Date().toISOString())
        .select('user_id')
        .maybeSingle();
      if (consumeError) throw consumeError;
      if (!reset) return response({ error: 'This reset link is invalid or expired. Request a new one.' }, 400);

      const { error: updateError } = await supabase.auth.admin.updateUserById(reset.user_id, { password });
      if (updateError) throw updateError;
      return response({ ok: true });
    }

    return response({ error: 'Invalid recovery request.' }, 400);
  } catch (error) {
    console.error('Phone password recovery failed:', error);
    return response({ error: 'Could not process password recovery. Please try again later.' }, 500);
  }
});
