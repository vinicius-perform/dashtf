export interface MetaAdAccount {
  id: string; // e.g. "1115861513053539" (normalized without act_)
  raw_id: string; // e.g. "act_1115861513053539"
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  business_id?: string;
  business_name?: string;
}

export interface FilterTag {
  id: string;
  type: 'NAME' | 'ID' | 'STATUS' | 'SPEND';
  label: string;
  value: string;
}

export interface MetaBusinessManager {
  id: string;
  name: string;
}

export interface DataLineage {
  source: 'META_MARKETING_API';
  endpoint: string;
  apiVersion: string;
  fetchedAt: string;
  accountId: string;
  level: 'ACCOUNT' | 'CAMPAIGN' | 'ADSET' | 'AD';
  recordId: string;
  rawRecord: any;
  reconciliationStatus: 'VALID' | 'WARNING' | 'ERROR' | 'INCOMPLETE';
  derivedFormulas?: Record<string, string>;
}

export type DeliveryStatusType = 
  | 'ACTIVE' 
  | 'SCHEDULED' 
  | 'IN_LEARNING' 
  | 'LEARNING_LIMITED' 
  | 'PENDING_REVIEW' 
  | 'DISAPPROVED' 
  | 'ACCOUNT_ERROR' 
  | 'NOT_DELIVERING' 
  | 'PAUSED' 
  | 'COMPLETED';

export interface DeliveryStatusInfo {
  code: DeliveryStatusType;
  label: string; // e.g. "Ativo", "Programado", "Em aprendizado", "Aprendizado limitado", "Em análise", "Rejeitado", "Pausado", "Concluído"
  badgeColor: 'green' | 'blue' | 'yellow' | 'amber' | 'red' | 'gray';
  reason?: string; // Detailed tooltip message from Meta API
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  effective_status?: string;
  deliveryInfo: DeliveryStatusInfo;
  objective: string;
  daily_budget?: number | null;
  lifetime_budget?: number | null;
  spend: number | null;
  impressions: number | null;
  clicks: number | null;
  inline_link_clicks?: number | null;
  ctr: number | null;
  cpc: number | null;
  conversions: number | null;
  resultLabel: string | null;
  cpa: number | null;
  roas: number | null;
  reach: number | null;
  frequency: number | null;
  cpm: number | null;
  profileVisits: number | null;
  retentionPct: number | null;
  followersGained: number | null;
  cps: number | null;
  landingPageViews: number | null;
  actions?: any[];
  created_time: string;
  rawRecord?: any;
  lineage?: DataLineage;
}

export interface MetaAdSet {
  id: string;
  campaign_id: string;
  campaign_name: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  effective_status?: string;
  deliveryInfo: DeliveryStatusInfo;
  targeting_summary: string;
  daily_budget?: number | null;
  spend: number | null;
  impressions: number | null;
  clicks: number | null;
  inline_link_clicks?: number | null;
  ctr: number | null;
  cpc: number | null;
  conversions: number | null;
  resultLabel: string | null;
  cpa: number | null;
  roas: number | null;
  reach: number | null;
  frequency: number | null;
  cpm: number | null;
  profileVisits: number | null;
  retentionPct: number | null;
  followersGained: number | null;
  cps: number | null;
  landingPageViews: number | null;
  actions?: any[];
  rawRecord?: any;
  lineage?: DataLineage;
}

export interface MetaAd {
  id: string;
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  effective_status?: string;
  deliveryInfo: DeliveryStatusInfo;
  format: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  thumbnail_url: string;
  headline: string;
  spend: number | null;
  impressions: number | null;
  clicks: number | null;
  inline_link_clicks?: number | null;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  reach: number | null;
  frequency: number | null;
  conversions: number | null;
  resultLabel: string | null;
  cpa: number | null;
  profileVisits: number | null;
  retentionPct: number | null;
  followersGained: number | null;
  cps: number | null;
  landingPageViews: number | null;
  actions?: any[];
  roas: number | null;
  rawRecord?: any;
  lineage?: DataLineage;
}

export interface GerenciadorSummary {
  investimentoTotal: number | null;
  cpmMedio?: number | null;
  ctrMedio: number | null;
  connectRate?: number | null;
  impressioesTotal: number | null;
  cliquesTotal: number | null;
  landingPageViewsTotal?: number | null;
  cpcMedio?: number | null;
  leadsTotal: number | null;
  cpaMedio: number | null;
  roasMedio?: number | null;
  reconciliationStatus?: 'VALID' | 'WARNING' | 'ERROR' | 'INCOMPLETE';
  totalCampaigns?: number;
}

export interface MetaConfig {
  isConnected: boolean;
  accessToken: string;
  selectedAccountId: string;
  accountName: string;
  currency?: string;
  apiVersion?: string;
  lastSyncedAt?: string;
  businessManagerId?: string;
  businessManagerName?: string;
  lastValidationAt: string;
}
