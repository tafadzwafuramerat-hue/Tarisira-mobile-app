// Supabase Edge Function: ai-chat
// Proxy for OpenAI chat completions. Keeps your API key on the server.
// Deploy: supabase functions deploy ai-chat
// Secret: OPENAI_API_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return new Response('Unauthorized', { status: 401 });

    const { messages, businessContext } = await req.json();
    if (!messages?.length) return new Response('Messages required', { status: 400 });

    const systemPrompt = `You are Tarisira, a helpful business assistant for small retailers in Zimbabwe. Answer concisely in English or Shona based on the user's language. Business context: ${JSON.stringify(businessContext || {})}.`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ error: data.error?.message || 'OpenAI failed' }), { status: res.status });

    return new Response(JSON.stringify({ reply: data.choices[0].message.content }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});