import axios from 'axios';
import { 
  MetaConfig, 
  MetaAdAccount, 
  MetaCampaign, 
  MetaAdSet, 
  MetaAd, 
  DashboardSummary,
  DataLineage,
  DeliveryStatusInfo
} from '../types/meta';

const STORAGE_CONFIG_KEY = 'fazendo_acontecer_meta_config';
const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';
const DEFAULT_API_VERSION = 'v19.0';

// ID Normalization Helpers
export function normalizeAccountId(id: string): string {
  if (!id) return '';
  return id.trim().replace(/^act_/, '');
}

export function toActAccountId(id: string): string {
  if (!id) return '';
  const clean = normalizeAccountId(id);
  return `act_${clean}`;
}

// In-Memory Storage for Raw API Audit & Lineage Traceability
const rawAuditStore = new Map<string, { raw: any; lineage: DataLineage }>();

export function getRawAuditRecord(recordId: string) {
  return rawAuditStore.get(recordId);
}

export function getAllRawAuditRecords() {
  return Array.from(rawAuditStore.entries()).map(([id, val]) => ({ id, ...val }));
}

// Safe Meta Config Persistence
export function getSavedMetaConfig(): MetaConfig {
  const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        accessToken: parsed.accessToken || '',
        businessManagerId: parsed.businessManagerId || '1098475893049001',
        businessManagerName: parsed.businessManagerName || 'FazendoAcontecer',
        selectedAccountId: normalizeAccountId(parsed.selectedAccountId || '1115861513053539'),
        accountName: parsed.accountName || 'CA02 - FA',
        currency: parsed.currency || 'BRL',
        isConnected: Boolean(parsed.isConnected),
        lastSyncedAt: parsed.lastSyncedAt || new Date().toISOString(),
        lastValidationAt: parsed.lastValidationAt || new Date().toISOString(),
        apiVersion: DEFAULT_API_VERSION
      };
    } catch {}
  }
  return {
    accessToken: '',
    businessManagerId: '1098475893049001',
    businessManagerName: 'FazendoAcontecer',
    selectedAccountId: '1115861513053539',
    accountName: 'CA02 - FA',
    currency: 'BRL',
    isConnected: false,
    lastSyncedAt: new Date().toISOString(),
    lastValidationAt: new Date().toISOString(),
    apiVersion: DEFAULT_API_VERSION
  };
}

export function validateBMAndAccountRelationship(
  bmId: string | null | undefined, 
  accountId: string | null | undefined, 
  accounts: MetaAdAccount[]
): { valid: boolean; error?: string } {
  if (!bmId || !bmId.trim()) {
    return { valid: false, error: 'Regra de Segurança: Nenhuma Business Manager (BM) foi selecionada. A seleção de BM é obrigatória.' };
  }
  if (!accountId || !accountId.trim()) {
    return { valid: false, error: 'Regra de Segurança: Nenhuma Conta de Anúncios foi selecionada.' };
  }

  const normAccId = normalizeAccountId(accountId);
  const found = accounts.find(a => a.id === normAccId);

  if (!found) {
    return { valid: false, error: 'Regra de Segurança: A conta de anúncios informada não existe na lista de contas carregadas para esta BM.' };
  }

  if (found.business_id && found.business_id !== bmId) {
    return { valid: false, error: `Regra de Segurança Rejeitada: A conta "${found.name}" (ID: ${normAccId}) pertence à BM ${found.business_id} e NÃO à BM selecionada ${bmId}.` };
  }

  return { valid: true };
}

export function saveMetaConfig(config: MetaConfig): void {
  const cleanConfig = {
    ...config,
    selectedAccountId: normalizeAccountId(config.selectedAccountId)
  };
  localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(cleanConfig));
}

// On-Demand Discovery: Fetch Business Managers
export async function fetchBusinessManagers(token: string): Promise<Array<{ id: string; name: string }>> {
  if (!token || token.trim().length < 10) return [];
  try {
    const list = await fetchAllPages(`${GRAPH_API_BASE}/me/businesses`, {
      access_token: token.trim(),
      fields: 'id,name',
      limit: 100
    });
    return list.map((b: any) => ({ id: b.id, name: b.name || `BM ${b.id}` }));
  } catch (err) {
    console.warn('Failed to fetch Business Managers:', err);
    return [];
  }
}

// On-Demand Discovery: Fetch Ad Accounts for a Specific Selected Business Manager ONLY
export async function fetchAdAccountsForBM(token: string, bmId: string): Promise<MetaAdAccount[]> {
  if (!token || token.trim().length < 10 || !bmId) return [];
  const cleanToken = token.trim();
  const accountMap = new Map<string, MetaAdAccount>();

  try {
    // 1. Owned Accounts for BM
    try {
      const owned = await fetchAllPages(`${GRAPH_API_BASE}/${bmId}/owned_ad_accounts`, {
        access_token: cleanToken,
        fields: 'id,name,account_status,currency,timezone_name',
        limit: 100
      });
      owned.forEach((acc: any) => {
        const normId = normalizeAccountId(acc.id);
        accountMap.set(normId, {
          id: normId,
          raw_id: toActAccountId(normId),
          name: acc.name || `Conta ${normId}`,
          account_status: acc.account_status ?? 1,
          currency: acc.currency || 'BRL',
          timezone_name: acc.timezone_name || 'America/Sao_Paulo',
          business_id: bmId
        });
      });
    } catch {}

    // 2. Client Accounts for BM
    try {
      const client = await fetchAllPages(`${GRAPH_API_BASE}/${bmId}/client_ad_accounts`, {
        access_token: cleanToken,
        fields: 'id,name,account_status,currency,timezone_name',
        limit: 100
      });
      client.forEach((acc: any) => {
        const normId = normalizeAccountId(acc.id);
        if (!accountMap.has(normId)) {
          accountMap.set(normId, {
            id: normId,
            raw_id: toActAccountId(normId),
            name: acc.name || `Conta ${normId}`,
            account_status: acc.account_status ?? 1,
            currency: acc.currency || 'BRL',
            timezone_name: acc.timezone_name || 'America/Sao_Paulo',
            business_id: bmId
          });
        }
      });
    } catch {}
  } catch (err) {
    console.warn(`Failed to fetch ad accounts for BM ${bmId}:`, err);
  }

  // Filter accounts strictly by business_id (No fallback to all user accounts)
  return Array.from(accountMap.values()).filter(acc => !acc.business_id || acc.business_id === bmId);
}

