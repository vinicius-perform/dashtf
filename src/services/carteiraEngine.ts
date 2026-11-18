import axios from 'axios';
import { 
  MetaConfig, 
  MetaAdAccount, 
  MetaAccountCarteiraItem 
} from '../types/meta';
import { 
  GRAPH_API_BASE, 
  toActAccountId, 
  normalizeAccountId, 
  buildDateParams,
  ADMIN_META_TOKEN 
} from './metaDataEngine';
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

// Consolidação de Métricas da Carteira seguindo a Hierarquia da Agência
export interface ConsolidatedAccountResults {
  resultsType: 'leads' | 'conversas' | 'visitas' | 'nenhum';
  resultsCount: number;
  cpl: number | null;
  totalLeads: number;
  totalConversas: number;
  totalVisitas: number;
}

/**
 * Iteração Completa: Varre o array actions e soma os valores das três categorias principais simultaneamente:
 * - Total de Conversas: onsite_conversion.total_messaging_connection, onsite_conversion.messaging_conversation_started_7d, onsite_conversion.messaging_first_reply
 * - Total de Visitas: outbound_clicks, outbound_click, link_click, ig_profile_visits, instagram_profile_visit, profile_visit
 * - Total de Leads: lead, onsite_conversion.lead, onsite_web_lead, offsite_conversion.fb_pixel_lead, onsite_conversion.lead_grouped, leadgen_grouped, offsite_conversion.custom.*
 */
export function extractConsolidatedMetrics(actions: any[] = []): {
  totalLeads: number;
  totalConversas: number;
  totalVisitas: number;
} {
  let totalLeads = 0;
  let totalConversas = 0;
  let totalVisitas = 0;

  if (Array.isArray(actions)) {
    for (const a of actions) {
      if (!a || !a.action_type) continue;
      const type = String(a.action_type).trim();
      const val = parseInt(a.value, 10) || 0;
      if (val <= 0) continue;

      // 1. Total de Leads: Somar lead, onsite_web_lead, offsite_conversion.fb_pixel_lead e onsite_conversion.lead_grouped
      if (
        type === 'lead' ||
        type === 'onsite_conversion.lead' ||
        type === 'onsite_web_lead' ||
        type === 'offsite_conversion.fb_pixel_lead' ||
        type === 'onsite_conversion.lead_grouped' ||
        type === 'leadgen_grouped' ||
        type.startsWith('offsite_conversion.custom.')
      ) {
        totalLeads += val;
      }

      // 2. Total de Conversas: Somar os valores de onsite_conversion.total_messaging_connection, onsite_conversion.messaging_conversation_started_7d e onsite_conversion.messaging_first_reply
      if (
        type === 'onsite_conversion.total_messaging_connection' ||
        type === 'onsite_conversion.messaging_conversation_started_7d' ||
        type === 'onsite_conversion.messaging_first_reply'
      ) {
        totalConversas += val;
      }

      // 3. Total de Visitas: Somar os valores de outbound_clicks, link_click (quando o destino for o perfil do Instagram) ou ig_profile_visits
      if (
        type === 'outbound_clicks' ||
        type === 'outbound_click' ||
        type === 'link_click' ||
        type === 'ig_profile_visits' ||
        type === 'instagram_profile_visit' ||
        type === 'profile_visit'
      ) {
        totalVisitas += val;
      }
    }
  }

  return { totalLeads, totalConversas, totalVisitas };
}

/**
 * Hierarquia de Exibição (O que mostrar na Tabela):
 * Após somar as três categorias simultaneamente, decide qual exibir com base na regra de negócio da agência:
 * - Se Conversas for a métrica dominante do volume da conta (ex: centenas/milhares de conversas vs leads residuais) -> exibe Conversas.
 * - Regra 1: Se houver Total de Leads > 0 -> exibe o total de Leads (Ícone de Alvo). Calcule o CPL dividindo o Gasto Total por este número.
 * - Regra 2: Se não houver Leads, verifique as Conversas. Se Total de Conversas > 0 -> exibe o total de Conversas (Ícone de Balão). Calcule o CPL dividindo o Gasto Total por este número.
 * - Regra 3: Se não houver Leads nem Conversas -> exibe o Total de Visitas (Ícone de Link/Perfil). Calcule o Custo por Visita dividindo o Gasto Total por este número.
 */
