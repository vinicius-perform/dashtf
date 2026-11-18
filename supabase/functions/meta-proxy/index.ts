// Proxy somente-leitura para a Graph API da Meta.
// O navegador envia { path | url, params } e o servidor injeta o token (segredo META_ACCESS_TOKEN).
// Assim nenhuma tela do painel precisa conhecer o token.
import { corsHeaders, json, requireAllowedUser } from '../_shared/auth.ts';
import { GRAPH_HOST, GraphError, getMetaToken, graphGet, scrubToken } from '../_shared/graph.ts';

// Caminhos permitidos (somente leitura). Ex.: me/adaccounts, act_123/insights, 1234/campaigns, ads_archive,
// ou um nó isolado (ex.: página por ID/username) sem arestas.
const ALLOWED_PATH = /^(v\d+\.\d+\/)?(me(\/(adaccounts|businesses))?|act_\d+(\/(insights|campaigns|adsets|ads|adcreatives))?|\d+(\/(insights|campaigns|adsets|ads|owned_ad_accounts|client_ad_accounts|adcreatives|picture))?|ads_archive|[A-Za-z0-9._-]+)$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const auth = await requireAllowedUser(req);
  if (auth instanceof Response) return auth;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido.' }, 400);
  }

  let path: string = String(body?.path || '');
  let params: Record<string, unknown> = { ...(body?.params || {}) };

  // Também aceita URLs completas (ex.: paging.next devolvido pela Meta)
  if (body?.url) {
    let u: URL;
    try {
      u = new URL(String(body.url));
    } catch {
      return json({ error: 'URL inválida.' }, 400);
    }
    if (u.origin !== GRAPH_HOST) return json({ error: 'Somente graph.facebook.com é permitido.' }, 400);
    path = u.pathname.replace(/^\/+/, '');
    u.searchParams.forEach((v, k) => {
      if (!(k in params)) params[k] = v;
    });
  }

  path = path.replace(/^\/+/, '').replace(/\/+$/, '');
  delete params.access_token;
  if (!ALLOWED_PATH.test(path)) return json({ error: `Caminho não permitido: ${path}` }, 400);

  // Remove o prefixo de versão do cliente: a versão é definida no servidor (META_API_VERSION)
  path = path.replace(/^v\d+\.\d+\//, '');

  try {
    const token = getMetaToken();
    let data: any;
    try {
      data = await graphGet(path, params, token);
    } catch (err) {
      // Se a versão da API recusar `results`/`cost_per_result`, repete sem eles
      // (o painel cai no cálculo pela meta de desempenho do conjunto).
      const fields = typeof params.fields === 'string' ? params.fields : '';
      if (err instanceof GraphError && err.status === 400 && /(^|,)(results|cost_per_result)(,|$)/.test(fields)) {
        const reduced = fields.split(',').filter((f) => f !== 'results' && f !== 'cost_per_result').join(',');
        data = await graphGet(path, { ...params, fields: reduced }, token);
      } else {
        throw err;
      }
    }
    return json(scrubToken(data, token));
  } catch (err) {
    if (err instanceof GraphError) return json(err.payload || { error: { message: err.message } }, err.status || 500);
    return json({ error: { message: String((err as Error)?.message || err) } }, 500);
  }
});