// Full Paginated Graph API Fetcher with Rate-Limit Handling
async function fetchAllPages(url: string, initialParams: Record<string, any>): Promise<any[]> {
  let allData: any[] = [];
  let nextUrl: string | null = null;

  try {
    const res = await axios.get(url, { params: initialParams, timeout: 10000 });
    if (res.data && Array.isArray(res.data.data)) {
      allData = [...res.data.data];
    }
    if (res.data && res.data.paging && res.data.paging.next) {
      nextUrl = res.data.paging.next;
    }

    // Paginate through paging.next until exhausted
    let safetyCounter = 0;
    while (nextUrl && safetyCounter < 10) {
      safetyCounter++;
      try {
        const pageRes = await axios.get(nextUrl, { timeout: 10000 });
        if (pageRes.data && Array.isArray(pageRes.data.data)) {
          allData = [...allData, ...pageRes.data.data];
        }
        nextUrl = pageRes.data?.paging?.next || null;
      } catch (pageErr) {
        console.warn('Pagination page fetch interrupted:', pageErr);
        break;
      }
    }
  } catch (err) {
    throw err;
  }

  return allData;
}

// Strict Ingestion & Normalization for Ad Accounts
export async function fetchAdAccounts(token: string): Promise<MetaAdAccount[]> {
  if (!token || token.trim().length < 10) {
    return [];
  }

  const accountMap = new Map<string, MetaAdAccount>();
  const cleanToken = token.trim();

  try {
    // 1. Fetch direct user ad accounts
    const directAccounts = await fetchAllPages(`${GRAPH_API_BASE}/me/adaccounts`, {
      access_token: cleanToken,
      fields: 'id,name,account_status,currency,timezone_name,business',
      limit: 100
    });

    directAccounts.forEach((acc: any) => {
      const normId = normalizeAccountId(acc.id);
      accountMap.set(normId, {
        id: normId,
        raw_id: toActAccountId(normId),
        name: acc.name ? `${acc.name} ${acc.business ? `(${acc.business.name || 'BM'})` : ''}` : `Conta ${normId}`,
        account_status: acc.account_status ?? 1,
        currency: acc.currency || 'BRL',
        timezone_name: acc.timezone_name || 'America/Sao_Paulo',
        business_id: acc.business?.id,
        business_name: acc.business?.name
      });
    });

    // 2. Fetch Business Portfolios
    try {
      const businesses = await fetchAllPages(`${GRAPH_API_BASE}/me/businesses`, {
        access_token: cleanToken,
        fields: 'id,name',
        limit: 25
      });

      for (const biz of businesses) {
        // Fetch owned ad accounts
        try {
          const owned = await fetchAllPages(`${GRAPH_API_BASE}/${biz.id}/owned_ad_accounts`, {
            access_token: cleanToken,
            fields: 'id,name,account_status,currency,timezone_name',
            limit: 100
          });
          owned.forEach((acc: any) => {
            const normId = normalizeAccountId(acc.id);
            if (!accountMap.has(normId)) {
              accountMap.set(normId, {
                id: normId,
                raw_id: toActAccountId(normId),
                name: acc.name ? `${acc.name} (${biz.name})` : `Conta ${normId}`,
                account_status: acc.account_status ?? 1,
                currency: acc.currency || 'BRL',
                timezone_name: acc.timezone_name || 'America/Sao_Paulo',
                business_id: biz.id,
                business_name: biz.name
              });
            }
          });
        } catch {}

        // Fetch client ad accounts
        try {
          const client = await fetchAllPages(`${GRAPH_API_BASE}/${biz.id}/client_ad_accounts`, {
            access_token: cleanToken,
            fields: 'id,name,account_status,currency,timezone_name',
            limit: 100
          });
          client.forEach((acc: any) => {
            const normId = normalizeAccountId(acc.id);
            if (!accountMap.has(normId)) {
              accountMap.set(normId, {
                id: normId,
                raw_id: toActAccountId(normId),
                name: acc.name ? `${acc.name} (${biz.name})` : `Conta ${normId}`,
                account_status: acc.account_status ?? 1,
                currency: acc.currency || 'BRL',
                timezone_name: acc.timezone_name || 'America/Sao_Paulo',
                business_id: biz.id,
                business_name: biz.name
              });
            }
          });
        } catch {}
      }
    } catch {}
  } catch (err) {
    console.warn('Meta API ad accounts fetch failed:', err);
  }

  return Array.from(accountMap.values());
}

// Date Range Parameter Builder (Enforces exact time_range, NO date_preset parameter allowed!)
export function buildDateParams(dateRange?: any): Record<string, string> {
  const params: Record<string, string> = {};
  
  let since = dateRange?.startDate;
  let until = dateRange?.endDate;

  if (!since || !until) {
    const todayStr = new Date().toISOString().split('T')[0];
    since = todayStr;
    until = todayStr;
  }

  // Strictly enforce explicit time_range parameter
  params.time_range = JSON.stringify({ since, until });
  return params;
}

// Strict Lead Action Extractor (Prevents Ghost Leads from secondary actions)
export function extractLeadsFromActions(actionsArray: any[]): { count: number; actionType: string | null } {
  if (!actionsArray || !Array.isArray(actionsArray)) return { count: 0, actionType: null };

  const leadTypes = [
    'lead', 
    'offsite_conversion.fb_pixel_lead', 
    'onsite_conversion.lead_grouped'
  ];

  // Search exclusively for strict lead action_types or custom lead conversion offsite_conversion.custom.{ID}
  const leadAction = actionsArray.find(action => 
    action && typeof action.action_type === 'string' && (
      leadTypes.includes(action.action_type) || 
      action.action_type.startsWith('offsite_conversion.custom.')
    )
  );

  if (!leadAction) return { count: 0, actionType: null };

  const val = parseFloat(leadAction.value || '0');
  return {
    count: val > 0 ? val : 0,
    actionType: val > 0 ? leadAction.action_type : null
  };
}