export function computeConsolidatedAccountResults(
  spend: number,
  actions: any[] = []
): ConsolidatedAccountResults {
  const { totalLeads, totalConversas, totalVisitas } = extractConsolidatedMetrics(actions);

  let resultsType: 'leads' | 'conversas' | 'visitas' | 'nenhum' = 'nenhum';
  let resultsCount = 0;
  let cpl: number | null = null;

  // Se Conversas for amplamente a métrica dominante do volume da conta (ex: 841 conversas vs 52 leads acidentais, ou 1885 conversas vs 8 leads)
  if (totalConversas > 0 && totalConversas >= totalLeads * 3) {
    resultsType = 'conversas';
    resultsCount = totalConversas;
    cpl = spend > 0 ? parseFloat((spend / totalConversas).toFixed(2)) : null;
  }
  // Regra 1: Se houver Total de Leads > 0, exiba o total de Leads (Ícone de Alvo). Calcule o CPL dividindo o Gasto Total por este número.
  else if (totalLeads > 0) {
    resultsType = 'leads';
    resultsCount = totalLeads;
    cpl = spend > 0 ? parseFloat((spend / totalLeads).toFixed(2)) : null;
  }
  // Regra 2: Se não houver Leads, verifique as Conversas. Se Total de Conversas > 0, exiba o total de Conversas (Ícone de Balão). Calcule o CPL dividindo o Gasto Total por este número.
  else if (totalConversas > 0) {
    resultsType = 'conversas';
    resultsCount = totalConversas;
    cpl = spend > 0 ? parseFloat((spend / totalConversas).toFixed(2)) : null;
  }
  // Regra 3: Se não houver Leads nem Conversas, exiba o Total de Visitas (Ícone de Link/Perfil). Calcule o Custo por Visita dividindo o Gasto Total por este número.
  else if (totalVisitas > 0) {
    resultsType = 'visitas';
    resultsCount = totalVisitas;
    cpl = spend > 0 ? parseFloat((spend / totalVisitas).toFixed(2)) : null;
  } else {
    resultsType = 'nenhum';
    resultsCount = 0;
    cpl = null;
  }

  return {
    resultsType,
    resultsCount,
    cpl,
    totalLeads,
    totalConversas,
    totalVisitas
  };
}

// Wrapper retrocompatível
export function extractConversasAndVisitas(actions: any[] = [], costPerAction: any[] = [], totalSpend: number = 0) {
  const res = computeConsolidatedAccountResults(totalSpend, actions);
  return {
    leads: res.totalLeads,
    costPerLead: res.resultsType === 'leads' ? res.cpl : null,
    conversas: res.totalConversas,
    cpl: res.resultsType === 'conversas' ? res.cpl : null,
    visitas: res.totalVisitas,
    costPerVisita: res.resultsType === 'visitas' ? res.cpl : null
  };
}

/**
 * Busca dados em tempo real da carteira de contas da Meta Graph API
 * e faz o merge (cruzamento) com as metas de CPL salvas no Supabase.
 */
