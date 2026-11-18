// Cliente mínimo da Graph API da Meta para Edge Functions (Deno).
// O token NUNCA sai do servidor: ele vem do segredo META_ACCESS_TOKEN.

export const META_API_VERSION = Deno.env.get('META_API_VERSION') || 'v23.0';
export const GRAPH_HOST = 'https://graph.facebook.com';
export const GRAPH_BASE = `${GRAPH_HOST}/${META_API_VERSION}`;

export class GraphError extends Error {
  status: number;
  payload: any;
  constructor(message: string, status: number, payload: any) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export function getMetaToken(): string {
  const token = Deno.env.get('META_ACCESS_TOKEN') || '';
  if (!token) throw new GraphError('Segredo META_ACCESS_TOKEN não configurado no Supabase.', 500, null);
  return token;
}

function buildUrl(pathOrUrl: string, params: Record<string, unknown>, token: string): string {
  const url = pathOrUrl.startsWith('http')
    ? new URL(pathOrUrl)
    : new URL(`${GRAPH_BASE}/${pathOrUrl.replace(/^\/+/, '')}`);
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || k === 'access_token') continue;
    url.searchParams.set(k, typeof v === 'string' ? v : JSON.stringify(v));
  }
  url.searchParams.set('access_token', token);
  return url.toString();
}

/** Remove o token de qualquer string do payload (ex.: paging.next) antes de devolver ao navegador. */
export function scrubToken<T>(payload: T, token: string): T {
  if (!token) return payload;
  const json = JSON.stringify(payload);
  const cleaned = json
    .split(encodeURIComponent(token)).join('')
    .split(token).join('')
    .replace(/([?&])access_token=(&|")/g, (_m, p1, p2) => (p2 === '"' ? '"' : p1));
  return JSON.parse(cleaned);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET com retry simples para limites de taxa (códigos 4, 17, 32, 613, 80000-80014). */
export async function graphGet(pathOrUrl: string, params: Record<string, unknown> = {}, token = getMetaToken()): Promise<any> {
  const url = buildUrl(pathOrUrl, params, token);
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { method: 'GET' });
    const body = await res.json().catch(() => ({}));
    if (res.ok) return body;
    const code = body?.error?.code;
    const rateLimited = [4, 17, 32, 613].includes(code) || (code >= 80000 && code <= 80014);
    if (rateLimited && attempt < 2) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    throw new GraphError(body?.error?.message || `Graph API HTTP ${res.status}`, res.status, scrubToken(body, token));
  }
  throw new GraphError('Graph API: tentativas esgotadas', 429, null);
}

/** Percorre todas as páginas (paging.next) e devolve a lista completa. */
export async function graphGetAll(path: string, params: Record<string, unknown> = {}, maxPages = 50): Promise<any[]> {
  const token = getMetaToken();
  const first = await graphGet(path, { limit: 500, ...params }, token);
  const all: any[] = Array.isArray(first?.data) ? [...first.data] : [];
  let next: string | undefined = first?.paging?.next;
  let pages = 1;
  while (next && pages < maxPages) {
    const page = await graphGet(next, {}, token);
    if (Array.isArray(page?.data)) all.push(...page.data);
    next = page?.paging?.next;
    pages++;
  }
  return all;
}

export const toAct = (id: string) => `act_${String(id).trim().replace(/^act_/, '')}`;
export const normId = (id: string) => String(id || '').trim().replace(/^act_/, '');