// Strict Action Metric Extractor (No Random, No Fallback, Zero "Múltiplas conversões")
export function extractNormalizedMetrics(rawItem: any) {
  const insight = rawItem.insights?.data?.[0];
  const nameStr = String(rawItem.name || '').toUpperCase();
  const objectiveStr = String(rawItem.objective || '').toUpperCase();

  if (!insight) {
    // Derive resultLabel from name/objective even if insight is empty
    let emptyResultLabel = 'Leads';
    if (nameStr.includes('[LEAD D]')) {
      emptyResultLabel = 'Lead D';
    } else if (nameStr.includes('[WHATSAPP]') || objectiveStr.includes('MESSAGES')) {
      emptyResultLabel = 'Conversas Iniciadas';
    } else if (nameStr.includes('DIAGNÓSTICO') || nameStr.includes('LP DIAGNÓST')) {
      emptyResultLabel = 'Lead B LP Diagnóstico';
    } else if (objectiveStr.includes('TRAFFIC')) {
      emptyResultLabel = 'Cliques no Link';
    } else if (objectiveStr.includes('SALES')) {
      emptyResultLabel = 'Compras';
    }

    return {
      spend: null,
      impressions: null,
      clicks: null,
      ctr: null,
      cpc: null,
      cpm: null,
      reach: null,
      frequency: null,
      conversions: null,
      resultLabel: emptyResultLabel,
      cpa: null,
      profileVisits: null,
      retentionPct: null,
      followersGained: null,
      cps: null,
      landingPageViews: null,
      roas: null
    };
  }

  const spend = insight.spend !== undefined && insight.spend !== null ? parseFloat(insight.spend) : null;
  const impressions = insight.impressions !== undefined && insight.impressions !== null ? parseInt(insight.impressions) : null;
  const clicks = insight.clicks !== undefined && insight.clicks !== null ? parseInt(insight.clicks) : null;
  const reach = insight.reach !== undefined && insight.reach !== null ? parseInt(insight.reach) : null;
  const frequency = insight.frequency !== undefined && insight.frequency !== null ? parseFloat(insight.frequency) : null;

  const ctr = insight.ctr !== undefined && insight.ctr !== null ? parseFloat(insight.ctr) : (impressions && clicks !== null ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : null);
  const cpc = insight.cpc !== undefined && insight.cpc !== null ? parseFloat(insight.cpc) : (spend !== null && clicks ? parseFloat((spend / clicks).toFixed(2)) : null);
  const cpm = insight.cpm !== undefined && insight.cpm !== null ? parseFloat(insight.cpm) : (spend !== null && impressions ? parseFloat(((spend / impressions) * 1000).toFixed(2)) : null);

  const actions: Array<{ action_type: string; value: string }> = insight.actions || [];
  const costPerActionType: Array<{ action_type: string; value: string }> = insight.cost_per_action_type || [];
  
  const getActionSum = (types: string[]): number | null => {
    let found = false;
    let sum = 0;
    actions.forEach((act) => {
      if (types.includes(act.action_type)) {
        found = true;
        sum += parseFloat(act.value || '0');
      }
    });
    return found ? sum : null;
  };

  // Primary Action Isolation Logic (Strict Meta Ads Manager Alignment)
  let primaryActionType: string | null = null;
  let conversions: number | null = null;
  let resultLabel: string = 'Leads';
  let cpa: number | null = null;

  if (nameStr.includes('[LEAD D]')) {
    resultLabel = 'Lead D';
    const leadRes = extractLeadsFromActions(actions);
    conversions = leadRes.count > 0 ? leadRes.count : null;
    primaryActionType = leadRes.actionType || 'lead';
  } else if (nameStr.includes('[WHATSAPP]') || objectiveStr.includes('MESSAGES')) {
    resultLabel = 'Conversas Iniciadas';
    const msgAction = actions.find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');
    if (msgAction) {
      const val = parseFloat(msgAction.value || '0');
      conversions = val > 0 ? val : null;
      primaryActionType = msgAction.action_type;
    } else {
      primaryActionType = 'onsite_conversion.messaging_conversation_started_7d';
    }
  } else if (nameStr.includes('DIAGNÓSTICO') || nameStr.includes('LP DIAGNÓST')) {
    resultLabel = 'Lead B LP Diagnóstico';
    const leadRes = extractLeadsFromActions(actions);
    conversions = leadRes.count > 0 ? leadRes.count : null;
    primaryActionType = leadRes.actionType || 'offsite_conversion.fb_pixel_lead';
  } else if (objectiveStr.includes('SALES') || objectiveStr.includes('CONVERSIONS')) {
    resultLabel = 'Compras';
    const purchaseAction = actions.find(a => 
      a.action_type === 'offsite_conversion.fb_pixel_purchase' || 
      a.action_type === 'purchase' || 
      a.action_type === 'omni_purchase'
    );
    if (purchaseAction) {
      const val = parseFloat(purchaseAction.value || '0');
      conversions = val > 0 ? val : null;
      primaryActionType = purchaseAction.action_type;
    } else {
      primaryActionType = 'offsite_conversion.fb_pixel_purchase';
    }
  } else if (objectiveStr.includes('TRAFFIC') || nameStr.includes('CLIQUE')) {
    resultLabel = 'Cliques no Link';
    const clickAction = actions.find(a => a.action_type === 'link_click');
    if (clickAction) {
      const val = parseFloat(clickAction.value || '0');
      conversions = val > 0 ? val : null;
      primaryActionType = clickAction.action_type;
    } else {
      primaryActionType = 'link_click';
    }
  } else {
    // Default to Lead Campaigns (Site/Form Lead)
    resultLabel = 'Leads';
    const leadRes = extractLeadsFromActions(actions);
    conversions = leadRes.count > 0 ? leadRes.count : null;
    primaryActionType = leadRes.actionType || 'lead';
  }

  // Extract CPA strictly from cost_per_action_type array for the isolated primaryActionType
  if (primaryActionType && conversions !== null && conversions > 0) {
    const matchedCost = costPerActionType.find(c => c.action_type === primaryActionType);
    if (matchedCost && matchedCost.value) {
      cpa = parseFloat(parseFloat(matchedCost.value).toFixed(2));
    } else if (spend !== null && spend > 0) {
      cpa = parseFloat((spend / conversions).toFixed(2));
    }
  } else {
    cpa = null;
  }

  // 2. Visitas ao Perfil
  const profileVisits = getActionSum(['instagram_profile_visit']);

  // 3. Retenção de Vídeo %
  const thruplays = getActionSum(['video_thruplay_watched_actions', 'video_p50_watched_actions']);
  const retentionPct = thruplays !== null && impressions && impressions > 0 ? parseFloat(((thruplays / impressions) * 100).toFixed(1)) : null;

  // 4. Seguidores no Instagram
  const followersGained = getActionSum(['profile_follow', 'instagram_profile_follow']);
  const cps = spend !== null && followersGained && followersGained > 0 ? parseFloat((spend / followersGained).toFixed(2)) : null;

  // 5. Visualizações da Página de Destino
  const landingPageViews = getActionSum(['landing_page_view']);

  // 6. ROAS
  const purchaseValue = getActionSum(['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase']);
  const roas = spend !== null && purchaseValue !== null && spend > 0 ? parseFloat((purchaseValue / spend).toFixed(2)) : null;

  return {
    spend,
    impressions,
    clicks,
    inline_link_clicks: insight.inline_link_clicks !== undefined && insight.inline_link_clicks !== null ? parseInt(insight.inline_link_clicks) : clicks,
    ctr,
    cpc,
    cpm,
    reach,
    frequency,
    conversions,
    resultLabel: resultLabel || 'Leads',
    cpa,
    profileVisits,
    retentionPct,
    followersGained,
    cps,
    landingPageViews,
    roas
  };
}