export async function fetchCarteiraAccounts(
  config: MetaConfig,
  accounts: MetaAdAccount[],
  dateRange?: any
): Promise<MetaAccountCarteiraItem[]> {
  const token = config?.accessToken?.trim() || ADMIN_META_TOKEN;
  
  // 1. Busca metas salvas no Supabase (com fallback no cache local)
  const metaCplMap = await fetchAccountSettingsMap();

  if (!accounts || accounts.length === 0) {
    return [];
  }

  // 1.b Busca contas pré-pagas e recargas cadastradas no módulo Financeiro
  const financeiroAccounts = getFinanceiroAccounts();
  let hasFinanceiroUpdates = false;

  const dateParams = buildDateParams(dateRange);

  // 2. Consulta em paralelo para cada conta os insights e as campanhas ativas
  const carteiraItems: MetaAccountCarteiraItem[] = await Promise.all(
    accounts.map(async (acc): Promise<MetaAccountCarteiraItem> => {
      const actId = toActAccountId(acc.id);
      const normId = normalizeAccountId(acc.id);

      let spend = 0;
      let leads = 0;
      let costPerLead: number | null = null;
      let conversas = 0;
      let cpl: number | null = null;
      let visitas = 0;
      let costPerVisita: number | null = null;
      let dailyBudget = 0;
      let campaignsList: any[] = [];

      let resultsType: 'leads' | 'conversas' | 'visitas' | 'nenhum' = 'nenhum';
      let resultsCount = 0;
      let finalCpl: number | null = null;

      if (token) {
        try {
          // Consulta em paralelo insights e campanhas da conta
          const [insightsRes, campRes] = await Promise.all([
            axios.get(`${GRAPH_API_BASE}/${actId}/insights`, {
              params: {
                access_token: token,
                fields: 'spend,impressions,clicks,actions,cost_per_action_type',
                ...dateParams
              },
              timeout: 8000
            }).catch(() => null),
            axios.get(`${GRAPH_API_BASE}/${actId}/campaigns`, {
              params: {
                access_token: token,
                fields: 'id,name,status,objective,daily_budget,lifetime_budget',
                limit: 100
              },
              timeout: 8000
            }).catch(() => null)
          ]);

          const insightData = insightsRes?.data?.data?.[0];
          campaignsList = campRes?.data?.data || [];

          if (insightData) {
            spend = parseFloat(insightData.spend || '0');
          }

          let activeDailyBudgetCents = 0;
          campaignsList.forEach((c: any) => {
            if (c.status === 'ACTIVE' && c.daily_budget) {
              activeDailyBudgetCents += parseInt(c.daily_budget, 10) || 0;
            }
          });
          dailyBudget = activeDailyBudgetCents > 0 ? activeDailyBudgetCents / 100 : 0;

          // Iteração Completa e Soma Consolidada seguindo a Hierarquia da Agência:
          // 1. Soma os valores das 3 categorias simultaneamente: Leads, Conversas e Visitas
          // 2. Aplica a hierarquia da agência: Leads > Conversas > Visitas (com desempate inteligente de volume)
          // 3. Calcula o CPL dividindo spend pelo total do evento consolidado
          const consolidated = computeConsolidatedAccountResults(
            spend,
            insightData?.actions || []
          );

          resultsType = consolidated.resultsType;
          resultsCount = consolidated.resultsCount;
          finalCpl = consolidated.cpl;
          leads = consolidated.totalLeads;
          conversas = consolidated.totalConversas;
          visitas = consolidated.totalVisitas;
        } catch (err) {
          console.warn(`Erro ao consultar dados da conta ${acc.id}:`, err);
        }
      }

      // Se não houver orçamento diário das campanhas ativas, calcula ritmo de gasto médio diário
      if (dailyBudget === 0 && spend > 0) {
        dailyBudget = parseFloat((spend / 30).toFixed(2));
      }

      // Vínculo inteligente com o módulo Financeiro de abastecimentos pré-pagos
      const finAcc = financeiroAccounts.find(f => isMatchingAccount(f, acc));

      let isPrepay = isAccountMarkedPrepay(acc, financeiroAccounts);
      let balance = 0;
      let totalAbastecidoBruto = 0;
      let totalAbastecidoLiquido = 0;
      let impostoAbastecido = 0;

      if (finAcc && isPrepay) {
        isPrepay = true;
        const taxaDecimal = finAcc.aplicarImposto !== false
          ? (finAcc.aliquotaImpostoPercentual ?? DEFAULT_META_TAX_PERCENT) / 100
          : 0;

        // Soma das recargas com status "Pago" (líquido após imposto Meta)
        for (const r of finAcc.recargas) {
          if (r.status === 'Pago') {
            totalAbastecidoBruto += r.valor;
            const rTax = r.impostoValor !== undefined ? r.impostoValor : parseFloat((r.valor * taxaDecimal).toFixed(2));
            const rNet = r.valorLiquido !== undefined ? r.valorLiquido : parseFloat((r.valor * (1 - taxaDecimal)).toFixed(2));
            impostoAbastecido += rTax;
            totalAbastecidoLiquido += rNet;
          }
        }

        // Saldo Real em Conta = Total Abastecido Líquido (Pago) - Gasto no Período (spend)
        if (totalAbastecidoLiquido > 0) {
          balance = Math.max(0, parseFloat((totalAbastecidoLiquido - spend).toFixed(2)));
          if (finAcc.saldoAtualEmConta !== balance) {
            finAcc.saldoAtualEmConta = balance;
            hasFinanceiroUpdates = true;
          }
        } else if (finAcc.saldoAtualEmConta > 0) {
          balance = finAcc.saldoAtualEmConta;
        } else {
          balance = typeof acc.balance === 'number' 
            ? acc.balance 
            : (acc.balance ? parseFloat(acc.balance as string) : 0);
        }
      } else {
        balance = typeof acc.balance === 'number' 
          ? acc.balance 
          : (acc.balance ? parseFloat(acc.balance as string) : 0);
      }

      // Dias Restantes: Saldo / Orçamento Diário (Apenas para Contas Pré-Pagas)
      let remainingDays: number | null = null;
      if (isPrepay && balance >= 0) {
        if (dailyBudget > 0) {
          remainingDays = parseFloat((balance / dailyBudget).toFixed(1));
        } else if (spend > 0) {
          remainingDays = parseFloat((balance / (spend / 30)).toFixed(1));
        } else {
          remainingDays = 99; // Sem gasto ativo
        }
      }


      // Meta de CPL salva no Supabase (com valor padrão razoável se não configurado)
      const metaCpl = metaCplMap[normId] ?? null;

      // Status da Meta (%): ((finalCpl - meta_cpl) / meta_cpl) * 100
      let statusMetaPercent: number | null = null;
      let excessoPago: number | null = null;

      if (metaCpl && finalCpl && metaCpl > 0) {
        statusMetaPercent = parseFloat((((finalCpl - metaCpl) / metaCpl) * 100).toFixed(1));
        if (finalCpl > metaCpl) {
          excessoPago = parseFloat(((finalCpl - metaCpl) * (resultsCount > 0 ? resultsCount : 1)).toFixed(2));
        } else {
          excessoPago = 0;
        }
      }

      return {
        id: normId,
        raw_id: toActAccountId(normId),
        name: acc.name || `Conta ${normId}`,
        account_status: acc.account_status ?? 1,
        currency: acc.currency || 'BRL',
        timezone_name: acc.timezone_name || 'America/Sao_Paulo',
        business_id: acc.business_id,
        business_name: acc.business_name,
        is_prepay_account: isPrepay,
        balance,
        amount_spent: typeof acc.amount_spent === 'number' ? acc.amount_spent : parseFloat(acc.amount_spent as string || '0'),
        spend_cap: typeof acc.spend_cap === 'number' ? acc.spend_cap : parseFloat(acc.spend_cap as string || '0'),
        daily_budget: dailyBudget,
        spend,
        conversas,
        profile_visits: visitas,
        leads,
        resultsType,
        resultsCount,
        cpl: finalCpl,
        meta_cpl: metaCpl,
        remaining_days: remainingDays,
        status_meta_percent: statusMetaPercent,
        excesso_pago: excessoPago,
        total_abastecido_liquido: totalAbastecidoLiquido > 0 ? totalAbastecidoLiquido : undefined,
        total_abastecido_bruto: totalAbastecidoBruto > 0 ? totalAbastecidoBruto : undefined,
        imposto_abastecido: impostoAbastecido > 0 ? impostoAbastecido : undefined
      };
    })
  );

  // Salva no cache os gastos e orçamentos atualizados de cada conta
  const spendCache = getCarteiraSpendCache();
  carteiraItems.forEach(item => {
    spendCache[item.id] = {
      id: item.id,
      name: item.name,
      spend: item.spend,
      daily_budget: item.daily_budget
    };
  });
  saveCarteiraSpendCache(spendCache);

  if (hasFinanceiroUpdates) {
    saveFinanceiroAccounts(financeiroAccounts);
  }

  return carteiraItems;
}

