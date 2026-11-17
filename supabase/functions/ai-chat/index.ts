// Supabase Edge Function: ai-chat
// Proxy for OpenAI chat completions. Keeps your API key on the server.
// Deploy: supabase functions deploy ai-chat
// Secret: OPENAI_API_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

function buildSystemPrompt(businessContext: unknown): string {
  return `You are Tarisira, a helpful business assistant for small retailers in Zimbabwe. Answer concisely in English or Shona based on the user's language.

BUSINESS DATA (authoritative — use ONLY these values):
${JSON.stringify(businessContext ?? {})}

CRITICAL RULES:
1. Answer ONLY using the business data above. Never invent or estimate financial figures.
2. If a number is not in the data, say "I don't have that data" — do not guess.
3. For actions (record sale, record payment, delete), respond with a confirmation request: "Confirm: [action]?" and do NOT execute.
4. Keep answers short and factual.`;
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return new Response('Unauthorized', { status: 401 });

    const body = await req.json() as { messages?: ChatMessage[]; businessContext?: unknown };
    const messages = body.messages ?? [];
    if (messages.length === 0) return new Response('Messages required', { status: 400 });

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt(body.businessContext) },
          ...messages,
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await res.json() as {
      error?: { message?: string };
      choices?: { message?: { content?: string } }[];
    };

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message ?? 'OpenAI failed' }),
        { status: res.status, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const reply = data.choices?.[0]?.message?.content ?? '';
    return new Response(JSON.stringify({ reply }), {
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