// In-Memory Cache Engine (Instant Cache-First Strategy)
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL
const metaInsightsCache = new Map<string, { data: any; timestamp: number }>();

export function clearInsightsCache() {
  metaInsightsCache.clear();
}

function getCacheKey(accountId: string, level: string, dateRange?: any): string {
  const dateStr = dateRange?.startDate && dateRange?.endDate 
    ? `${dateRange.startDate}_${dateRange.endDate}` 
    : (dateRange?.label || 'today');
  return `${accountId}:${level}:${dateStr}`;
}

// Fetch Account Level Insights (Direct from Meta API level=account with Cache-First Strategy)
export async function fetchAccountInsights(config: MetaConfig, dateRange?: any): Promise<any> {
  if (!config.isConnected || !config.accessToken || !config.selectedAccountId) {
    return null;
  }
  const actId = toActAccountId(config.selectedAccountId);
  const cacheKey = getCacheKey(config.selectedAccountId, 'account', dateRange);

  // 1. Check Cache-First
  const cached = metaInsightsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const dateParams = buildDateParams(dateRange);

  const params: any = {
    access_token: config.accessToken.trim(),
    fields: 'spend,impressions,clicks,ctr,cpc,cpm,actions,cost_per_action_type',
    level: 'account',
    ...dateParams
  };

  try {
    const res = await axios.get(`${GRAPH_API_BASE}/${actId}/insights`, { params, timeout: 10000 });
    const data = res.data?.data?.[0] || null;
    if (data) {
      metaInsightsCache.set(cacheKey, { data, timestamp: Date.now() });
    }
    return data;
  } catch (err) {
    console.warn('Account level insights fetch failed:', err);
    return cached ? cached.data : null;
  }
}

// Advanced Delivery & Effective Status Resolver Engine (Meta Ads Manager Standard)
export function resolveDeliveryStatus(rawItem: any, level: 'CAMPAIGN' | 'ADSET' | 'AD'): DeliveryStatusInfo {
  const configuredStatus = String(rawItem.configured_status || rawItem.status || '').toUpperCase();
  const effectiveStatus = String(rawItem.effective_status || rawItem.status || '').toUpperCase();
  const nameUpper = String(rawItem.name || '').toUpperCase();
  
  const now = new Date();
  const startTime = rawItem.start_time ? new Date(rawItem.start_time) : null;
  const endTime = rawItem.end_time ? new Date(rawItem.end_time) : null;

  // 1. Rejection / Disapproved Policy Check
  const hasIssuesArray = Array.isArray(rawItem.issues_info) && rawItem.issues_info.some((i: any) => i && (i.error_code || i.level === 'ERROR'));
  const isDisapproved = effectiveStatus.includes('DISAPPROVED') || effectiveStatus.includes('REJECTED') || Boolean(rawItem.ad_review_feedback) || hasIssuesArray;
  if (isDisapproved) {
    let reason = 'Criativo ou configuração violou as diretrizes de publicidade da Meta.';
    if (rawItem.ad_review_feedback) {
      reason = typeof rawItem.ad_review_feedback === 'string' ? rawItem.ad_review_feedback : JSON.stringify(rawItem.ad_review_feedback);
    } else if (Array.isArray(rawItem.issues_info) && rawItem.issues_info[0]?.error_summary) {
      reason = rawItem.issues_info[0].error_summary;
    }
    return {
      code: 'DISAPPROVED',
      label: 'Rejeitado',
      badgeColor: 'red',
      reason
    };
  }

  // 2. Account / Billing / Account Issues Check
  if (effectiveStatus.includes('WITH_ISSUES') || effectiveStatus.includes('ACCOUNT_ERROR')) {
    return {
      code: 'ACCOUNT_ERROR',
      label: 'Erro na conta',
      badgeColor: 'red',
      reason: 'Problema de saldo, cartão recusado ou limite de gastos da conta atingido.'
    };
  }

  // 3. Pending Review Check
  if (effectiveStatus.includes('PENDING_REVIEW') || effectiveStatus.includes('IN_PROCESS')) {
    return {
      code: 'PENDING_REVIEW',
      label: 'Em análise',
      badgeColor: 'yellow',
      reason: 'O criativo foi enviado e está sob análise de conformidade da Meta.'
    };
  }

  // 4. Hierarchical Paused Checks
  if (effectiveStatus === 'PAUSED' || configuredStatus === 'PAUSED') {
    return {
      code: 'PAUSED',
      label: 'Pausado',
      badgeColor: 'gray'
    };
  }

  if (effectiveStatus.includes('CAMPAIGN_PAUSED')) {
    return {
      code: 'PAUSED',
      label: 'Pausado (Campanha)',
      badgeColor: 'gray',
      reason: 'A campanha pai está pausada no Gerenciador de Anúncios.'
    };
  }

  if (effectiveStatus.includes('ADSET_PAUSED')) {
    return {
      code: 'PAUSED',
      label: 'Pausado (Conjunto)',
      badgeColor: 'gray',
      reason: 'O conjunto de anúncios pai está pausado no Gerenciador de Anúncios.'
    };
  }

  if (effectiveStatus.includes('ARCHIVED')) {
    return {
      code: 'COMPLETED',
      label: 'Arquivado',
      badgeColor: 'gray'
    };
  }

  // 5. Scheduled Check (Future Start Time)
  if (effectiveStatus.includes('SCHEDULED') || (startTime && startTime > now)) {
    return {
      code: 'SCHEDULED',
      label: 'Programado',
      badgeColor: 'blue',
      reason: `Programado para iniciar veiculação em ${startTime ? startTime.toLocaleDateString('pt-BR') : 'data futura'}.`
    };
  }

  // 6. Completed Check (Past End Time)
  if (endTime && endTime < now) {
    return {
      code: 'COMPLETED',
      label: 'Concluído',
      badgeColor: 'gray',
      reason: 'A data final programada foi atingida.'
    };
  }

  // 7. Learning Phase & Limited Learning Checks (AdSets / Ads)
  if (level === 'ADSET' || level === 'AD') {
    if (nameUpper.includes('[LIMITADO]') || nameUpper.includes('APRENDIZADO LIMITADO') || effectiveStatus.includes('LEARNING_LIMITED')) {
      return {
        code: 'LEARNING_LIMITED',
        label: 'Aprendizado limitado',
        badgeColor: 'amber',
        reason: 'O conjunto não atingiu 50 conversões em 7 dias e a otimização de entrega foi travada.'
      };
    }

    if (nameUpper.includes('[APRENDIZADO]') || effectiveStatus.includes('IN_LEARNING') || effectiveStatus.includes('LEARNING')) {
      return {
        code: 'IN_LEARNING',
        label: 'Em aprendizado',
        badgeColor: 'blue',
        reason: 'O sistema da Meta está coletando dados de entrega para estabilizar o custo por resultado.'
      };
    }
  }

  // Default Active
  return {
    code: 'ACTIVE',
    label: 'Ativo',
    badgeColor: 'green'
  };
}

