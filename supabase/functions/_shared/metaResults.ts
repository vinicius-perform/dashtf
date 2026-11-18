/**
 * Lógica pura (sem Deno/Node APIs) para reproduzir as colunas do Gerenciador de Anúncios:
 * "Resultados", "Custo por resultado", "Valor gasto" e orçamento diário.
 *
 * Regras principais:
 * - Resultado é definido por CONJUNTO DE ANÚNCIOS, conforme a meta de desempenho
 *   (optimization_goal). Nunca somamos tipos de ação diferentes (ex.: `lead` +
 *   `onsite_web_lead`), pois a Meta devolve o agregado e as partes ao mesmo tempo.
 * - Fonte preferencial: campo nativo `results` / `cost_per_result` do Insights
 *   (o mesmo que o Gerenciador usa). Fallback: mapeamento optimization_goal -> action_type,
 *   pegando apenas o PRIMEIRO action_type encontrado.
 * - Custo por resultado da conta = gasto dos conjuntos daquela categoria / resultados.
 */

export type ResultCategory = 'leads' | 'conversas' | 'visitas' | 'outros';

export interface ActionEntry {
  action_type: string;
  value: string | number;
}

export interface AdsetInsightRow {
  adset_id?: string;
  campaign_id?: string;
  optimization_goal?: string;
  spend?: string | number;
  impressions?: string | number;
  reach?: string | number;
  clicks?: string | number;
  actions?: ActionEntry[];
  cost_per_action_type?: ActionEntry[];
  results?: any;
  cost_per_result?: any;
}

export interface AdsetMeta {
  id: string;
  campaign_id?: string;
  optimization_goal?: string;
  promoted_object?: Record<string, any> | null;
  destination_type?: string;
}

export interface AdsetResult {
  adset_id: string | null;
  category: ResultCategory;
  indicator: string | null;
  count: number;
  spend: number;
  source: 'meta_results' | 'optimization_goal' | 'none';
}

export interface CategoryTotals {
  count: number;
  spend: number;
}

export interface AccountResults {
  resultsType: ResultCategory | 'nenhum';
  resultsCount: number;
  cpl: number | null;
  indicator: string | null;
  breakdown: Record<ResultCategory, CategoryTotals>;
  totalSpend: number;
  adsets: AdsetResult[];
}

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '0'));
  return Number.isFinite(n) ? n : 0;
};

export const round2 = (v: number): number => Math.round(v * 100) / 100;

export function stripIndicator(indicator: string): string {
  return indicator.replace(/^actions:/, '').replace(/^cost_per_action_type:/, '').trim();
}

/** Classifica um action_type / indicador em uma das categorias exibidas no painel. */
export function classifyActionType(raw: string | null | undefined): ResultCategory {
  if (!raw) return 'outros';
  const t = stripIndicator(raw).toLowerCase();
  if (t.includes('messaging') || t.includes('conversation') || t.includes('total_messaging_connection')) {
    return 'conversas';
  }
  if (
    t === 'lead' ||
    t.includes('lead') ||
    t.startsWith('offsite_conversion.custom.') // conversões personalizadas são tratadas como lead pela agência
  ) {
    return 'leads';
  }
  if (
    t === 'link_click' ||
    t === 'landing_page_view' ||
    t.includes('profile_visit') ||
    t === 'outbound_click'
  ) {
    return 'visitas';
  }
  return 'outros';
}

/** Categoria a partir da meta de desempenho do conjunto (usada quando não há resultado no período). */
export function classifyOptimizationGoal(goal?: string, promoted?: Record<string, any> | null): ResultCategory {
  switch ((goal || '').toUpperCase()) {
    case 'LEAD_GENERATION':
    case 'QUALITY_LEAD':
    case 'QUALITY_CALL':
      return 'leads';
    case 'CONVERSATIONS':
    case 'REPLIES':
    case 'MESSAGING_PURCHASE_CONVERSION':
    case 'MESSAGING_APPOINTMENT_CONVERSION':
      return 'conversas';
    case 'LINK_CLICKS':
    case 'LANDING_PAGE_VIEWS':
    case 'PROFILE_VISIT':
    case 'VISIT_INSTAGRAM_PROFILE':
      return 'visitas';
    case 'OFFSITE_CONVERSIONS':
    case 'VALUE': {
      const ev = String(promoted?.custom_event_type || '').toUpperCase();
      if (ev === 'LEAD' || ev === 'COMPLETE_REGISTRATION' || ev === 'CONTACT' || ev === 'SUBMIT_APPLICATION' || ev === 'SCHEDULE') return 'leads';
      if (promoted?.custom_conversion_id) return 'leads';
      return 'outros';
    }
    default:
      return 'outros';
  }
}

