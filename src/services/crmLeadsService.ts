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

// Helper de timeout seguro para requisições assíncronas do Supabase
const withTimeout = async <T>(promiseLike: PromiseLike<T>, timeoutMs = 5000): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout de ${timeoutMs}ms excedido na operação do banco de dados.`)), timeoutMs);
  });
  try {
    return await Promise.race([Promise.resolve(promiseLike), timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
};

export async function fetchCrmLeads(): Promise<CrmLead[]> {
  try {
    const fetchPromise = supabase
      .from('crm_leads')
      .select('*')
      .order('data_hora', { ascending: false });

    const { data, error } = await withTimeout(fetchPromise, 5000);

    if (error) {
      console.warn('⚠️ [CRM LEADS SERVICE] Supabase crm_leads fetch warning (usando mock fallback):', error.message);
      return MOCK_CRM_LEADS;
    }

    if (Array.isArray(data)) {
      return data as CrmLead[];
    }
  } catch (err: any) {
    console.warn('⚠️ [CRM LEADS SERVICE] Exceção na busca de leads CRM (usando mock fallback):', err?.message || err);
  }

  return MOCK_CRM_LEADS;
}

// O(N) Single-Pass Funnel Metric Aggregator (Zero Array.prototype.filter allocations)
export function computeCrmLeadSummary(leads: CrmLead[]): CrmLeadSummary {
  const totalLeads = leads.length;
  if (totalLeads === 0) {
    return {
      totalLeads: 0,
      totalAgendamentos: 0,
      taxaAgendamentoPct: 0,
      totalVendas: 0,
      taxaConversaoVendasPct: 0,
      faturamentoTotal: 0,
      ticketMedio: 0
    };
  }

  let totalAgendamentos = 0;
  let totalVendas = 0;
  let faturamentoTotal = 0;

  for (let i = 0; i < totalLeads; i++) {
    const lead = leads[i];
    const isAgendado = (lead.agendamento || '').trim().toLowerCase() === 'sim';
    const isVenda = (lead.venda || '').trim().toLowerCase() === 'sim';

    if (isAgendado) totalAgendamentos++;
    if (isVenda) totalVendas++;
    
    const valor = Number(lead.valor_conversao);
    if (!isNaN(valor) && valor > 0) {
      faturamentoTotal += valor;
    }
  }

  const taxaAgendamentoPct = (totalAgendamentos / totalLeads) * 100;
  const taxaConversaoVendasPct = totalAgendamentos > 0 ? (totalVendas / totalAgendamentos) * 100 : 0;
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
    const savePromise = supabase
      .from('crm_leads')
      .upsert(lead)
      .select()
      .single();

    const { data, error } = await withTimeout(savePromise, 5000);

    if (error) {
      console.error('❌ [CRM LEADS SERVICE] Falha ao salvar CRM Lead no Supabase:', error.message);
      return null;
    }

    return data as CrmLead;
  } catch (err: any) {
    console.error('❌ [CRM LEADS SERVICE] Exceção ao salvar CRM Lead:', err?.message || err);
    return null;
  }
}

export interface NewManualLeadInput {
  data_hora: string;
  nome: string;
  telefone?: string;
  campaign_id?: string;
  ad_id?: string;
  agendamento: 'Sim' | 'Não' | string;
  venda: 'Sim' | 'Não' | string;
  valor_conversao?: number;
}

export async function createManualCrmLead(input: NewManualLeadInput): Promise<{ success: boolean; data?: CrmLead; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const uniqueEmail = `lead_manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@sem-email.com`;
    
    let parsedDate = nowIso;
    if (input.data_hora) {
      const d = new Date(input.data_hora);
      parsedDate = !isNaN(d.getTime()) ? d.toISOString() : nowIso;
    }

    const newLeadRecord = {
      data_hora: parsedDate,
      nome: input.nome.trim(),
      telefone: (input.telefone || '').trim(),
      email: uniqueEmail,
      clinica: '',
      especialidade: '',
      objetivo_principal: '',
      faturamento: '',
      trafego_pago: '',
      prazo_estimado: '',
      score_pontos: 0,
      tipo_lead: 'MANUAL',
      campaign_id: (input.campaign_id || '').trim(),
      adset_id: '',
      ad_id: (input.ad_id || '').trim(),
      sdr: 'Manual',
      agendamento: input.agendamento || 'Não',
      venda: input.venda || 'Não',
      valor_conversao: input.venda === 'Sim' ? (Number(input.valor_conversao) || 0) : 0,
      updated_at: nowIso
    };

    const insertPromise = supabase
      .from('crm_leads')
      .insert([newLeadRecord])
      .select()
      .single();

    const { data, error } = await withTimeout(insertPromise, 5000);

    if (error) {
      console.warn('⚠️ [CRM LEADS SERVICE] Erro ao cadastrar lead no Supabase (atualizando mock local):', error.message);
      // Mock Fallback se o Supabase não estiver conectado no momento
      const localMockLead: CrmLead = {
        id: `lead_${Date.now()}`,
        ...newLeadRecord,
        created_at: parsedDate
      };
      MOCK_CRM_LEADS.unshift(localMockLead);
      return { success: true, data: localMockLead };
    }

    // Se o mock estiver sendo usado em memória, também adiciona ao topo
    MOCK_CRM_LEADS.unshift(data as CrmLead);

    return { success: true, data: data as CrmLead };
  } catch (err: any) {
    console.error('❌ [CRM LEADS SERVICE] Exceção ao cadastrar lead manual:', err?.message || err);
    return { success: false, error: err?.message || 'Falha ao salvar lead.' };
  }
}
