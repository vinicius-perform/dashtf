// Calcula a linha da "Carteira de Contas" exatamente como o Gerenciador de Anúncios:
// resultado por conjunto (meta de desempenho), fuso da conta, atribuição unificada,
// paginação completa e orçamento diário real (campanha + conjunto, só o que está veiculando).
//
// Chamadas:
//  - Painel (usuário logado e autorizado): POST { accounts: [{ id, prepaidSince? }], since?, until?, force? }
//  - Agendador (pg_cron):                  POST { mode: "cron" } com header x-cron-secret
// Resultados ficam em cache na tabela meta_carteira_cache.
import { corsHeaders, isCronCall, json, requireAllowedUser, serviceClient } from '../_shared/auth.ts';
import { GraphError, graphGet, graphGetAll, normId, toAct } from '../_shared/graph.ts';
import {
  aggregateAccountResults,
  computeDailyBudgetMinor,
  dateInTimezone,
  elapsedDaysInRange,
  parsePrepaidBalance,
  round2,
  type AdsetMeta
} from '../_shared/metaResults.ts';

const TTL_CURRENT_MIN = Number(Deno.env.get('CARTEIRA_CACHE_TTL_MIN') || '10');
const TTL_PAST_MIN = 360;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface AccountReq {
  id: string;
  prepaidSince?: string | null;
}

async function fetchAccountNode(actId: string): Promise<any> {
  const base = 'id,account_id,name,account_status,currency,timezone_name,balance,amount_spent,spend_cap,is_prepay_account';
  try {
    return await graphGet(actId, { fields: `${base},funding_source_details` });
  } catch (err) {
    // funding_source_details exige permissões extras em alguns BMs
    if (err instanceof GraphError && err.status < 500) return await graphGet(actId, { fields: base });
    throw err;
  }
}

async function fetchAdsetInsights(actId: string, since: string, until: string): Promise<any[]> {
  const common = {
    level: 'adset',
    time_range: { since, until },
    use_unified_attribution_setting: 'true'
  };
  const baseFields = 'adset_id,campaign_id,optimization_goal,spend,impressions,clicks,actions,cost_per_action_type';
  try {
    return await graphGetAll(`${actId}/insights`, { ...common, fields: `${baseFields},results,cost_per_result` });
  } catch (err) {
    // Se a versão da API não aceitar `results`, cai no mapeamento por optimization_goal
    if (err instanceof GraphError && err.status === 400) {
      console.warn(`[meta-carteira] ${actId}: campo results indisponível (${err.message}); usando fallback.`);
      return await graphGetAll(`${actId}/insights`, { ...common, fields: baseFields });
    }
    throw err;
  }
}

async function computeAccount(acc: AccountReq, sinceIn?: string, untilIn?: string) {
  const actId = toAct(acc.id);
  const node = await fetchAccountNode(actId);
  const tz: string = node.timezone_name || 'America/Sao_Paulo';
  const today = dateInTimezone(new Date(), tz);
  const since = sinceIn && DATE_RE.test(sinceIn) ? sinceIn : today;
  const until = untilIn && DATE_RE.test(untilIn) ? untilIn : today;

  const [insightRows, adsets, campaigns] = await Promise.all([
    fetchAdsetInsights(actId, since, until),
    graphGetAll(`${actId}/adsets`, {
      fields: 'id,campaign_id,optimization_goal,promoted_object,destination_type,effective_status,daily_budget,lifetime_budget,start_time,end_time'
    }),
    graphGetAll(`${actId}/campaigns`, {
      fields: 'id,effective_status,daily_budget,lifetime_budget,start_time,stop_time',
      effective_status: ['ACTIVE']
    })
  ]);

  const metaById: Record<string, AdsetMeta> = {};
  for (const a of adsets) metaById[a.id] = a;

  const agg = aggregateAccountResults(insightRows, metaById);
  const offset = 100; // Graph API devolve valores monetários em centavos para BRL/USD/EUR
  const dailyBudget = computeDailyBudgetMinor(campaigns, adsets) / offset;
  const days = elapsedDaysInRange(since, until, today);
  const avgDailySpend = days > 0 ? round2(agg.totalSpend / days) : 0;

  // Contas pré-pagas: saldo informado pela Meta (quando disponível) e gasto desde a 1ª recarga
  const isPrepay = Boolean(node.is_prepay_account);
  const balanceMeta = isPrepay ? parsePrepaidBalance(node.funding_source_details?.display_string) : null;
  let spendSincePrepaid: number | null = null;
  if (acc.prepaidSince && DATE_RE.test(acc.prepaidSince) && acc.prepaidSince <= today) {
    const r = await graphGet(`${actId}/insights`, {
      fields: 'spend',
      time_range: { since: acc.prepaidSince, until: today },
      use_unified_attribution_setting: 'true'
    });
    spendSincePrepaid = round2(parseFloat(r?.data?.[0]?.spend || '0'));
  }

  const sum = (k: 'impressions' | 'clicks') => insightRows.reduce((s, r) => s + (parseInt(r[k] || '0', 10) || 0), 0);

  return {
    id: normId(node.account_id || node.id || acc.id),
    name: node.name,
    account_status: node.account_status,
    currency: node.currency,
    timezone_name: tz,
    is_prepay_account: isPrepay,
    balance_meta: balanceMeta,
    balance_raw: node.balance !== undefined ? parseFloat(node.balance) / offset : null,
    amount_spent: node.amount_spent !== undefined ? parseFloat(node.amount_spent) / offset : 0,
    spend_cap: node.spend_cap !== undefined ? parseFloat(node.spend_cap) / offset : 0,
    since,
    until,
    today,
    spend: agg.totalSpend,
    impressions: sum('impressions'),
    clicks: sum('clicks'),
    resultsType: agg.resultsType,
    resultsCount: agg.resultsCount,
    cpl: agg.cpl,
    indicator: agg.indicator,
    breakdown: agg.breakdown,
    results_source: agg.adsets.some((a) => a.source === 'meta_results') ? 'meta_results' : 'optimization_goal',
    daily_budget: round2(dailyBudget),
    avg_daily_spend: avgDailySpend,
    prepaid_since: acc.prepaidSince || null,
    spend_since_prepaid: spendSincePrepaid,
    fetched_at: new Date().toISOString()
  };
}

