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

// Extrai conversas e visitas dos actions retornados pela Meta Graph API
export function extractConversasAndVisitas(actions: any[] = [], costPerAction: any[] = [], totalSpend: number = 0) {
  let conversas = 0;
  let cpl: number | null = null;
  let visitas = 0;
  let costPerVisita: number | null = null;

  if (Array.isArray(actions)) {
    for (const a of actions) {
      if (
        a.action_type === 'onsite_conversion.total_messaging_connection' ||
        a.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
        a.action_type === 'onsite_conversion.messaging_first_reply'
      ) {
        const val = parseInt(a.value, 10) || 0;
        if (val > conversas) conversas = val;
      }
      if (
        a.action_type === 'instagram_profile_visit' || 
        a.action_type === 'profile_visit'
      ) {
        const val = parseInt(a.value, 10) || 0;
        if (val > visitas) visitas = val;
      }
    }
    // Se não encontrou profile_visit explícito, busca link_click como fallback secundário de visitas
    if (visitas === 0) {
      const linkClick = actions.find(a => a.action_type === 'link_click');
      if (linkClick) visitas = parseInt(linkClick.value, 10) || 0;
    }
  }

  if (Array.isArray(costPerAction)) {
    for (const c of costPerAction) {
      if (
        c.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
        c.action_type === 'onsite_conversion.total_messaging_connection' ||
        c.action_type === 'onsite_conversion.messaging_first_reply'
      ) {
        const val = parseFloat(c.value) || 0;
        if (val > 0 && (cpl === null || val < cpl)) cpl = val;
      }
      if (
        c.action_type === 'instagram_profile_visit' || 
        c.action_type === 'profile_visit'
      ) {
        const val = parseFloat(c.value) || 0;
        if (val > 0) costPerVisita = val;
      }
    }
  }

  if (conversas > 0 && totalSpend > 0 && (!cpl || cpl === 0)) {
    cpl = totalSpend / conversas;
  }
  if (visitas > 0 && totalSpend > 0 && (!costPerVisita || costPerVisita === 0)) {
    costPerVisita = totalSpend / visitas;
  }

  return { conversas, cpl, visitas, costPerVisita };
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

  const dateParams = buildDateParams(dateRange);

  // 2. Consulta em paralelo para cada conta os insights e as campanhas ativas
  const carteiraItems: MetaAccountCarteiraItem[] = await Promise.all(
    accounts.map(async (acc): Promise<MetaAccountCarteiraItem> => {
      const actId = toActAccountId(acc.id);
      const normId = normalizeAccountId(acc.id);

      let spend = 0;
      let conversas = 0;
      let visitas = 0;
      let cpl: number | null = null;
      let dailyBudget = 0;

      if (token) {
        try {
          // Insights do período
          const insightsRes = await axios.get(`${GRAPH_API_BASE}/${actId}/insights`, {
            params: {
              access_token: token,
              fields: 'spend,impressions,clicks,actions,cost_per_action_type',
              ...dateParams
            },
            timeout: 8000
          }).catch(() => null);

          const insightData = insightsRes?.data?.data?.[0];
          if (insightData) {
            spend = parseFloat(insightData.spend || '0');
            const extracted = extractConversasAndVisitas(
              insightData.actions || [],
              insightData.cost_per_action_type || [],
              spend
            );
            conversas = extracted.conversas;
            visitas = extracted.visitas;
            cpl = extracted.cpl;
          }

          // Campanhas para cálculo do orçamento diário ativo
          const campRes = await axios.get(`${GRAPH_API_BASE}/${actId}/campaigns`, {
            params: {
              access_token: token,
              fields: 'id,name,status,daily_budget,lifetime_budget',
              limit: 100
            },
            timeout: 8000
          }).catch(() => null);

          const campaignsList = campRes?.data?.data || [];
          let activeDailyBudgetCents = 0;
          campaignsList.forEach((c: any) => {
            if (c.status === 'ACTIVE' && c.daily_budget) {
              activeDailyBudgetCents += parseInt(c.daily_budget, 10) || 0;
            }
          });
          dailyBudget = activeDailyBudgetCents > 0 ? activeDailyBudgetCents / 100 : 0;
        } catch (err) {
          console.warn(`Erro ao consultar dados da conta ${acc.id}:`, err);
        }
      }

      // Se não houver orçamento diário das campanhas ativas, calcula ritmo de gasto médio diário
      if (dailyBudget === 0 && spend > 0) {
        dailyBudget = parseFloat((spend / 30).toFixed(2));
      }

      // Saldo em Reais
      const balance = typeof acc.balance === 'number' 
        ? acc.balance 
        : (acc.balance ? parseFloat(acc.balance as string) : 0);

      const isPrepay = Boolean(acc.is_prepay_account);

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

      // Priorização dos Resultados: Conversas > Visitas ao perfil
      let resultsType: 'conversas' | 'visitas' | 'nenhum' = 'nenhum';
      let resultsCount = 0;
      if (conversas > 0) {
        resultsType = 'conversas';
        resultsCount = conversas;
      } else if (visitas > 0) {
        resultsType = 'visitas';
        resultsCount = visitas;
      }

      // Meta de CPL salva no Supabase (com valor padrão razoável se não configurado)
      const metaCpl = metaCplMap[normId] ?? null;

      // Status da Meta (%): ((cpl_atual - meta_cpl) / meta_cpl) * 100
      let statusMetaPercent: number | null = null;
      let excessoPago: number | null = null;

      if (metaCpl && cpl && metaCpl > 0) {
        statusMetaPercent = parseFloat((((cpl - metaCpl) / metaCpl) * 100).toFixed(1));
        if (cpl > metaCpl) {
          excessoPago = parseFloat(((cpl - metaCpl) * (conversas > 0 ? conversas : 1)).toFixed(2));
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
        resultsType,
        resultsCount,
        cpl,
        meta_cpl: metaCpl,
        remaining_days: remainingDays,
        status_meta_percent: statusMetaPercent,
        excesso_pago: excessoPago
      };
    })
  );

  return carteiraItems;
}

