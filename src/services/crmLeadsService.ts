import { supabase } from '../lib/supabase';
import { CrmLead, CrmLeadSummary } from '../types/crm';

// Mock Seed Dataset mirroring the exact columns and leads from Google Sheets (image_53a732.jpg & image_53a790.png)
export const MOCK_CRM_LEADS: CrmLead[] = [
  {
    id: 'lead_001',
    data_hora: '2026-07-09T09:32:52Z',
    nome: 'Silvia Robledo e Oliveira Moreira',
    telefone: '(11) 97078-1604',
    email: 'silviarobledooliveira@gmail.com',
    clinica: 'Dra. Karla Moreira',
    especialidade: 'Estética Avançada',
    objetivo_principal: 'Atrair mais pacientes qualificados',
    faturamento: 'Até R$30 mil/mês',
    trafego_pago: 'Ainda não invisto',
    prazo_estimado: 'Imediato',
    score_pontos: 35,
    tipo_lead: 'C',
    campaign_id: '120250023089950597',
    adset_id: '120250023089960597',
    ad_id: '120250077335050597',
    sdr: 'Matheus',
    agendamento: 'Sim',
    venda: 'Sim',
    valor_conversao: 4248.00,
    created_at: '2026-07-09T09:32:52Z'
  },
  {
    id: 'lead_002',
    data_hora: '2026-07-11T13:05:57Z',
    nome: 'Gilderson',
    telefone: '(98) 98749-5543',
    email: 'gildersonnaves@gmail.com',
    clinica: 'Gilderson Naves Odontologia',
    especialidade: 'Implantodontia',
    objetivo_principal: 'Melhorar o atendimento comercial',
    faturamento: 'Acima de R$200 mil/mês',
    trafego_pago: 'Acima de R$ 15 mil',
    prazo_estimado: '30 dias',
    score_pontos: 125,
    tipo_lead: 'A',
    campaign_id: '120250023089950597',
    adset_id: '120250023089960597',
    ad_id: '120250077335050597',
    sdr: 'Matheus',
    agendamento: 'Sim',
    venda: 'Não',
    valor_conversao: 0,
    created_at: '2026-07-11T13:05:57Z'
  },
  {
    id: 'lead_003',
    data_hora: '2026-07-14T13:28:40Z',
    nome: 'Eder Orlindo',
    telefone: '(55) 99987-5502',
    email: 'eder.orlindo@exemplo.com',
    clinica: 'Orlindo Harmonização',
    especialidade: 'Harmonização Facial',
    objetivo_principal: 'Agendamento de consultas',
    faturamento: 'Entre R$ 30 mil e R$ 60 mil',
    trafego_pago: 'Até R$ 3 mil',
    prazo_estimado: 'Imediato',
    score_pontos: 30,
    tipo_lead: 'D',
    campaign_id: '120250023089950597',
    adset_id: '120250023089960597',
    ad_id: '120250077335050597',
    sdr: 'Breno',
    agendamento: 'Sim',
    venda: 'Não',
    valor_conversao: 0,
    created_at: '2026-07-14T13:28:40Z'
  },
  {
    id: 'lead_004',
    data_hora: '2026-07-14T14:14:44Z',
    nome: 'Luciana Silva',
    telefone: '(24) 99895-2248',
    email: 'luciana@exemplo.com',
    clinica: 'Dra. Luciana Estética',
    especialidade: 'Dermatologia',
    objetivo_principal: 'Conversão em procedimentos',
    faturamento: 'Entre R$ 60 mil e R$ 100 mil',
    trafego_pago: 'Entre R$ 3 mil e R$ 7 mil',
    prazo_estimado: 'Imediato',
    score_pontos: 30,
    tipo_lead: 'D',
    campaign_id: '120248461011530710',
    adset_id: '120248461011540710',
    ad_id: '120248461011550710',
    sdr: 'Breno',
    agendamento: 'Sim',
    venda: 'Não',
    valor_conversao: 0,
    created_at: '2026-07-14T14:14:44Z'
  },
  {
    id: 'lead_005',
    data_hora: '2026-07-16T08:56:23Z',
    nome: 'Maxwell Pereira',
    telefone: '(38) 98470-0808',
    email: 'maxwellpereira@exemplo.com',
    clinica: 'Maxwell Odontologia',
    especialidade: 'Ortodontia',
    objetivo_principal: 'Qualidade dos leads',
    faturamento: 'Entre R$ 100 mil e R$ 200 mil',
    trafego_pago: 'Entre R$ 7 mil e R$ 15 mil',
    prazo_estimado: '15 a 30 dias',
    score_pontos: 60,
    tipo_lead: 'B',
    campaign_id: '120250023089950597',
    adset_id: '120250023089960597',
    ad_id: '120250077335050597',
    sdr: 'Matheus',
    agendamento: 'Não',
    venda: 'Não',
    valor_conversao: 0,
    created_at: '2026-07-16T08:56:23Z'
  },
  {
    id: 'lead_006',
    data_hora: '2026-07-16T12:43:12Z',
    nome: 'Dra. Yana Bragança',
    telefone: '(51) 99658-3220',
    email: 'yana@exemplo.com',
    clinica: 'Dra Yana Bragança',
    especialidade: 'Harmonização Facial',
    objetivo_principal: 'Conversão em procedimentos',
    faturamento: 'Entre R$ 30 mil e R$ 60 mil',
    trafego_pago: 'Ainda não invisto',
    prazo_estimado: 'Imediato',
    score_pontos: 30,
    tipo_lead: 'D',
    campaign_id: '120250023089950597',
    adset_id: '120250023089960597',
    ad_id: '120250077335050597',
    sdr: 'Breno',
    agendamento: 'Sim',
    venda: 'Não',
    valor_conversao: 0,
    created_at: '2026-07-16T12:43:12Z'
  },
  {
    id: 'lead_007',
    data_hora: '2026-07-16T22:06:04Z',
    nome: 'Bruna de Melo',
    telefone: '(85) 99128-0404',
    email: 'bruna@exemplo.com',
    clinica: 'Dr Breno de Melo',
    especialidade: 'Cirurgia Plástica',
    objetivo_principal: 'Posicionamento e autoridade',
    faturamento: 'Entre R$ 30 mil e R$ 60 mil',
    trafego_pago: 'Ainda não invisto',
    prazo_estimado: 'Imediato',
    score_pontos: 25,
    tipo_lead: 'D',
    campaign_id: '120250023089950597',
    adset_id: '120250023089960597',
    ad_id: '120250077335050597',
    sdr: 'Matheus',
    agendamento: 'Sim',
    venda: 'Sim',
    valor_conversao: 5000.00,
    created_at: '2026-07-16T22:06:04Z'
  },
  {
    id: 'lead_008',
    data_hora: '2026-07-17T11:18:15Z',
    nome: 'Fernando Medeiros',
    telefone: '(21) 98129-0511',
    email: 'fernando@exemplo.com',
    clinica: 'Medeiros Odonto',
    especialidade: 'Odontologia Estética',
    objetivo_principal: 'Falta de dados',
    faturamento: 'Entre R$ 30 mil e R$ 60 mil',
    trafego_pago: 'Até R$ 3 mil',
    prazo_estimado: 'Imediato',
    score_pontos: 30,
    tipo_lead: 'D',
    campaign_id: '120250023089950597',
    adset_id: '120250023089960597',
    ad_id: '120250077335050597',
    sdr: 'Breno',
    agendamento: 'Sim',
    venda: 'Não',
    valor_conversao: 0,
    created_at: '2026-07-17T11:18:15Z'
  },
  {
    id: 'lead_009',
    data_hora: '2026-07-21T23:03:35Z',
    nome: 'Dra. Maria',
    telefone: '(47) 99992-1331',
    email: 'dramaria@exemplo.com',
    clinica: 'Dra Maria Estética',
    especialidade: 'Dermatologia',
    objetivo_principal: 'Não sei identificar',
    faturamento: 'Entre R$ 60 mil e R$ 100 mil',
    trafego_pago: 'Entre R$ 3 mil e R$ 7 mil',
    prazo_estimado: 'Imediato',
    score_pontos: 50,
    tipo_lead: 'B',
    campaign_id: '120250023089950597',
    adset_id: '120250023089960597',
    ad_id: '120250077335050597',
    sdr: 'Matheus',
    agendamento: 'Sim',
    venda: 'Sim',
    valor_conversao: 6500.00,
    created_at: '2026-07-21T23:03:35Z'
  },
  {
    id: 'lead_010',
    data_hora: '2026-07-22T18:24:07Z',
    nome: 'Thais Dicker Dutra de Arruda',
    telefone: '(45) 99930-5810',
    email: 'thaisdickerarruda@exemplo.com',
    clinica: 'Dutra & Arruda Odontologia',
    especialidade: 'Ortodontia Invisible',
    objetivo_principal: 'Qualidade dos leads',
    faturamento: 'Acima de R$ 200 mil/mês',
    trafego_pago: 'Acima de R$ 15 mil',
    prazo_estimado: 'Imediato',
    score_pontos: 120,
    tipo_lead: 'A',
    campaign_id: '120250023089950597',
    adset_id: '120250023089960597',
    ad_id: '120250077335050597',
    sdr: 'Matheus',
    agendamento: 'Sim',
    venda: 'Não',
    valor_conversao: 0,
    created_at: '2026-07-22T18:24:07Z'
  }
];

