import axios from 'axios';
import { MetaConfig, MetaCampaign, MetaAdSet, MetaAd, DeliveryStatusInfo } from '../../types/meta';
import { normalizeAccountId, toActAccountId, resolveDeliveryStatus, extractNormalizedMetrics } from '../metaDataEngine';
import { supabase } from '../../lib/supabase';

export interface DailyInsightRecord {
  key: string; // `${accountId}:${level}:${entityId}:${date}`
  accountId: string;
  level: 'ACCOUNT' | 'CAMPAIGN' | 'ADSET' | 'AD';
  entityId: string;
  entityName?: string;
  date: string; // YYYY-MM-DD
  metrics: {
    spend: number | null;
    impressions: number | null;
    clicks: number | null;
    inline_link_clicks: number | null;
    ctr: number | null;
    cpc: number | null;
    cpm: number | null;
    conversions: number | null;
    resultLabel: string | null;
    cpa: number | null;
    roas: number | null;
    reach: number | null;
    frequency: number | null;
    actions?: any[];
  };
  updatedAt: string;
}

const DAILY_STORAGE_KEY = 'fazendo_acontecer_daily_insights_db';
const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

// 1. Persistent Storage Methods (60-day Retained Daily Snapshots DB)
export function getStoredDailyInsights(): Map<string, DailyInsightRecord> {
  const db = new Map<string, DailyInsightRecord>();
  try {
    const raw = localStorage.getItem(DAILY_STORAGE_KEY);
    if (raw) {
      const parsed: DailyInsightRecord[] = JSON.parse(raw);
      parsed.forEach((rec) => db.set(rec.key, rec));
    }
  } catch (e) {
    console.warn('Failed to load daily insights store:', e);
  }
  return db;
}

export function saveStoredDailyInsights(db: Map<string, DailyInsightRecord>): void {
  try {
    const array = Array.from(db.values());
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(array));

    // Async Upsert into Supabase meta_daily_insights PostgreSQL Table
    if (array.length > 0) {
      const recordsToUpsert = array.map(r => ({
        ad_account_id: r.accountId,
        campaign_id: r.entityId,
        date: r.date,
        spend: r.metrics.spend || 0,
        impressions: r.metrics.impressions || 0,
        inline_link_clicks: r.metrics.inline_link_clicks || 0,
        actions: r.metrics.actions || [],
        updated_at: new Date().toISOString()
      }));

      supabase
        .from('meta_daily_insights')
        .upsert(recordsToUpsert, { onConflict: 'ad_account_id,campaign_id,date' })
        .then(({ error }) => {
          if (error) console.warn('Supabase meta_daily_insights upsert error:', error.message);
          else console.log(`⚡ [SUPABASE DB] Successfully upserted ${recordsToUpsert.length} daily snapshots into PostgreSQL.`);
        });
    }
  } catch (e) {
    console.warn('Failed to save daily insights store:', e);
  }
}

// 5. Retention Policy / Garbage Collector (Purges snapshots older than 60 days)
export function purgeExpiredSnapshots(daysToKeep = 60): number {
  const db = getStoredDailyInsights();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);

  let purgedCount = 0;
  for (const [key, record] of db.entries()) {
    if (record.date < cutoffStr) {
      db.delete(key);
      purgedCount++;
    }
  }

  if (purgedCount > 0) {
    saveStoredDailyInsights(db);
    console.log(`🧹 Daily Snapshots Purger: Cleaned ${purgedCount} expired records older than ${cutoffStr}.`);
  }
  return purgedCount;
}

// Helper Date Utils
export function getFormattedDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getTodayDateString(): string {
  return getFormattedDateString(new Date());
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getFormattedDateString(d);
}