/** action_types candidatos (em ordem de prioridade) para cada meta de desempenho. */
export function candidateActionTypes(goal?: string, promoted?: Record<string, any> | null): string[] {
  const g = (goal || '').toUpperCase();
  switch (g) {
    case 'LEAD_GENERATION':
    case 'QUALITY_LEAD':
      return ['onsite_conversion.lead_grouped', 'leadgen_grouped', 'lead', 'onsite_conversion.lead'];
    case 'CONVERSATIONS':
    case 'REPLIES':
      return ['onsite_conversion.messaging_conversation_started_7d', 'onsite_conversion.total_messaging_connection'];
    case 'LINK_CLICKS':
      return ['link_click'];
    case 'LANDING_PAGE_VIEWS':
      return ['landing_page_view'];
    case 'PROFILE_VISIT':
    case 'VISIT_INSTAGRAM_PROFILE':
      return ['ig_profile_visit', 'instagram_profile_visit', 'profile_visit', 'link_click'];
    case 'POST_ENGAGEMENT':
      return ['post_engagement'];
    case 'OFFSITE_CONVERSIONS':
    case 'VALUE': {
      if (promoted?.custom_conversion_id) return [`offsite_conversion.custom.${promoted.custom_conversion_id}`];
      const ev = String(promoted?.custom_event_type || '').toUpperCase();
      const map: Record<string, string[]> = {
        LEAD: ['offsite_conversion.fb_pixel_lead', 'lead'],
        PURCHASE: ['offsite_conversion.fb_pixel_purchase', 'omni_purchase', 'purchase'],
        COMPLETE_REGISTRATION: ['offsite_conversion.fb_pixel_complete_registration', 'complete_registration'],
        CONTACT: ['offsite_conversion.fb_pixel_contact', 'contact'],
        SCHEDULE: ['offsite_conversion.fb_pixel_schedule', 'schedule'],
        SUBMIT_APPLICATION: ['offsite_conversion.fb_pixel_submit_application', 'submit_application'],
        INITIATED_CHECKOUT: ['offsite_conversion.fb_pixel_initiate_checkout', 'initiate_checkout'],
        ADD_TO_CART: ['offsite_conversion.fb_pixel_add_to_cart', 'add_to_cart']
      };
      return map[ev] || ['offsite_conversion.fb_pixel_lead', 'lead'];
    }
    default:
      return [];
  }
}

/**
 * Lê o campo nativo `results` do Insights. Formato devolvido pela Meta:
 *   [{ indicator: "actions:onsite_conversion.messaging_conversation_started_7d",
 *      values: [{ value: "9", attribution_windows: ["default"] }] }]
 * Aceita variações (value direto, sem prefixo `actions:`). Nunca soma indicadores diferentes.
 */
export function readNativeResults(results: any): { indicator: string | null; count: number } | null {
  const list: any[] = Array.isArray(results) ? results : Array.isArray(results?.data) ? results.data : [];
  if (list.length === 0) return null;

  let best: { indicator: string | null; count: number } | null = null;
  for (const entry of list) {
    if (!entry) continue;
    const indicator = typeof entry.indicator === 'string' ? stripIndicator(entry.indicator) : null;
    let count = 0;
    if (Array.isArray(entry.values) && entry.values.length > 0) {
      // Se houver várias janelas de atribuição, usa a "default" (configuração do anúncio)
      const def = entry.values.find((v: any) => !v?.attribution_windows || v.attribution_windows.includes('default')) || entry.values[0];
      count = num(def?.value);
    } else if (entry.value !== undefined) {
      count = num(entry.value);
    }
    if (!best || count > best.count) best = { indicator, count };
  }
  return best;
}

/** Lê `cost_per_result` (mesmo formato de `results`) para o indicador escolhido. */
export function readNativeCost(costPerResult: any, indicator: string | null): number | null {
  const list: any[] = Array.isArray(costPerResult) ? costPerResult : Array.isArray(costPerResult?.data) ? costPerResult.data : [];
  if (list.length === 0) return null;
  const entry = (indicator && list.find((e) => e && typeof e.indicator === 'string' && stripIndicator(e.indicator) === indicator)) || list[0];
  if (!entry) return null;
  const raw = Array.isArray(entry.values) && entry.values.length > 0
    ? (entry.values.find((v: any) => !v?.attribution_windows || v.attribution_windows.includes('default')) || entry.values[0])?.value
    : entry.value;
  const v = num(raw);
  return v > 0 ? round2(v) : null;
}