export async function fetchCrmLeads(): Promise<CrmLead[]> {
  try {
    const { data, error } = await supabase
      .from('crm_leads')
      .select('*')
      .order('data_hora', { ascending: false });

    if (error) {
      console.warn('Supabase crm_leads fetch warning (using mock seed fallback):', error.message);
      return MOCK_CRM_LEADS;
    }

    if (data && data.length > 0) {
      return data as CrmLead[];
    }
  } catch (err) {
    console.warn('CRM leads service exception (using mock seed fallback):', err);
  }

  return MOCK_CRM_LEADS;
}

export function computeCrmLeadSummary(leads: CrmLead[]): CrmLeadSummary {
  const totalLeads = leads.length;
  const agendamentos = leads.filter(l => l.agendamento === 'Sim');
  const totalAgendamentos = agendamentos.length;
  const taxaAgendamentoPct = totalLeads > 0 ? (totalAgendamentos / totalLeads) * 100 : 0;

  const vendas = leads.filter(l => l.venda === 'Sim');
  const totalVendas = vendas.length;
  const taxaConversaoVendasPct = totalAgendamentos > 0 ? (totalVendas / totalAgendamentos) * 100 : 0;

  const faturamentoTotal = leads.reduce((sum, lead) => sum + (Number(lead.valor_conversao) || 0), 0);
  const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;

  return {
    totalLeads,
    totalAgendamentos,
    taxaAgendamentoPct,
    totalVendas,
    taxaConversaoVendasPct,
    faturamentoTotal,
    ticketMedio
  };
}

export async function saveCrmLead(lead: Partial<CrmLead>): Promise<CrmLead | null> {
  try {
    const { data, error } = await supabase
      .from('crm_leads')
      .upsert(lead)
      .select()
      .single();

    if (error) {
      console.error('Failed to save CRM Lead to Supabase:', error.message);
      return null;
    }

    return data as CrmLead;
  } catch (err) {
    console.error('Exception saving CRM Lead:', err);
    return null;
  }
}
