import { 
  MetaConfig, 
  MetaAdAccount, 
  MetaAccountCarteiraItem 
} from '../types/meta';
import { 
  toActAccountId, 
  normalizeAccountId
} from './metaDataEngine';
import { supabase } from '../lib/supabase';
import { getTodayRange } from '../utils/timezone';
import type { RecargaItem } from '../types/financeiro';
import { fetchAccountSettingsMap } from './accountSettingsService';
import { 
  getFinanceiroAccounts, 
  saveFinanceiroAccounts, 
  DEFAULT_META_TAX_PERCENT,
  isAccountMarkedPrepay
} from './financeiroService';

// Vínculo inteligente entre contas da Carteira Meta e contas do Financeiro
export function isMatchingAccount(
  fin: { id: string; nome: string; metaAccountId?: string },
  acc: { id: string; name: string }
): boolean {
  const normFId = normalizeAccountId(fin.id);
  const normFMetaId = fin.metaAccountId ? normalizeAccountId(fin.metaAccountId) : '';
  const normAccId = normalizeAccountId(acc.id);

  if (normFId && normFId === normAccId) return true;
  if (normFMetaId && normFMetaId === normAccId) return true;

  const cleanFin = (fin.nome || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanAcc = (acc.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (cleanFin && cleanAcc) {
    if (cleanFin.includes(cleanAcc) || cleanAcc.includes(cleanFin)) return true;
  }

  const tokensF = (fin.nome || '').toLowerCase().split(/[\s\-_\(\)]+/).filter(t => t.length >= 4);
  const tokensA = (acc.name || '').toLowerCase().split(/[\s\-_\(\)]+/).filter(t => t.length >= 4);
  for (const tf of tokensF) {
    if (tokensA.includes(tf)) return true;
  }

  return false;
}

const SPEND_CACHE_KEY = 'dashtf_carteira_spend_cache';

export interface AccountSpendInfo {
  id: string;
  name: string;
  spend: number;
  daily_budget: number;
}

export function getCarteiraSpendCache(): Record<string, AccountSpendInfo> {
  try {
    const raw = localStorage.getItem(SPEND_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCarteiraSpendCache(cache: Record<string, AccountSpendInfo>): void {
  try {
    localStorage.setItem(SPEND_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

export function getSpendForAccount(acc: { id: string; nome?: string; name?: string; metaAccountId?: string }): { spend: number; daily_budget: number } | null {
  const cache = getCarteiraSpendCache();
  const normId = normalizeAccountId(acc.id);
  const normMetaId = acc.metaAccountId ? normalizeAccountId(acc.metaAccountId) : '';

  if (normId && cache[normId]) return cache[normId];
  if (normMetaId && cache[normMetaId]) return cache[normMetaId];

  const targetName = acc.nome || acc.name || '';
  for (const item of Object.values(cache)) {
    if (isMatchingAccount({ id: acc.id, nome: targetName, metaAccountId: acc.metaAccountId }, { id: item.id, name: item.name })) {
      return item;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Carteira de Contas: dados calculados no servidor (Edge Function meta-carteira)
// com as mesmas regras do Gerenciador de Anúncios. Ver supabase/functions/_shared/metaResults.ts
// ---------------------------------------------------------------------------

export interface CarteiraServerRow {
  id: string;
  error?: string;
  name?: string;
  account_status?: number;
  currency?: string;
  timezone_name?: string;
  is_prepay_account?: boolean;
  balance_meta?: number | null;
  balance_raw?: number | null;
  amount_spent?: number;
  spend_cap?: number;
  spend?: number;
  resultsType?: 'leads' | 'conversas' | 'visitas' | 'outros' | 'nenhum';
  resultsCount?: number;
  cpl?: number | null;
  indicator?: string | null;
  breakdown?: Record<'leads' | 'conversas' | 'visitas' | 'outros', { count: number; spend: number }>;
  daily_budget?: number;
  avg_daily_spend?: number;
  spend_since_prepaid?: number | null;
  fetched_at?: string;
  from_cache?: boolean;
}

/**
 * Converte a data de uma recarga ("03/11", "03/11/2026" ou "2026-11-03") para YYYY-MM-DD.
 * Sem ano, assume o ano corrente (ou o anterior, se a data cair no futuro).
 */
export function parseRecargaDate(raw: string | undefined, todayIso: string): string | null {
  if (!raw) return null;
  const v = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const m = v.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) return null;
  const dd = m[1].padStart(2, '0');
  const mm = m[2].padStart(2, '0');
  let year = m[3] ? (m[3].length === 2 ? `20${m[3]}` : m[3]) : todayIso.slice(0, 4);
  let iso = `${year}-${mm}-${dd}`;
  if (!m[3] && iso > todayIso) {
    year = String(Number(year) - 1);
    iso = `${year}-${mm}-${dd}`;
  }
  return iso;
}

/** Data da recarga paga mais antiga (marco a partir do qual o gasto é descontado do saldo). */
export function earliestPaidRecarga(recargas: RecargaItem[] = [], todayIso: string): string | null {
  const dates = recargas
    .filter((r) => r.status === 'Pago')
    .map((r) => parseRecargaDate(r.pagoEm || r.data, todayIso))
    .filter((d): d is string => Boolean(d))
    .sort();
  return dates[0] || null;
}

async function invokeCarteira(body: Record<string, unknown>): Promise<CarteiraServerRow[]> {
  const { data, error } = await supabase.functions.invoke('meta-carteira', { body });
  if (error) {
    let message = error.message;
    const ctx: any = (error as any).context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const payload = await ctx.json();
        message = payload?.error?.message || payload?.error || message;
      } catch {
        /* sem corpo */
      }
    }
    throw new Error(`Falha ao buscar dados da Meta: ${message}`);
  }
  return Array.isArray(data?.accounts) ? data.accounts : [];
}

/**
 * Busca a carteira de contas já calculada no servidor e cruza com:
 * - metas de CPL (Supabase account_settings);
 * - recargas do módulo Financeiro (contas pré-pagas).
 */
export async function fetchCarteiraAccounts(
  _config: MetaConfig,
  accounts: MetaAdAccount[],
  dateRange?: { startDate?: string; endDate?: string },
  options: { force?: boolean } = {}
): Promise<MetaAccountCarteiraItem[]> {
  if (!accounts || accounts.length === 0) return [];

  const metaCplMap = await fetchAccountSettingsMap();
  const financeiroAccounts = getFinanceiroAccounts();
  let hasFinanceiroUpdates = false;

  const todayIso = getTodayRange('America/Sao_Paulo').startDate;
  const range = dateRange?.startDate && dateRange?.endDate
    ? { since: dateRange.startDate, until: dateRange.endDate }
    : { since: todayIso, until: todayIso };

  // Para contas pré-pagas com recargas lançadas, pede também o gasto desde a 1ª recarga paga
  const requestAccounts = accounts.map((acc) => {
    const finAcc = financeiroAccounts.find((f) => isMatchingAccount(f, acc));
    const isPrepay = isAccountMarkedPrepay(acc, financeiroAccounts);
    const prepaidSince = finAcc && isPrepay ? earliestPaidRecarga(finAcc.recargas, todayIso) : null;
    return { id: normalizeAccountId(acc.id), prepaidSince };
  });

  const serverRows = await invokeCarteira({ accounts: requestAccounts, ...range, force: Boolean(options.force) });
  const byId = new Map(serverRows.map((r) => [normalizeAccountId(r.id), r]));

  const carteiraItems: MetaAccountCarteiraItem[] = accounts.map((acc): MetaAccountCarteiraItem => {
    const normId = normalizeAccountId(acc.id);
    const row = byId.get(normId);
    if (row?.error) console.warn(`Conta ${normId}: ${row.error}`);

    const spend = row?.spend ?? 0;
    const breakdown = row?.breakdown;
    const resultsType = (row?.resultsType ?? 'nenhum') as MetaAccountCarteiraItem['resultsType'];
    const resultsCount = row?.resultsCount ?? 0;
    const finalCpl = row?.cpl ?? null;
    const avgDailySpend = row?.avg_daily_spend ?? 0;
    // Orçamento ativo real; sem orçamento ativo, mostra o ritmo médio de gasto do período
    const dailyBudget = row?.daily_budget && row.daily_budget > 0 ? row.daily_budget : avgDailySpend;

    // ---------------- Saldo de contas pré-pagas ----------------
    const finAcc = financeiroAccounts.find((f) => isMatchingAccount(f, acc));
    const isPrepay = Boolean(row?.is_prepay_account) || isAccountMarkedPrepay(acc, financeiroAccounts);
    let balance = 0;
    let totalAbastecidoBruto = 0;
    let totalAbastecidoLiquido = 0;
    let impostoAbastecido = 0;

    if (finAcc && isPrepay) {
      const taxaDecimal = finAcc.aplicarImposto !== false
        ? (finAcc.aliquotaImpostoPercentual ?? DEFAULT_META_TAX_PERCENT) / 100
        : 0;
      for (const r of finAcc.recargas) {
        if (r.status !== 'Pago') continue;
        totalAbastecidoBruto += r.valor;
        impostoAbastecido += r.impostoValor !== undefined ? r.impostoValor : parseFloat((r.valor * taxaDecimal).toFixed(2));
        totalAbastecidoLiquido += r.valorLiquido !== undefined ? r.valorLiquido : parseFloat((r.valor * (1 - taxaDecimal)).toFixed(2));
      }
    }

    if (isPrepay && typeof row?.balance_meta === 'number') {
      // 1º: saldo informado pela própria Meta
      balance = row.balance_meta;
    } else if (finAcc && isPrepay && totalAbastecidoLiquido > 0 && typeof row?.spend_since_prepaid === 'number') {
      // 2º: recargas pagas (líquidas) − gasto desde a primeira recarga (não o gasto do período filtrado)
      balance = Math.max(0, parseFloat((totalAbastecidoLiquido - row.spend_since_prepaid).toFixed(2)));
    } else if (finAcc && finAcc.saldoAtualEmConta > 0) {
      balance = finAcc.saldoAtualEmConta;
    } else {
      balance = typeof acc.balance === 'number' ? acc.balance : parseFloat(String(acc.balance || 0)) || 0;
    }

    if (finAcc && isPrepay && finAcc.saldoAtualEmConta !== balance) {
      finAcc.saldoAtualEmConta = balance;
      hasFinanceiroUpdates = true;
    }

    let remainingDays: number | null = null;
    if (isPrepay) {
      const pace = row?.daily_budget && row.daily_budget > 0 ? row.daily_budget : avgDailySpend;
      remainingDays = pace > 0 ? parseFloat((balance / pace).toFixed(1)) : 99;
    }

    // ---------------- Meta de CPL ----------------
    const metaCpl = metaCplMap[normId] ?? null;
    let statusMetaPercent: number | null = null;
    let excessoPago: number | null = null;
    if (metaCpl && finalCpl && metaCpl > 0) {
      statusMetaPercent = parseFloat((((finalCpl - metaCpl) / metaCpl) * 100).toFixed(1));
      excessoPago = finalCpl > metaCpl ? parseFloat(((finalCpl - metaCpl) * Math.max(resultsCount, 1)).toFixed(2)) : 0;
    }

    return {
      id: normId,
      raw_id: toActAccountId(normId),
      name: row?.name || acc.name || `Conta ${normId}`,
      account_status: row?.account_status ?? acc.account_status ?? 1,
      currency: row?.currency || acc.currency || 'BRL',
      timezone_name: row?.timezone_name || acc.timezone_name || 'America/Sao_Paulo',
      business_id: acc.business_id,
      business_name: acc.business_name,
      is_prepay_account: isPrepay,
      balance,
      amount_spent: row?.amount_spent ?? (typeof acc.amount_spent === 'number' ? acc.amount_spent : parseFloat(String(acc.amount_spent || 0))),
      spend_cap: row?.spend_cap ?? (typeof acc.spend_cap === 'number' ? acc.spend_cap : parseFloat(String(acc.spend_cap || 0))),
      daily_budget: dailyBudget,
      spend,
      conversas: breakdown?.conversas.count ?? 0,
      profile_visits: breakdown?.visitas.count ?? 0,
      leads: breakdown?.leads.count ?? 0,
      resultsType,
      resultsCount,
      cpl: finalCpl,
      meta_cpl: metaCpl,
      remaining_days: remainingDays,
      status_meta_percent: statusMetaPercent,
      excesso_pago: excessoPago,
      total_abastecido_liquido: totalAbastecidoLiquido > 0 ? totalAbastecidoLiquido : undefined,
      total_abastecido_bruto: totalAbastecidoBruto > 0 ? totalAbastecidoBruto : undefined,
      imposto_abastecido: impostoAbastecido > 0 ? impostoAbastecido : undefined,
      data_error: row?.error,
      fetched_at: row?.fetched_at
    };
  });

  const spendCache = getCarteiraSpendCache();
  carteiraItems.forEach((item) => {
    spendCache[item.id] = { id: item.id, name: item.name, spend: item.spend, daily_budget: item.daily_budget };
  });
  saveCarteiraSpendCache(spendCache);

  if (hasFinanceiroUpdates) saveFinanceiroAccounts(financeiroAccounts);

  return carteiraItems;
}