/** Rótulo em português para a coluna "Resultados". */
export function resultLabelFor(indicator: string | null, category: ResultCategory): string {
  const t = indicator ? stripIndicator(indicator).toLowerCase() : '';
  if (category === 'conversas') return 'Conversas Iniciadas';
  if (category === 'leads') return 'Leads';
  if (t === 'link_click') return 'Cliques no Link';
  if (t === 'landing_page_view') return 'Visualizações da Página';
  if (t.includes('profile_visit')) return 'Visitas ao Perfil';
  if (t.includes('purchase')) return 'Compras';
  if (t === 'post_engagement') return 'Engajamentos';
  if (t.includes('thruplay')) return 'ThruPlays';
  if (t === 'reach') return 'Alcance';
  if (category === 'visitas') return 'Visitas';
  return 'Resultados';
}

/** Fallback: primeiro action_type candidato presente (sem somar). */
export function pickActionCount(actions: ActionEntry[] | undefined, candidates: string[]): { indicator: string | null; count: number } {
  if (!Array.isArray(actions) || candidates.length === 0) return { indicator: null, count: 0 };
  for (const c of candidates) {
    const hit = actions.find((a) => a && a.action_type === c);
    if (hit) return { indicator: c, count: num(hit.value) };
  }
  return { indicator: candidates[0], count: 0 };
}

/** Resultado de um conjunto de anúncios no período. */
export function computeAdsetResult(row: AdsetInsightRow, meta?: AdsetMeta): AdsetResult {
  const spend = num(row.spend);
  const goal = row.optimization_goal || meta?.optimization_goal;
  const promoted = meta?.promoted_object || null;

  const native = readNativeResults(row.results);
  if (native && native.indicator) {
    const category = classifyActionType(native.indicator);
    return {
      adset_id: row.adset_id ?? null,
      category: category === 'outros' ? classifyOptimizationGoal(goal, promoted) : category,
      indicator: native.indicator,
      count: native.count,
      spend,
      source: 'meta_results'
    };
  }

  const candidates = candidateActionTypes(goal, promoted);
  if (candidates.length > 0) {
    const picked = pickActionCount(row.actions, candidates);
    return {
      adset_id: row.adset_id ?? null,
      category: classifyOptimizationGoal(goal, promoted) !== 'outros'
        ? classifyOptimizationGoal(goal, promoted)
        : classifyActionType(picked.indicator),
      indicator: picked.indicator,
      count: picked.count,
      spend,
      source: 'optimization_goal'
    };
  }

  return { adset_id: row.adset_id ?? null, category: 'outros', indicator: null, count: 0, spend, source: 'none' };
}

const CATEGORY_PRIORITY: ResultCategory[] = ['leads', 'conversas', 'visitas', 'outros'];

/**
 * Consolida os conjuntos em uma linha de conta.
 * A categoria exibida é a que concentra mais gasto (desempate: leads > conversas > visitas > outros).
 * O custo por resultado usa apenas o gasto dos conjuntos daquela categoria.
 */
export function aggregateAccountResults(rows: AdsetInsightRow[], metaById: Record<string, AdsetMeta> = {}): AccountResults {
  const breakdown: Record<ResultCategory, CategoryTotals> = {
    leads: { count: 0, spend: 0 },
    conversas: { count: 0, spend: 0 },
    visitas: { count: 0, spend: 0 },
    outros: { count: 0, spend: 0 }
  };
  const adsets: AdsetResult[] = [];
  let totalSpend = 0;
  const indicatorCount: Record<string, number> = {};

  for (const row of rows || []) {
    const r = computeAdsetResult(row, row.adset_id ? metaById[row.adset_id] : undefined);
    adsets.push(r);
    totalSpend += r.spend;
    breakdown[r.category].count += r.count;
    breakdown[r.category].spend += r.spend;
    if (r.indicator && r.count > 0) indicatorCount[r.indicator] = (indicatorCount[r.indicator] || 0) + r.count;
  }

  let chosen: ResultCategory | null = null;
  for (const cat of CATEGORY_PRIORITY) {
    const b = breakdown[cat];
    if (b.count <= 0) continue;
    if (!chosen || b.spend > breakdown[chosen].spend) chosen = cat;
  }

  for (const cat of CATEGORY_PRIORITY) {
    breakdown[cat].spend = round2(breakdown[cat].spend);
  }

  if (!chosen) {
    return { resultsType: 'nenhum', resultsCount: 0, cpl: null, indicator: null, breakdown, totalSpend: round2(totalSpend), adsets };
  }

  const b = breakdown[chosen];
  const indicator = Object.entries(indicatorCount)
    .filter(([ind]) => classifyActionType(ind) === chosen || chosen === 'outros')
    .sort((a, z) => z[1] - a[1])[0]?.[0] ?? null;

  return {
    resultsType: b.count > 0 ? chosen : 'nenhum',
    resultsCount: b.count,
    cpl: b.count > 0 ? round2(b.spend / b.count) : null,
    indicator,
    breakdown,
    totalSpend: round2(totalSpend),
    adsets
  };
}

