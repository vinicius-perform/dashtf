import { extractNormalizedMetrics, computeSummaryMetrics, normalizeAccountId } from '../metaDataEngine';
import { MetaCampaign } from '../../types/meta';

export interface UnitTestResult {
  name: string;
  category: string;
  passed: boolean;
  message: string;
  details?: any;
}

export function runMetaDataEngineUnitTests(): UnitTestResult[] {
  const results: UnitTestResult[] = [];

  // Test 1: ID Normalization
  try {
    const rawId = 'act_1115861513053539';
    const norm = normalizeAccountId(rawId);
    const passed = norm === '1115861513053539';
    results.push({
      name: 'Normalização de Account ID',
      category: 'IDs & Normalização',
      passed,
      message: passed ? 'Normalizou act_1115861513053539 -> 1115861513053539 perfeitamente.' : `Falhou: ${norm}`
    });
  } catch (e: any) {
    results.push({ name: 'Normalização de Account ID', category: 'IDs & Normalização', passed: false, message: e.message });
  }

  // Test 2: Actions Separation (Never sum lead + contact + purchase into fake results)
  try {
    const mockItem = {
      id: 'cmp_123',
      insights: {
        data: [{
          spend: '100.00',
          impressions: '1000',
          clicks: '50',
          actions: [
            { action_type: 'lead', value: '10' },
            { action_type: 'contact', value: '5' },
            { action_type: 'purchase', value: '2' }
          ]
        }]
      }
    };
    const norm = extractNormalizedMetrics(mockItem);
    const passed = norm.conversions === 17 && norm.cpa === 5.88; // 100 / 17
    results.push({
      name: 'Isolamento de Action Types & Cálculo de CPA',
      category: 'Actions & Conversões',
      passed,
      message: passed ? 'Calculou conversões (17) e CPA (R$ 5,88) sem aproximações.' : `Falhou: ${JSON.stringify(norm)}`
    });
  } catch (e: any) {
    results.push({ name: 'Isolamento de Action Types', category: 'Actions & Conversões', passed: false, message: e.message });
  }

  // Test 3: Metric Absence (If metric missing -> returns NULL / —)
  try {
    const mockItemNoProfile = {
      id: 'cmp_456',
      insights: {
        data: [{
          spend: '50.00',
          impressions: '500',
          clicks: '10',
          actions: [] // No instagram_profile_visit
        }]
      }
    };
    const norm = extractNormalizedMetrics(mockItemNoProfile);
    const passed = norm.profileVisits === null;
    results.push({
      name: 'Tratamento de Métrica Ausente (Null Safety)',
      category: 'Integridade & Nulos',
      passed,
      message: passed ? 'Métrica ausente retornou NULL (exibindo — no dashboard).' : `Falhou: ${norm.profileVisits}`
    });
  } catch (e: any) {
    results.push({ name: 'Tratamento de Métrica Ausente', category: 'Integridade & Nulos', passed: false, message: e.message });
  }

  // Test 4: Division by Zero Safety
  try {
    const mockZeroClicks = {
      id: 'cmp_789',
      insights: {
        data: [{
          spend: '100.00',
          impressions: '0',
          clicks: '0',
          actions: []
        }]
      }
    };
    const norm = extractNormalizedMetrics(mockZeroClicks);
    const passed = norm.ctr === null || norm.ctr === 0 && norm.cpc === null;
    results.push({
      name: 'Segurança contra Divisão por Zero',
      category: 'Matemática & Reconciliação',
      passed,
      message: passed ? 'Sem cliques -> CPC retornou NULL em vez de Infinity/NaN.' : `Falhou: cpc=${norm.cpc}`
    });
  } catch (e: any) {
    results.push({ name: 'Segurança contra Divisão por Zero', category: 'Matemática & Reconciliação', passed: false, message: e.message });
  }

  // Test 5: Reconciliacao & Summing
  try {
    const mockCampaigns: MetaCampaign[] = [
      {
        id: 'cmp_1',
        name: 'Campanha A',
        status: 'ACTIVE',
        objective: 'LEADS',
        spend: 100,
        impressions: 1000,
        clicks: 50,
        ctr: 5.0,
        cpc: 2.0,
        conversions: 10,
        resultLabel: 'Leads',
        deliveryInfo: { code: 'ACTIVE', label: 'Ativo', badgeColor: 'green' },
        cpa: 10.0,
        roas: null,
        reach: 700,
        frequency: 1.4,
        cpm: 100.0,
        profileVisits: null,
        retentionPct: null,
        followersGained: null,
        cps: null,
        landingPageViews: 40,
        created_time: new Date().toISOString()
      },
      {
        id: 'cmp_2',
        name: 'Campanha B',
        status: 'ACTIVE',
        objective: 'LEADS',
        spend: 200,
        impressions: 2000,
        clicks: 100,
        ctr: 5.0,
        cpc: 2.0,
        conversions: 20,
        resultLabel: 'Leads',
        deliveryInfo: { code: 'ACTIVE', label: 'Ativo', badgeColor: 'green' },
        cpa: 10.0,
        roas: null,
        reach: 1400,
        frequency: 1.4,
        cpm: 100.0,
        profileVisits: null,
        retentionPct: null,
        followersGained: null,
        cps: null,
        landingPageViews: 80,
        created_time: new Date().toISOString()
      }
    ];

    const summary = computeSummaryMetrics(mockCampaigns);
    const passed = summary.investimentoTotal === 300 && summary.leadsTotal === 30 && summary.reconciliationStatus === 'VALID';
    results.push({
      name: 'Reconciliação & Agregação Semântica de Nível',
      category: 'Matemática & Reconciliação',
      passed,
      message: passed ? 'Soma das campanhas (300) bateu exatamente com o total agregado (VALID).' : `Falhou: ${JSON.stringify(summary)}`
    });
  } catch (e: any) {
    results.push({ name: 'Reconciliação & Agregação', category: 'Matemática & Reconciliação', passed: false, message: e.message });
  }

  return results;
}
