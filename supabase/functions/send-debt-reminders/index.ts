// Deploy: supabase functions deploy send-debt-reminders
// Required secrets are documented in the debt-reminders README section.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY');
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_SMS_FROM = Deno.env.get('TWILIO_SMS_FROM');
const TWILIO_MESSAGING_SERVICE_SID = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID');
const TWILIO_WHATSAPP_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM');
const TWILIO_WHATSAPP_CONTENT_SID = Deno.env.get('TWILIO_WHATSAPP_CONTENT_SID');

type DebtorRow = {
  name: string;
  phone: string | null;
  current_balance: number | string;
  item_owed: string | null;
  due_at: string;
  owner_approved_reminders: boolean;
  customer_sms_opt_in: boolean;
  customer_whatsapp_opt_in: boolean;
};

type BusinessRow = { name: string };
type ReminderRow = {
  id: string;
  due_at: string;
  sms_sent_at: string | null;
  whatsapp_sent_at: string | null;
  debtors: DebtorRow;
  businesses: BusinessRow;
};

function response(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sendTwilioMessage(fields: Record<string, string>): Promise<void> {
  const accountSid = TWILIO_ACCOUNT_SID;
  const authToken = TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) throw new Error('Twilio account credentials are not configured.');

  const form = new URLSearchParams(fields);
  const result = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form,
  });
  if (!result.ok) {
    const details = await result.text();
    throw new Error(`Twilio rejected a reminder message (${result.status}): ${details.slice(0, 500)}`);
  }
}

serve(async (req) => {
  if (req.method !== 'POST') return response({ error: 'Method not allowed' }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return response({ error: 'Supabase service credentials are not configured.' }, 500);
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || (!TWILIO_SMS_FROM && !TWILIO_MESSAGING_SERVICE_SID)
    || !TWILIO_WHATSAPP_FROM || !TWILIO_WHATSAPP_CONTENT_SID) {
    return response({ error: 'Twilio SMS and approved WhatsApp template settings are required.' }, 500);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const now = new Date();
    const nowIso = now.toISOString();
    const staleSendingBefore = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

    const { error: staleError } = await supabase
      .from('automatic_debt_reminders')
      .update({ status: 'failed', last_error: 'Previous send attempt did not finish.', updated_at: nowIso })
      .eq('status', 'sending')
      .lt('updated_at', staleSendingBefore);
    if (staleError) throw staleError;

    const { data: dueReminders, error: queryError } = await supabase
      .from('automatic_debt_reminders')
      .select('id,due_at,sms_sent_at,whatsapp_sent_at,debtors!inner(name,phone,current_balance,item_owed,due_at,owner_approved_reminders,customer_sms_opt_in,customer_whatsapp_opt_in),businesses!inner(name)')
      .in('status', ['pending', 'failed'])
      .lte('scheduled_for', nowIso)
      .limit(100);
    if (queryError) throw queryError;

    let sent = 0;
    let failed = 0;
    let cancelled = 0;
    for (const reminder of (dueReminders ?? []) as unknown as ReminderRow[]) {
      const { data: claimed, error: claimError } = await supabase
        .from('automatic_debt_reminders')
        .update({ status: 'sending', last_error: null, updated_at: nowIso })
        .eq('id', reminder.id)
        .in('status', ['pending', 'failed'])
        .select('id')
        .maybeSingle();
      if (claimError) throw claimError;
      if (!claimed) continue;

      const debtor = reminder.debtors;
      const balance = Number(debtor.current_balance);
      if (balance <= 0 || !debtor.owner_approved_reminders || !debtor.customer_sms_opt_in
        || !debtor.customer_whatsapp_opt_in || !debtor.phone) {
        const { error } = await supabase.from('automatic_debt_reminders')
          .update({ status: 'cancelled', last_error: null, updated_at: new Date().toISOString() })
          .eq('id', reminder.id);
        if (error) throw error;
        cancelled++;
        continue;
      }

      const phone = debtor.phone.replace(/[^\d+]/g, '');
      if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
        const { error } = await supabase.from('automatic_debt_reminders')
          .update({ status: 'failed', last_error: 'Debtor phone must use international E.164 format.', updated_at: new Date().toISOString() })
          .eq('id', reminder.id);
        if (error) throw error;
        failed++;
        continue;
      }

      const dueDate = new Intl.DateTimeFormat('en-ZW', {
        timeZone: 'Africa/Harare',
        dateStyle: 'long',
      }).format(new Date(reminder.due_at));
      const itemLine = debtor.item_owed ? ` for ${debtor.item_owed}` : '';
      const message = `Hello ${debtor.name}, this is a reminder from ${reminder.businesses.name}. Your outstanding balance of $${balance.toFixed(2)}${itemLine} is due on ${dueDate}. Thank you.`;
      let smsSentAt = reminder.sms_sent_at;
      let whatsappSentAt = reminder.whatsapp_sent_at;
      const errors: string[] = [];

      if (!smsSentAt) {
        try {
          const fields: Record<string, string> = {
            To: phone,
            Body: message,
          };
          if (TWILIO_MESSAGING_SERVICE_SID) fields.MessagingServiceSid = TWILIO_MESSAGING_SERVICE_SID;
          else fields.From = TWILIO_SMS_FROM!;
          await sendTwilioMessage(fields);
          smsSentAt = new Date().toISOString();
        } catch (error) {
          errors.push(error instanceof Error ? `SMS: ${error.message}` : 'SMS: unknown error');
        }
      }

      if (!whatsappSentAt) {
        try {
          const contentVariables = JSON.stringify({
            1: debtor.name,
            2: reminder.businesses.name,
            3: `$${balance.toFixed(2)}${itemLine}`,
            4: dueDate,
          });
          await sendTwilioMessage({
            To: `whatsapp:${phone}`,
            From: TWILIO_WHATSAPP_FROM!,
            ContentSid: TWILIO_WHATSAPP_CONTENT_SID!,
            ContentVariables: contentVariables,
          });
          whatsappSentAt = new Date().toISOString();
        } catch (error) {
          errors.push(error instanceof Error ? `WhatsApp: ${error.message}` : 'WhatsApp: unknown error');
        }
      }

      const complete = Boolean(smsSentAt && whatsappSentAt);
      const update = await supabase.from('automatic_debt_reminders').update({
        status: complete ? 'sent' : 'failed',
        sms_sent_at: smsSentAt,
        whatsapp_sent_at: whatsappSentAt,
        last_error: errors.length ? errors.join(' ') : null,
        updated_at: new Date().toISOString(),
      }).eq('id', reminder.id);
      if (update.error) throw update.error;
      if (complete) sent++;
      else failed++;
    }

    return response({ sent, failed, cancelled });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Debt reminder job failed:', message);
    return response({ error: message }, 500);
  }
});
