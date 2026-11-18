import { supabase } from './supabase';

/**
 * Substituto do `axios.get` para a Graph API da Meta.
 * Todas as chamadas passam pela Edge Function `meta-proxy`, que injeta o token no servidor.
 * O navegador nunca recebe nem envia o token.
 *
 * Aceita a mesma assinatura usada no código antigo:
 *   graphGet(`${GRAPH_API_BASE}/act_123/insights`, { params: {...} })
 *   graphGet(paging.next)
 * e devolve `{ data, status }` como o axios. Erros seguem o formato `err.response.data`.
 */
export interface GraphResponse<T = any> {
  data: T;
  status: number;
}

export class GraphRequestError extends Error {
  response: { status: number; data: any };
  constructor(message: string, status: number, data: any) {
    super(message);
    this.response = { status, data };
  }
}

export async function graphGet<T = any>(
  urlOrPath: string,
  config: { params?: Record<string, any>; timeout?: number } = {}
): Promise<GraphResponse<T>> {
  const params = { ...(config.params || {}) };
  delete params.access_token;

  const body = urlOrPath.startsWith('http')
    ? { url: urlOrPath, params }
    : { path: urlOrPath, params };

  const { data, error } = await supabase.functions.invoke('meta-proxy', { body });

  if (error) {
    let status = 500;
    let payload: any = { error: { message: error.message } };
    const ctx: any = (error as any).context;
    if (ctx && typeof ctx.json === 'function') {
      status = ctx.status ?? status;
      try {
        payload = await ctx.json();
      } catch {
        /* sem corpo */
      }
    }
    const message = payload?.error?.message || payload?.error || error.message;
    throw new GraphRequestError(String(message), status, payload);
  }

  return { data: data as T, status: 200 };
}
