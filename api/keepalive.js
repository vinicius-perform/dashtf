// Mantém o projeto Supabase ativo (projetos do plano gratuito pausam após ~7 dias sem uso).
// Chamado diariamente pelo Vercel Cron (ver "crons" em vercel.json).
// Faz uma leitura leve na API REST do Supabase usando a chave pública (anon), a mesma do painel.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://aczsouypqgjlrqdmrtwq.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjenNvdXlwcWdqbHJxZG1ydHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMDQ0MzUsImV4cCI6MjEwMjY4MDQzNX0.3SCk-WeS9T5sTPP8R9McTXq5WY43cigcUC9H5kEAf7c';

export default async function handler(req, res) {
  // Se CRON_SECRET estiver configurado na Vercel, só aceita a chamada do próprio Vercel Cron
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const started = Date.now();
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/meta_carteira_cache?select=account_id&limit=1`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    return res.status(200).json({
      ok: r.ok,
      supabaseStatus: r.status,
      ms: Date.now() - started,
      at: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
