export interface CrmLead {
  id: string;
  data_hora: string;
  nome: string;
  telefone: string;
  email: string;
  clinica: string;
  especialidade: string;
  objetivo_principal: string;
  faturamento: string;
  trafego_pago: string;
  prazo_estimado: string;
  score_pontos: number;
  tipo_lead: 'A' | 'B' | 'C' | 'D' | string;
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  sdr?: string;
  agendamento?: 'Sim' | 'Não' | string;
  venda?: 'Sim' | 'Não' | string;
  valor_conversao: number;
  created_at?: string;
  updated_at?: string;
}

export interface CrmLeadSummary {
  totalLeads: number;
  totalAgendamentos: number;
  taxaAgendamentoPct: number;
  totalVendas: number;
  taxaConversaoVendasPct: number;
  faturamentoTotal: number;
  ticketMedio: number;
}