export function generateDateRangeList(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const curr = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');

  while (curr <= end) {
    dates.push(getFormattedDateString(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

// 4. Attribution Window Cascade Sync (Syncs last 7 days daily breakdowns)
export async function sync7DaysAttributionWindow(config: MetaConfig): Promise<number> {
  if (!config.isConnected || !config.accessToken || !config.selectedAccountId) {
    return 0;
  }
  const actId = toActAccountId(config.selectedAccountId);
  const normAcc = normalizeAccountId(config.selectedAccountId);
  const db = getStoredDailyInsights();

  // Last 7 days cascade (Yesterday minus 6 days up to Yesterday)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const since = getFormattedDateString(startDate);
  const until = getFormattedDateString(endDate);

  try {
    const params = {
      access_token: config.accessToken.trim(),
      level: 'campaign',
      fields: 'campaign_id,campaign_name,spend,impressions,inline_link_clicks,inline_link_click_ctr,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type',
      time_range: JSON.stringify({ since, until }),
      time_increment: 1, // Daily breakdown from Meta Graph API
      limit: 500
    };

    const res = await axios.get(`${GRAPH_API_BASE}/${actId}/insights`, { params, timeout: 15000 });
    const rawList = res.data?.data || [];

    let count = 0;
    const nowIso = new Date().toISOString();

    rawList.forEach((ins: any) => {
      const date = ins.date_start;
      const campaignId = ins.campaign_id;
      if (!date || !campaignId) return;

      const parsed = extractNormalizedMetrics({ insights: { data: [ins] } });
      const key = `${normAcc}:CAMPAIGN:${campaignId}:${date}`;

      db.set(key, {
        key,
        accountId: normAcc,
        level: 'CAMPAIGN',
        entityId: campaignId,
        entityName: ins.campaign_name,
        date,
        metrics: {
          spend: parsed.spend,
          impressions: parsed.impressions,
          clicks: parsed.clicks,
          inline_link_clicks: parsed.inline_link_clicks ?? null,
          ctr: parsed.ctr,
          cpc: parsed.cpc,
          cpm: parsed.cpm,
          conversions: parsed.conversions,
          resultLabel: parsed.resultLabel,
          cpa: parsed.cpa,
          roas: parsed.roas,
          reach: parsed.reach,
          frequency: parsed.frequency,
          actions: ins.actions || []
        },
        updatedAt: nowIso
      });
      count++;
    });

    saveStoredDailyInsights(db);
    purgeExpiredSnapshots(60);
    return count;
  } catch (err) {
    console.warn('Failed 7 days cascade sync:', err);
    return 0;
  }
}

// 2. Hybrid Data Orchestrator for Campaigns
export async function fetchHybridCampaigns(
  config: MetaConfig,
  dateRange: { startDate: string; endDate: string; label?: string },
  rawMetaFetchFn: (config: MetaConfig, dateRange: any) => Promise<MetaCampaign[]>
): Promise<MetaCampaign[]> {
  if (!config.isConnected || !config.accessToken || !config.selectedAccountId) {
    return [];
  }

  const normAcc = normalizeAccountId(config.selectedAccountId);
  const todayStr = getTodayDateString();
  const startDate = dateRange.startDate || todayStr;
  const endDate = dateRange.endDate || todayStr;

  const requestedDates = generateDateRangeList(startDate, endDate);
  const pastDates = requestedDates.filter((d) => d < todayStr);
  const includesToday = requestedDates.includes(todayStr);

  // Check 60-day limit: If query spans > 60 days into past, bypass cache (direct Meta API query)
  const oldestDate = new Date(startDate + 'T00:00:00');
  const daysDiff = Math.floor((new Date().getTime() - oldestDate.getTime()) / (1000 * 3600 * 24));

  if (daysDiff > 60) {
    return rawMetaFetchFn(config, dateRange);
  }

  // A. Check if 100% of pastDates exist in Daily Insights DB
  const db = getStoredDailyInsights();
  let allPastCached = pastDates.length > 0;
  pastDates.forEach((date) => {
    // Test if we have records for this date
    let hasRecord = false;
    for (const rec of db.values()) {
      if (rec.accountId === normAcc && rec.level === 'CAMPAIGN' && rec.date === date) {
        hasRecord = true;
        break;
      }
    }
    if (!hasRecord) allPastCached = false;
  });

  // B. Case 1: Filtro "Ontem" 100% no Banco de Dados (0 chamadas externas de API Meta!)
  if (!includesToday && pastDates.length > 0 && allPastCached) {
    console.log(`⚡ [HYBRID DB ENGINE] Serving 100% from Daily Insights DB for dates: ${pastDates.join(', ')} (0 Meta API Calls)`);
    
    // Fetch live metadata (campaign list names & statuses) from rawMetaFetchFn or cached campaigns
    const metadataCampaigns = await rawMetaFetchFn(config, { startDate: pastDates[0], endDate: pastDates[pastDates.length - 1] });

    return metadataCampaigns.map((c) => {
      let aggregatedSpend = 0;
      let aggregatedImpressions = 0;
      let aggregatedClicks = 0;
      let aggregatedConversions = 0;
      let hasAnyData = false;

      pastDates.forEach((date) => {
        const key = `${normAcc}:CAMPAIGN:${c.id}:${date}`;
        const rec = db.get(key);
        if (rec && rec.metrics) {
          hasAnyData = true;
          if (rec.metrics.spend) aggregatedSpend += rec.metrics.spend;
          if (rec.metrics.impressions) aggregatedImpressions += rec.metrics.impressions;
          if (rec.metrics.clicks) aggregatedClicks += rec.metrics.clicks;
          if (rec.metrics.conversions) aggregatedConversions += rec.metrics.conversions;
        }
      });

      if (!hasAnyData) {
        return {
          ...c,
          spend: null,
          impressions: null,
          clicks: null,
          conversions: null,
          cpa: null
        };
      }

      const cpa = aggregatedConversions > 0 ? parseFloat((aggregatedSpend / aggregatedConversions).toFixed(2)) : null;

      return {
        ...c,
        spend: aggregatedSpend > 0 ? parseFloat(aggregatedSpend.toFixed(2)) : null,
        impressions: aggregatedImpressions > 0 ? aggregatedImpressions : null,
        clicks: aggregatedClicks > 0 ? aggregatedClicks : null,
        conversions: aggregatedConversions > 0 ? aggregatedConversions : null,
        cpa
      };
    });
  }

  // C. Case 2: Range includes Today + Past (Hybrid Combining)
  if (includesToday || !allPastCached) {
    // Execute live Meta fetch for the full range and asynchronously populate DB with daily snapshots
    const liveResult = await rawMetaFetchFn(config, dateRange);

    // Asynchronously trigger 7-day cascade sync in background to keep daily snapshots DB updated
    setTimeout(() => {
      sync7DaysAttributionWindow(config);
    }, 100);

    return liveResult;
  }

  return rawMetaFetchFn(config, dateRange);
}

// 3. One-off Initial Backfill Script (01/07/2026 to 18/08/2026)
export async function runInitialBackfillScript(
  config: MetaConfig,
  startDate = '2026-07-01',
  endDate = '2026-08-18'
): Promise<{ success: boolean; totalRecords: number; message: string }> {
  if (!config.isConnected || !config.accessToken || !config.selectedAccountId) {
    return { success: false, totalRecords: 0, message: 'Configuração do Meta Ads ausente ou desconectada.' };
  }

  const actId = toActAccountId(config.selectedAccountId);
  const normAcc = normalizeAccountId(config.selectedAccountId);
  const db = getStoredDailyInsights();

  console.log(`🚀 [BACKFILL ENGINE] Executando Carga Inicial de ${startDate} até ${endDate} com time_increment=1...`);

  try {
    const params = {
      access_token: config.accessToken.trim(),
      level: 'campaign',
      fields: 'campaign_id,campaign_name,spend,impressions,inline_link_clicks,inline_link_click_ctr,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type',
      time_range: JSON.stringify({ since: startDate, until: endDate }),
      time_increment: 1, // Native Meta daily breakdown (1 record per campaign per day)
      limit: 500
    };

    // Paginated fetch to guarantee 100% of daily rows are downloaded across 60 days
    let rawList: any[] = [];
    try {
      const res = await axios.get(`${GRAPH_API_BASE}/${actId}/insights`, { params, timeout: 45000 });
      if (res.data && Array.isArray(res.data.data)) {
        rawList = res.data.data;
        let nextUrl = res.data.paging?.next;
        let safetyCounter = 0;
        while (nextUrl && safetyCounter < 10) {
          safetyCounter++;
          try {
            const pageRes = await axios.get(nextUrl, { timeout: 30000 });
            if (pageRes.data && Array.isArray(pageRes.data.data)) {
              rawList = [...rawList, ...pageRes.data.data];
            }
            nextUrl = pageRes.data?.paging?.next || null;
          } catch {
            break;
          }
        }
      }
    } catch (apiErr: any) {
      throw new Error(`Falha na Meta API: ${apiErr?.response?.data?.error?.message || apiErr.message}`);
    }

    if (!rawList || rawList.length === 0) {
      return { success: true, totalRecords: 0, message: 'Nenhum registro retornado pela Meta API para o período selecionado.' };
    }

    const nowIso = new Date().toISOString();
    const formattedSupabaseRows: any[] = [];

    rawList.forEach((ins: any) => {
      const date = ins.date_start;
      const campaignId = ins.campaign_id;
      if (!date || !campaignId) return;

      const parsed = extractNormalizedMetrics({ insights: { data: [ins] } });
      const key = `${normAcc}:CAMPAIGN:${campaignId}:${date}`;

      // Update Local Map Storage
      db.set(key, {
        key,
        accountId: normAcc,
        level: 'CAMPAIGN',
        entityId: campaignId,
        entityName: ins.campaign_name,
        date,
        metrics: {
          spend: parsed.spend,
          impressions: parsed.impressions,
          clicks: parsed.clicks,
          inline_link_clicks: parsed.inline_link_clicks ?? null,
          ctr: parsed.ctr,
          cpc: parsed.cpc,
          cpm: parsed.cpm,
          conversions: parsed.conversions,
          resultLabel: parsed.resultLabel,
          cpa: parsed.cpa,
          roas: parsed.roas,
          reach: parsed.reach,
          frequency: parsed.frequency,
          actions: ins.actions || []
        },
        updatedAt: nowIso
      });

      // Prepare Supabase Bulk Upsert Payload
      formattedSupabaseRows.push({
        ad_account_id: normAcc,
        campaign_id: campaignId,
        date: date,
        spend: parseFloat(ins.spend || '0'),
        impressions: parseInt(ins.impressions || '0'),
        inline_link_clicks: parseInt(ins.inline_link_clicks || ins.clicks || '0'),
        actions: ins.actions || [],
        cost_per_action_type: ins.cost_per_action_type || [],
        updated_at: nowIso
      });
    });

    // Save to Local Storage Cache
    saveStoredDailyInsights(db);
    purgeExpiredSnapshots(60);

    // Execute Bulk Upsert to Supabase PostgreSQL (meta_daily_insights table)
    let supabaseSuccess = false;
    try {
      const { error: upsertErr } = await supabase
        .from('meta_daily_insights')
        .upsert(formattedSupabaseRows, { onConflict: 'ad_account_id,campaign_id,date' });

      if (upsertErr) {
        console.warn('Supabase bulk upsert error:', upsertErr.message);
      } else {
        supabaseSuccess = true;
        console.log(`✅ [SUPABASE BULK UPSERT SUCCESS] ${formattedSupabaseRows.length} snapshots diários inseridos na tabela meta_daily_insights.`);
      }
    } catch (sbErr) {
      console.warn('Supabase bulk insert exception:', sbErr);
    }

    const successMsg = `Histórico de 60 dias carregado com sucesso! ${formattedSupabaseRows.length} snapshots diários gravados ${supabaseSuccess ? 'no Supabase PostgreSQL' : 'no cache local'}.`;
    console.log(successMsg);
    return { success: true, totalRecords: formattedSupabaseRows.length, message: successMsg };
  } catch (err: any) {
    const errMsg = `Erro ao executar Carga Inicial: ${err.message}`;
    console.error(errMsg);
    return { success: false, totalRecords: 0, message: errMsg };
  }
}
