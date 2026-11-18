import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export function serviceClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false }
  });
}

/** Chamada do agendador (pg_cron) autenticada pelo segredo CRON_SECRET. */
export function isCronCall(req: Request): boolean {
  const secret = Deno.env.get('CRON_SECRET');
  return Boolean(secret) && req.headers.get('x-cron-secret') === secret;
}

/**
 * Exige sessão válida do Supabase Auth E e-mail presente em ALLOWED_EMAILS
 * (lista separada por vírgula). Sem ALLOWED_EMAILS configurado, ninguém acessa:
 * o login do painel permite auto-cadastro, então "estar logado" não basta.
 */
export async function requireAllowedUser(req: Request): Promise<{ email: string } | Response> {
  const authHeader = req.headers.get('Authorization') || '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'Não autenticado.' }, 401);

  const { data, error } = await serviceClient().auth.getUser(jwt);
  const email = data?.user?.email?.toLowerCase();
  if (error || !email) return json({ error: 'Sessão inválida. Faça login novamente.' }, 401);

  const allowed = (Deno.env.get('ALLOWED_EMAILS') || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.includes(email)) {
    return json({ error: `O usuário ${email} não tem permissão para acessar dados da Meta.` }, 403);
  }
  return { email };
}
