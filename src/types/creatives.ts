export interface CreativePerformance {
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  campaign_name: string;
  spend: number;             // Custo do Meta Ads
  leads_generated: number;   // Contagem no CRM
  agendamentos: number;      // Count onde agendamento === "Sim"
  vendas: number;            // Count onde venda === "Sim"
  revenue: number;           // Soma de valor_conversao
  roas: number;              // revenue / spend
  lucro: number;             // revenue - spend
  status: 'LUCRATIVO' | 'EMPATE' | 'PREJUIZO' | 'ORGANICO';
  thumbnail_url?: string;
  adset_id?: string;
  adset_name?: string;
}

export interface CreativesSummaryMetrics {
  totalSpend: number;
  totalRevenue: number;
  lucroLiquido: number;
  roasMedio: number;
  totalLeads: number;
  totalVendas: number;
  championCreative: {
    name: string;
    ad_id: string;
    lucro: number;
    revenue: number;
    vendas: number;
  } | null;
}