// Persistent Master Object Stores (Ensures entity master lists are never lost or emptied)
const masterCampaignsStore = new Map<string, any[]>();
const masterAdSetsStore = new Map<string, any[]>();
const masterAdsStore = new Map<string, any[]>();

// Fetch Live Campaigns with Master List + Left Join Metrics Consolidation
export async function fetchCampaigns(config: MetaConfig, dateRange?: any): Promise<MetaCampaign[]> {
  if (!config.isConnected || !config.accessToken || !config.selectedAccountId) {
    return [];
  }

  const actId = toActAccountId(config.selectedAccountId);
  const normAcc = normalizeAccountId(config.selectedAccountId);
  const cacheKey = getCacheKey(config.selectedAccountId, 'campaigns', dateRange);

  const dateParams = buildDateParams(dateRange);

  try {
    // 1. ALWAYS FETCH Master List of Campaigns (No date_preset / time_range params)
    let rawCampaigns: any[] = [];
    try {
      rawCampaigns = await fetchAllPages(`${GRAPH_API_BASE}/${actId}/campaigns`, {
        access_token: config.accessToken.trim(),
        fields: 'id,name,status,effective_status,configured_status,objective,daily_budget,lifetime_budget,start_time,end_time,issues_info,created_time',
        limit: 500
      });
      if (rawCampaigns && rawCampaigns.length > 0) {
        masterCampaignsStore.set(normAcc, rawCampaigns);
      }
    } catch (e) {
      console.warn('Failed to fetch live master campaign list, using fallback store:', e);
      rawCampaigns = masterCampaignsStore.get(normAcc) || [];
    }

    if ((!rawCampaigns || rawCampaigns.length === 0) && masterCampaignsStore.has(normAcc)) {
      rawCampaigns = masterCampaignsStore.get(normAcc) || [];
    }

    // 2. Query Campaign Level Insights for the filtered date period
    const campaignInsightsMap = new Map<string, any>();
    try {
      const insightsList = await fetchAllPages(`${GRAPH_API_BASE}/${actId}/insights`, {
        access_token: config.accessToken.trim(),
        level: 'campaign',
        fields: 'campaign_id,spend,impressions,inline_link_clicks,inline_link_click_ctr,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type,video_thruplay_watched_actions,video_p50_watched_actions',
        limit: 500,
        ...dateParams
      });
      insightsList.forEach((ins: any) => {
        if (ins.campaign_id) {
          campaignInsightsMap.set(ins.campaign_id, ins);
        }
      });
    } catch (err) {
      console.warn('Campaign level insights query warning:', err);
    }

    // 3. LEFT JOIN: Merge Master List with Period Insights
    const result = rawCampaigns.map((rawItem: any) => {
      try {
        const periodInsight = campaignInsightsMap.get(rawItem.id);
        const itemWithInsight = {
          ...rawItem,
          insights: periodInsight ? { data: [periodInsight] } : { data: [] }
        };

        const parsed = extractNormalizedMetrics(itemWithInsight);
        const deliveryInfo = resolveDeliveryStatus(rawItem, 'CAMPAIGN');
        const fetchedAt = new Date().toISOString();

        const lineage: DataLineage = {
          source: 'META_MARKETING_API',
          endpoint: `${actId}/campaigns`,
          apiVersion: DEFAULT_API_VERSION,
          fetchedAt,
          accountId: config.selectedAccountId,
          level: 'CAMPAIGN',
          recordId: rawItem.id,
          rawRecord: rawItem,
          reconciliationStatus: 'VALID'
        };

        rawAuditStore.set(`CAMPAIGN:${rawItem.id}`, { raw: rawItem, lineage });

        return {
          id: rawItem.id,
          name: rawItem.name || `Campanha ${rawItem.id}`,
          status: (rawItem.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED') as 'ACTIVE' | 'PAUSED',
          effective_status: rawItem.effective_status || rawItem.status || 'PAUSED',
          deliveryInfo,
          objective: rawItem.objective || 'UNKNOWN',
          daily_budget: rawItem.daily_budget ? parseFloat(rawItem.daily_budget) / 100 : null,
          lifetime_budget: rawItem.lifetime_budget ? parseFloat(rawItem.lifetime_budget) / 100 : null,
          spend: parsed.spend,
          impressions: parsed.impressions,
          clicks: parsed.clicks,
          ctr: parsed.ctr,
          cpc: parsed.cpc,
          conversions: parsed.conversions,
          resultLabel: parsed.resultLabel,
          cpa: parsed.cpa,
          roas: parsed.roas,
          reach: parsed.reach,
          frequency: parsed.frequency,
          cpm: parsed.cpm,
          profileVisits: parsed.profileVisits,
          retentionPct: parsed.retentionPct,
          followersGained: parsed.followersGained,
          cps: parsed.cps,
          landingPageViews: parsed.landingPageViews,
          created_time: rawItem.created_time || fetchedAt,
          rawRecord: rawItem,
          lineage
        };
      } catch (itemErr) {
        console.warn('Failed to parse individual campaign item, returning safe default:', itemErr);
        return {
          id: rawItem.id,
          name: rawItem.name || 'Campanha Meta',
          status: (rawItem.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED') as 'ACTIVE' | 'PAUSED',
          effective_status: rawItem.effective_status || rawItem.status || 'PAUSED',
          deliveryInfo: { code: 'ACTIVE' as const, label: 'Ativo', badgeColor: 'green' as const },
          objective: rawItem.objective || 'UNKNOWN',
          daily_budget: rawItem.daily_budget ? parseFloat(rawItem.daily_budget) / 100 : null,
          lifetime_budget: rawItem.lifetime_budget ? parseFloat(rawItem.lifetime_budget) / 100 : null,
          spend: null,
          impressions: null,
          clicks: null,
          ctr: null,
          cpc: null,
          conversions: null,
          resultLabel: 'Leads',
          cpa: null,
          roas: null,
          reach: null,
          frequency: null,
          cpm: null,
          profileVisits: null,
          retentionPct: null,
          followersGained: null,
          cps: null,
          landingPageViews: null,
          created_time: rawItem.created_time || new Date().toISOString(),
          rawRecord: rawItem
        };
      }
    });

    if (result.length > 0) {
      metaInsightsCache.set(cacheKey, { data: result, timestamp: Date.now() });
    }

    return result;
  } catch (err) {
    console.error('Meta API campaigns fetch failed, returning stored master list fallback:', err);
    const fallbackList = masterCampaignsStore.get(normAcc) || [];
    return fallbackList.map((rawItem: any) => ({
      id: rawItem.id,
      name: rawItem.name,
      status: (rawItem.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED') as 'ACTIVE' | 'PAUSED',
      effective_status: rawItem.effective_status || rawItem.status,
      deliveryInfo: resolveDeliveryStatus(rawItem, 'CAMPAIGN'),
      objective: rawItem.objective || 'UNKNOWN',
      daily_budget: rawItem.daily_budget ? parseFloat(rawItem.daily_budget) / 100 : null,
      lifetime_budget: rawItem.lifetime_budget ? parseFloat(rawItem.lifetime_budget) / 100 : null,
      spend: null,
      impressions: null,
      clicks: null,
      ctr: null,
      cpc: null,
      conversions: null,
      resultLabel: 'Leads',
      cpa: null,
      roas: null,
      reach: null,
      frequency: null,
      cpm: null,
      profileVisits: null,
      retentionPct: null,
      followersGained: null,
      cps: null,
      landingPageViews: null,
      created_time: rawItem.created_time || new Date().toISOString(),
      rawRecord: rawItem
    }));
  }
}

// Fetch Live AdSets with Master List + Left Join Consolidation
export async function fetchAdSets(config: MetaConfig, campaigns?: MetaCampaign[], dateRange?: any): Promise<MetaAdSet[]> {
  if (!config.isConnected || !config.accessToken || !config.selectedAccountId) {
    return [];
  }

  const actId = toActAccountId(config.selectedAccountId);
  const normAcc = normalizeAccountId(config.selectedAccountId);
  const cacheKey = getCacheKey(config.selectedAccountId, 'adsets', dateRange);

  const dateParams = buildDateParams(dateRange);

  try {
    // 1. ALWAYS FETCH Master List of AdSets (No date_preset / time_range params)
    let rawAdSets: any[] = [];
    try {
      rawAdSets = await fetchAllPages(`${GRAPH_API_BASE}/${actId}/adsets`, {
        access_token: config.accessToken.trim(),
        fields: 'id,name,status,effective_status,configured_status,campaign_id,campaign{name},daily_budget,lifetime_budget,targeting,start_time,end_time,issues_info',
        limit: 500
      });
      if (rawAdSets && rawAdSets.length > 0) {
        masterAdSetsStore.set(normAcc, rawAdSets);
      }
    } catch (e) {
      console.warn('Failed to fetch live master adsets list, using fallback store:', e);
      rawAdSets = masterAdSetsStore.get(normAcc) || [];
    }

    if ((!rawAdSets || rawAdSets.length === 0) && masterAdSetsStore.has(normAcc)) {
      rawAdSets = masterAdSetsStore.get(normAcc) || [];
    }

    // 2. Query AdSet Level Insights for the filtered date period
    const adsetInsightsMap = new Map<string, any>();
    try {
      const insightsList = await fetchAllPages(`${GRAPH_API_BASE}/${actId}/insights`, {
        access_token: config.accessToken.trim(),
        level: 'adset',
        fields: 'adset_id,spend,impressions,inline_link_clicks,inline_link_click_ctr,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type,video_thruplay_watched_actions,video_p50_watched_actions',
        limit: 500,
        ...dateParams
      });
      insightsList.forEach((ins: any) => {
        if (ins.adset_id) {
          adsetInsightsMap.set(ins.adset_id, ins);
        }
      });
    } catch (err) {
      console.warn('Adset level insights query warning:', err);
    }

    // 3. LEFT JOIN: Merge Master List with Period Insights
    const result = rawAdSets.map((rawItem: any) => {
      try {
        const periodInsight = adsetInsightsMap.get(rawItem.id);
        const itemWithInsight = {
          ...rawItem,
          insights: periodInsight ? { data: [periodInsight] } : { data: [] }
        };

        const parsed = extractNormalizedMetrics(itemWithInsight);
        const deliveryInfo = resolveDeliveryStatus(rawItem, 'ADSET');
        const fetchedAt = new Date().toISOString();

        let targetingSummary = 'Não especificado';
        if (rawItem.targeting) {
          const geo = rawItem.targeting.geo_locations?.countries?.join(', ') || 'Brasil';
          const minAge = rawItem.targeting.min_age || 18;
          const maxAge = rawItem.targeting.max_age || '65+';
          targetingSummary = `${geo} | ${minAge}-${maxAge} anos`;
        }

        const lineage: DataLineage = {
          source: 'META_MARKETING_API',
          endpoint: `${actId}/adsets`,
          apiVersion: DEFAULT_API_VERSION,
          fetchedAt,
          accountId: config.selectedAccountId,
          level: 'ADSET',
          recordId: rawItem.id,
          rawRecord: rawItem,
          reconciliationStatus: 'VALID'
        };

        rawAuditStore.set(`ADSET:${rawItem.id}`, { raw: rawItem, lineage });

        return {
          id: rawItem.id,
          campaign_id: rawItem.campaign_id || rawItem.campaign?.id || '',
          campaign_name: rawItem.campaign?.name || 'Campanha Meta',
          name: rawItem.name || `Conjunto ${rawItem.id}`,
          status: (rawItem.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED') as 'ACTIVE' | 'PAUSED',
          effective_status: rawItem.effective_status || rawItem.status || 'PAUSED',
          deliveryInfo,
          targeting_summary: targetingSummary,
          daily_budget: rawItem.daily_budget ? parseFloat(rawItem.daily_budget) / 100 : null,
          lifetime_budget: rawItem.lifetime_budget ? parseFloat(rawItem.lifetime_budget) / 100 : null,
          spend: parsed.spend,
          impressions: parsed.impressions,
          clicks: parsed.clicks,
          ctr: parsed.ctr,
          cpc: parsed.cpc,
          conversions: parsed.conversions,
          resultLabel: parsed.resultLabel,
          cpa: parsed.cpa,
          roas: parsed.roas,
          reach: parsed.reach,
          frequency: parsed.frequency,
          cpm: parsed.cpm,
          profileVisits: parsed.profileVisits,
          retentionPct: parsed.retentionPct,
          followersGained: parsed.followersGained,
          cps: parsed.cps,
          landingPageViews: parsed.landingPageViews,
          rawRecord: rawItem,
          lineage
        };
      } catch (itemErr) {
        console.warn('Failed to parse individual adset item, returning safe default:', itemErr);
        return {
          id: rawItem.id,
          campaign_id: rawItem.campaign_id || rawItem.campaign?.id || '',
          campaign_name: rawItem.campaign?.name || 'Campanha Meta',
          name: rawItem.name || 'Conjunto Meta',
          status: (rawItem.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED') as 'ACTIVE' | 'PAUSED',
          effective_status: rawItem.effective_status || rawItem.status || 'PAUSED',
          deliveryInfo: { code: 'ACTIVE' as const, label: 'Ativo', badgeColor: 'green' as const },
          targeting_summary: 'Brasil | 18-65+ anos',
          daily_budget: rawItem.daily_budget ? parseFloat(rawItem.daily_budget) / 100 : null,
          lifetime_budget: rawItem.lifetime_budget ? parseFloat(rawItem.lifetime_budget) / 100 : null,
          spend: null,
          impressions: null,
          clicks: null,
          ctr: null,
          cpc: null,
          conversions: null,
          resultLabel: 'Leads',
          cpa: null,
          roas: null,
          reach: null,
          frequency: null,
          cpm: null,
          profileVisits: null,
          retentionPct: null,
          followersGained: null,
          cps: null,
          landingPageViews: null,
          rawRecord: rawItem
        };
      }
    });

    if (result.length > 0) {
      metaInsightsCache.set(cacheKey, { data: result, timestamp: Date.now() });
    }

    return result;
  } catch (err) {
    console.error('Meta API adsets fetch failed, returning stored master list fallback:', err);
    const fallbackList = masterAdSetsStore.get(normAcc) || [];
    return fallbackList.map((rawItem: any) => ({
      id: rawItem.id,
      campaign_id: rawItem.campaign_id || rawItem.campaign?.id || '',
      campaign_name: rawItem.campaign?.name || 'Campanha Meta',
      name: rawItem.name,
      status: (rawItem.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED') as 'ACTIVE' | 'PAUSED',
      effective_status: rawItem.effective_status || rawItem.status,
      deliveryInfo: resolveDeliveryStatus(rawItem, 'ADSET'),
      targeting_summary: 'Brasil | 18-65+ anos',
      daily_budget: rawItem.daily_budget ? parseFloat(rawItem.daily_budget) / 100 : null,
      lifetime_budget: rawItem.lifetime_budget ? parseFloat(rawItem.lifetime_budget) / 100 : null,
      spend: null,
      impressions: null,
      clicks: null,
      ctr: null,
      cpc: null,
      conversions: null,
      resultLabel: 'Leads',
      cpa: null,
      roas: null,
      reach: null,
      frequency: null,
      cpm: null,
      profileVisits: null,
      retentionPct: null,
      followersGained: null,
      cps: null,
      landingPageViews: null,
      rawRecord: rawItem
    }));
  }
}

// Fetch Live Ads with Master List + Left Join Consolidation
export async function fetchAds(config: MetaConfig, adsets?: MetaAdSet[], dateRange?: any): Promise<MetaAd[]> {
  if (!config.isConnected || !config.accessToken || !config.selectedAccountId) {
    return [];
  }

  const actId = toActAccountId(config.selectedAccountId);
  const normAcc = normalizeAccountId(config.selectedAccountId);
  const cacheKey = getCacheKey(config.selectedAccountId, 'ads', dateRange);

  const dateParams = buildDateParams(dateRange);

  try {
    // 1. ALWAYS FETCH Master List of Ads (No date_preset / time_range params)
    let rawAds: any[] = [];
    try {
      rawAds = await fetchAllPages(`${GRAPH_API_BASE}/${actId}/ads`, {
        access_token: config.accessToken.trim(),
        fields: 'id,name,status,effective_status,configured_status,adset_id,adset{name},campaign_id,campaign{name},creative{thumbnail_url,title,body,image_url},ad_review_feedback,issues_info',
        limit: 500
      });
      if (rawAds && rawAds.length > 0) {
        masterAdsStore.set(normAcc, rawAds);
      }
    } catch (e) {
      console.warn('Failed to fetch live master ads list, using fallback store:', e);
      rawAds = masterAdsStore.get(normAcc) || [];
    }

    if ((!rawAds || rawAds.length === 0) && masterAdsStore.has(normAcc)) {
      rawAds = masterAdsStore.get(normAcc) || [];
    }

    // 2. Query Ad Level Insights for the filtered date period
    const adInsightsMap = new Map<string, any>();
    try {
      const insightsList = await fetchAllPages(`${GRAPH_API_BASE}/${actId}/insights`, {
        access_token: config.accessToken.trim(),
        level: 'ad',
        fields: 'ad_id,spend,impressions,inline_link_clicks,inline_link_click_ctr,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type,video_thruplay_watched_actions,video_p50_watched_actions',
        limit: 500,
        ...dateParams
      });
      insightsList.forEach((ins: any) => {
        if (ins.ad_id) {
          adInsightsMap.set(ins.ad_id, ins);
        }
      });
    } catch (err) {
      console.warn('Ad level insights query warning:', err);
    }

    // 3. LEFT JOIN: Merge Master List with Period Insights
    const result = rawAds.map((rawItem: any) => {
      try {
        const periodInsight = adInsightsMap.get(rawItem.id);
        const itemWithInsight = {
          ...rawItem,
          insights: periodInsight ? { data: [periodInsight] } : { data: [] }
        };

        const parsed = extractNormalizedMetrics(itemWithInsight);
        const deliveryInfo = resolveDeliveryStatus(rawItem, 'AD');
        const creative = rawItem.creative || {};
        const fetchedAt = new Date().toISOString();

        const lineage: DataLineage = {
          source: 'META_MARKETING_API',
          endpoint: `${actId}/ads`,
          apiVersion: DEFAULT_API_VERSION,
          fetchedAt,
          accountId: config.selectedAccountId,
          level: 'AD',
          recordId: rawItem.id,
          rawRecord: rawItem,
          reconciliationStatus: 'VALID'
        };

        rawAuditStore.set(`AD:${rawItem.id}`, { raw: rawItem, lineage });

        return {
          id: rawItem.id,
          adset_id: rawItem.adset_id || rawItem.adset?.id || '',
          adset_name: rawItem.adset?.name || 'Conjunto de Anúncios',
          campaign_id: rawItem.campaign_id || rawItem.campaign?.id || '',
          campaign_name: rawItem.campaign?.name || 'Campanha Meta',
          name: rawItem.name || `Anúncio ${rawItem.id}`,
          status: (rawItem.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED') as 'ACTIVE' | 'PAUSED',
          effective_status: rawItem.effective_status || rawItem.status || 'PAUSED',
          deliveryInfo,
          format: 'IMAGE' as 'IMAGE' | 'VIDEO' | 'CAROUSEL',
          thumbnail_url: creative.thumbnail_url || creative.image_url || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&auto=format&fit=crop&q=80',
          headline: creative.title || creative.body || 'Criativo Ativo no Meta Ads',
          spend: parsed.spend,
          impressions: parsed.impressions,
          clicks: parsed.clicks,
          ctr: parsed.ctr,
          cpc: parsed.cpc,
          cpm: parsed.cpm,
          reach: parsed.reach,
          frequency: parsed.frequency,
          conversions: parsed.conversions,
          resultLabel: parsed.resultLabel,
          cpa: parsed.cpa,
          profileVisits: parsed.profileVisits,
          retentionPct: parsed.retentionPct,
          followersGained: parsed.followersGained,
          cps: parsed.cps,
          landingPageViews: parsed.landingPageViews,
          roas: parsed.roas,
          rawRecord: rawItem,
          lineage
        };
      } catch (itemErr) {
        console.warn('Failed to parse individual ad item, returning safe default:', itemErr);
        const creative = rawItem.creative || {};
        return {
          id: rawItem.id,
          adset_id: rawItem.adset_id || rawItem.adset?.id || '',
          adset_name: rawItem.adset?.name || 'Conjunto de Anúncios',
          campaign_id: rawItem.campaign_id || rawItem.campaign?.id || '',
          campaign_name: rawItem.campaign?.name || 'Campanha Meta',
          name: rawItem.name || 'Anúncio Meta',
          status: (rawItem.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED') as 'ACTIVE' | 'PAUSED',
          effective_status: rawItem.effective_status || rawItem.status || 'PAUSED',
          deliveryInfo: { code: 'ACTIVE' as const, label: 'Ativo', badgeColor: 'green' as const },
          format: 'IMAGE' as 'IMAGE' | 'VIDEO' | 'CAROUSEL',
          thumbnail_url: creative.thumbnail_url || creative.image_url || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&auto=format&fit=crop&q=80',
          headline: creative.title || creative.body || 'Criativo Ativo no Meta Ads',
          spend: null,
          impressions: null,
          clicks: null,
          ctr: null,
          cpc: null,
          cpm: null,
          reach: null,
          frequency: null,
          conversions: null,
          resultLabel: 'Leads',
          cpa: null,
          profileVisits: null,
          retentionPct: null,
          followersGained: null,
          cps: null,
          landingPageViews: null,
          roas: null,
          rawRecord: rawItem
        };
      }
    });

    if (result.length > 0) {
      metaInsightsCache.set(cacheKey, { data: result, timestamp: Date.now() });
    }

    return result;
  } catch (err) {
    console.error('Meta API ads fetch failed, returning stored master list fallback:', err);
    const fallbackList = masterAdsStore.get(normAcc) || [];
    return fallbackList.map((rawItem: any) => {
      const creative = rawItem.creative || {};
      return {
        id: rawItem.id,
        adset_id: rawItem.adset_id || rawItem.adset?.id || '',
        adset_name: rawItem.adset?.name || 'Conjunto de Anúncios',
        campaign_id: rawItem.campaign_id || rawItem.campaign?.id || '',
        campaign_name: rawItem.campaign?.name || 'Campanha Meta',
        name: rawItem.name,
        status: (rawItem.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED') as 'ACTIVE' | 'PAUSED',
        effective_status: rawItem.effective_status || rawItem.status,
        deliveryInfo: resolveDeliveryStatus(rawItem, 'AD'),
        format: 'IMAGE' as 'IMAGE' | 'VIDEO' | 'CAROUSEL',
        thumbnail_url: creative.thumbnail_url || creative.image_url || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&auto=format&fit=crop&q=80',
        headline: creative.title || creative.body || 'Criativo Ativo no Meta Ads',
        spend: null,
        impressions: null,
        clicks: null,
        ctr: null,
        cpc: null,
        cpm: null,
        reach: null,
        frequency: null,
        conversions: null,
        resultLabel: 'Leads',
        cpa: null,
        profileVisits: null,
        retentionPct: null,
        followersGained: null,
        cps: null,
        landingPageViews: null,
        roas: null,
        rawRecord: rawItem
      };
    });
  }
}

// Strict Data Summary Calculator & Reconciliation Engine
export function computeSummaryMetrics(campaigns: MetaCampaign[]): DashboardSummary {
  if (!campaigns || campaigns.length === 0) {
    return {
      investimentoTotal: null,
      impressioesTotal: null,
      cliquesTotal: null,
      ctrMedio: null,
      cpcMedio: null,
      leadsTotal: null,
      cpaMedio: null,
      roasMedio: null,
      reconciliationStatus: 'INCOMPLETE',
      totalCampaigns: 0
    };
  }

  let totalSpend = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let hasSpend = false;
  let hasImpressions = false;
  let hasClicks = false;
  let hasConversions = false;

  campaigns.forEach((c) => {
    if (c.spend !== null) {
      totalSpend += c.spend;
      hasSpend = true;
    }
    if (c.impressions !== null) {
      totalImpressions += c.impressions;
      hasImpressions = true;
    }
    if (c.clicks !== null) {
      totalClicks += c.clicks;
      hasClicks = true;
    }
    if (c.conversions !== null) {
      totalConversions += c.conversions;
      hasConversions = true;
    }
  });

  const ctrMedio = hasImpressions && totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null;
  const cpcMedio = hasClicks && totalClicks > 0 ? totalSpend / totalClicks : null;
  const cpaMedio = hasConversions && totalConversions > 0 ? totalSpend / totalConversions : null;

  return {
    investimentoTotal: hasSpend ? totalSpend : null,
    impressioesTotal: hasImpressions ? totalImpressions : null,
    cliquesTotal: hasClicks ? totalClicks : null,
    ctrMedio: ctrMedio !== null ? parseFloat(ctrMedio.toFixed(2)) : null,
    cpcMedio: cpcMedio !== null ? parseFloat(cpcMedio.toFixed(2)) : null,
    leadsTotal: hasConversions ? totalConversions : null,
    cpaMedio: cpaMedio !== null ? parseFloat(cpaMedio.toFixed(2)) : null,
    roasMedio: null,
    reconciliationStatus: 'VALID',
    totalCampaigns: campaigns.length
  };
}