async function readCache(db: ReturnType<typeof serviceClient>, id: string, since: string, until: string, prepaidSince?: string | null) {
  const { data } = await db
    .from('meta_carteira_cache')
    .select('payload, fetched_at')
    .eq('account_id', id)
    .eq('since', since)
    .eq('until', until)
    .maybeSingle();
  if (!data?.payload) return null;
  if ((data.payload.prepaid_since || null) !== (prepaidSince || null)) return null;
  const isPast = until < (data.payload.today || until);
  const ttl = (isPast ? TTL_PAST_MIN : TTL_CURRENT_MIN) * 60_000;
  if (Date.now() - new Date(data.fetched_at).getTime() > ttl) return null;
  return data.payload;
}

async function writeCache(db: ReturnType<typeof serviceClient>, payload: any) {
  const { error } = await db.from('meta_carteira_cache').upsert(
    { account_id: payload.id, since: payload.since, until: payload.until, payload, fetched_at: payload.fetched_at },
    { onConflict: 'account_id,since,until' }
  );
  if (error) console.warn('[meta-carteira] falha ao gravar cache:', error.message);
}

async function runForAccounts(list: AccountReq[], since?: string, until?: string, force = false) {
  const db = serviceClient();
  const out: any[] = [];
  // Processa em lotes de 4 para respeitar limites de taxa da Meta
  for (let i = 0; i < list.length; i += 4) {
    const batch = list.slice(i, i + 4);
    const res = await Promise.all(
      batch.map(async (acc) => {
        const id = normId(acc.id);
        try {
          if (!force && since && until) {
            const cached = await readCache(db, id, since, until, acc.prepaidSince);
            if (cached) return { ...cached, from_cache: true };
          }
          const payload = await computeAccount(acc, since, until);
          await writeCache(db, payload);
          return payload;
        } catch (err) {
          const message = err instanceof GraphError ? err.message : String((err as Error)?.message || err);
          console.error(`[meta-carteira] conta ${id}:`, message);
          return { id, error: message };
        }
      })
    );
    out.push(...res);
  }
  return out;
}

async function cronAccounts(): Promise<AccountReq[]> {
  const db = serviceClient();
  const { data, error } = await db.from('agency_portfolio').select('account_id').eq('is_active', true);
  if (!error && data?.length) return data.map((r: any) => ({ id: r.account_id }));
  const envList = (Deno.env.get('META_CARTEIRA_ACCOUNTS') || '').split(',').map((s) => s.trim()).filter(Boolean);
  return envList.map((id) => ({ id }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* corpo vazio */
  }

  if (body?.mode === 'cron') {
    if (!isCronCall(req)) return json({ error: 'Não autorizado.' }, 401);
    const accounts = await cronAccounts();
    // Pré-aquece "Hoje" e "Este mês" no fuso de cada conta (o computeAccount resolve o fuso)
    const results: any[] = [];
    for (const acc of accounts) {
      const [todayRow] = await runForAccounts([acc], undefined, undefined, true);
      results.push(todayRow);
      if (todayRow?.today) {
        const monthStart = `${todayRow.today.slice(0, 8)}01`;
        await runForAccounts([acc], monthStart, todayRow.today, true);
      }
    }
    return json({ ok: true, refreshed: results.length, errors: results.filter((r) => r?.error) });
  }

  const auth = await requireAllowedUser(req);
  if (auth instanceof Response) return auth;

  const accounts: AccountReq[] = Array.isArray(body?.accounts)
    ? body.accounts.filter((a: any) => a?.id).map((a: any) => ({ id: String(a.id), prepaidSince: a.prepaidSince || null }))
    : [];
  if (accounts.length === 0) return json({ error: 'Informe ao menos uma conta.' }, 400);
  if (accounts.length > 100) return json({ error: 'Máximo de 100 contas por chamada.' }, 400);

  const since = DATE_RE.test(body?.since || '') ? body.since : undefined;
  const until = DATE_RE.test(body?.until || '') ? body.until : undefined;
  const rows = await runForAccounts(accounts, since, until, Boolean(body?.force));
  return json({ accounts: rows });
});