// ---------------------------------------------------------------------------
// Orçamento diário (equivalente ao que está rodando no Gerenciador)
// ---------------------------------------------------------------------------

export interface BudgetCampaign {
  id: string;
  effective_status?: string;
  daily_budget?: string | number | null;
  lifetime_budget?: string | number | null;
  start_time?: string | null;
  stop_time?: string | null;
}

export interface BudgetAdset {
  id: string;
  campaign_id?: string;
  effective_status?: string;
  daily_budget?: string | number | null;
  lifetime_budget?: string | number | null;
  start_time?: string | null;
  end_time?: string | null;
}

const DAY_MS = 86_400_000;

function lifetimeAsDaily(lifetimeMinor: number, start?: string | null, end?: string | null, now = new Date()): number {
  if (!lifetimeMinor) return 0;
  const s = start ? new Date(start) : now;
  const e = end ? new Date(end) : null;
  if (!e || isNaN(e.getTime()) || isNaN(s.getTime())) return 0;
  const days = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / DAY_MS));
  return lifetimeMinor / days;
}

/**
 * Soma orçamentos ativos (em unidades menores da moeda, ex.: centavos):
 * - Campanhas com orçamento de campanha (CBO) contam pelo orçamento da campanha;
 * - Campanhas sem orçamento próprio contam pela soma dos conjuntos ativos (ABO);
 * - Orçamento vitalício é convertido em média diária pela duração programada.
 * Só considera effective_status === 'ACTIVE' (o que de fato está veiculando).
 */
export function computeDailyBudgetMinor(campaigns: BudgetCampaign[], adsets: BudgetAdset[], now = new Date()): number {
  const activeCampaigns = (campaigns || []).filter((c) => c.effective_status === 'ACTIVE');
  const activeIds = new Set(activeCampaigns.map((c) => c.id));
  const cboIds = new Set<string>();
  let total = 0;

  for (const c of activeCampaigns) {
    const daily = num(c.daily_budget);
    const lifetime = num(c.lifetime_budget);
    if (daily > 0) {
      total += daily;
      cboIds.add(c.id);
    } else if (lifetime > 0) {
      total += lifetimeAsDaily(lifetime, c.start_time, c.stop_time, now);
      cboIds.add(c.id);
    }
  }

  for (const a of adsets || []) {
    if (a.effective_status !== 'ACTIVE') continue;
    if (!a.campaign_id || !activeIds.has(a.campaign_id) || cboIds.has(a.campaign_id)) continue;
    const daily = num(a.daily_budget);
    const lifetime = num(a.lifetime_budget);
    if (daily > 0) total += daily;
    else if (lifetime > 0) total += lifetimeAsDaily(lifetime, a.start_time, a.end_time, now);
  }

  return Math.round(total);
}

// ---------------------------------------------------------------------------
// Datas no fuso horário da conta
// ---------------------------------------------------------------------------

/** YYYY-MM-DD de `date` no fuso informado (ex.: America/Sao_Paulo). */
export function dateInTimezone(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  } catch {
    return dateInTimezone(date, 'America/Sao_Paulo');
  }
}

/** Número de dias (inclusivo) do intervalo, limitado até "hoje" no fuso da conta. */
export function elapsedDaysInRange(since: string, until: string, today: string): number {
  const end = until > today ? today : until;
  if (end < since) return 0;
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${since}T00:00:00Z`);
  return Math.floor(ms / DAY_MS) + 1;
}

/**
 * Tenta extrair o saldo disponível de contas pré-pagas a partir de
 * funding_source_details.display_string (ex.: "Saldo disponível (R$ 1.234,56 BRL)").
 */
export function parsePrepaidBalance(display?: string | null): number | null {
  if (!display) return null;
  const inParens = display.match(/\(([^)]*\d[^)]*)\)/);
  const target = inParens ? inParens[1] : display;
  const m = target.match(/(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/);
  if (!m) return null;
  let s = m[1].replace(/\s/g, '');
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > lastDot) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(/,/g, '');
  }
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : null;
}
