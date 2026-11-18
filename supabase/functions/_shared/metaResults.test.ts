// Testes da lógica de resultados. Rodar com:  npx tsx supabase/functions/_shared/metaResults.test.ts
import assert from 'node:assert/strict';
import {
  aggregateAccountResults,
  computeDailyBudgetMinor,
  dateInTimezone,
  elapsedDaysInRange,
  parsePrepaidBalance,
  readNativeResults
} from './metaResults.ts';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`✓ ${name}`);
}

test('lead de pixel não é contado 3x (lead + onsite_web_lead + fb_pixel_lead)', () => {
  const r = aggregateAccountResults(
    [{
      adset_id: '1', optimization_goal: 'OFFSITE_CONVERSIONS', spend: '212.30',
      actions: [
        { action_type: 'lead', value: '4' },
        { action_type: 'onsite_web_lead', value: '4' },
        { action_type: 'offsite_conversion.fb_pixel_lead', value: '4' },
        { action_type: 'link_click', value: '120' }
      ]
    }],
    { '1': { id: '1', promoted_object: { custom_event_type: 'LEAD' } } }
  );
  assert.equal(r.resultsType, 'leads');
  assert.equal(r.resultsCount, 4);
  assert.equal(r.cpl, 53.08);
});

test('conversas não somam total_messaging_connection + started_7d + first_reply', () => {
  const r = aggregateAccountResults([{
    adset_id: '2', optimization_goal: 'CONVERSATIONS', spend: '51.27',
    actions: [
      { action_type: 'onsite_conversion.total_messaging_connection', value: '11' },
      { action_type: 'onsite_conversion.messaging_conversation_started_7d', value: '9' },
      { action_type: 'onsite_conversion.messaging_first_reply', value: '7' }
    ]
  }]);
  assert.equal(r.resultsType, 'conversas');
  assert.equal(r.resultsCount, 9);
  assert.equal(r.cpl, 5.7);
});

test('campo nativo results tem prioridade sobre actions', () => {
  const r = aggregateAccountResults([{
    adset_id: '3', optimization_goal: 'CONVERSATIONS', spend: '100',
    results: [{ indicator: 'actions:onsite_conversion.messaging_conversation_started_7d', values: [{ value: '20', attribution_windows: ['default'] }] }],
    actions: [{ action_type: 'onsite_conversion.messaging_conversation_started_7d', value: '25' }]
  }]);
  assert.equal(r.resultsCount, 20);
  assert.equal(r.cpl, 5);
  assert.equal(r.adsets[0].source, 'meta_results');
});

test('conta mista: exibe a categoria com mais gasto e CPL só com o gasto dela', () => {
  const r = aggregateAccountResults([
    { adset_id: 'a', optimization_goal: 'LEAD_GENERATION', spend: '50', actions: [{ action_type: 'onsite_conversion.lead_grouped', value: '5' }, { action_type: 'lead', value: '5' }] },
    { adset_id: 'b', optimization_goal: 'CONVERSATIONS', spend: '150', actions: [{ action_type: 'onsite_conversion.messaging_conversation_started_7d', value: '30' }] },
    { adset_id: 'c', optimization_goal: 'CONVERSATIONS', spend: '30', actions: [] }
  ]);
  assert.equal(r.resultsType, 'conversas');
  assert.equal(r.resultsCount, 30);
  assert.equal(r.cpl, 6); // (150 + 30) / 30
  assert.equal(r.breakdown.leads.count, 5);
  assert.equal(r.totalSpend, 230);
});

test('sem resultados no período => nenhum', () => {
  const r = aggregateAccountResults([{ adset_id: 'x', optimization_goal: 'LEAD_GENERATION', spend: '10', actions: [] }]);
  assert.equal(r.resultsType, 'nenhum');
  assert.equal(r.cpl, null);
});

test('readNativeResults aceita formato sem values[]', () => {
  assert.deepEqual(readNativeResults([{ indicator: 'lead', value: '3' }]), { indicator: 'lead', count: 3 });
  assert.equal(readNativeResults([]), null);
});

test('orçamento diário: CBO + ABO, ignora pausados e conjuntos de campanhas CBO', () => {
  const now = new Date('2026-11-18T12:00:00Z');
  const total = computeDailyBudgetMinor(
    [
      { id: 'c1', effective_status: 'ACTIVE', daily_budget: '20000' }, // CBO R$200
      { id: 'c2', effective_status: 'ACTIVE' }, // ABO
      { id: 'c3', effective_status: 'PAUSED', daily_budget: '99999' },
      { id: 'c4', effective_status: 'ACTIVE', lifetime_budget: '30000', start_time: '2026-11-01T00:00:00Z', stop_time: '2026-11-11T00:00:00Z' } // R$300/10d
    ],
    [
      { id: 's1', campaign_id: 'c1', effective_status: 'ACTIVE', daily_budget: '5000' }, // ignorado (CBO)
      { id: 's2', campaign_id: 'c2', effective_status: 'ACTIVE', daily_budget: '5000' }, // R$50
      { id: 's3', campaign_id: 'c2', effective_status: 'PAUSED', daily_budget: '5000' },
      { id: 's4', campaign_id: 'c2', effective_status: 'ACTIVE', daily_budget: '5000' } // R$50
    ],
    now
  );
  assert.equal(total / 100, 330);
});

test('data no fuso da conta: 23:30 em São Paulo ainda é o mesmo dia', () => {
  const d = new Date('2026-11-19T02:30:00Z'); // 18/11 23:30 em SP
  assert.equal(d.toISOString().slice(0, 10), '2026-11-19'); // comportamento antigo (errado)
  assert.equal(dateInTimezone(d, 'America/Sao_Paulo'), '2026-11-18');
});

test('dias decorridos no período param em hoje', () => {
  assert.equal(elapsedDaysInRange('2026-11-01', '2026-11-30', '2026-11-18'), 18);
  assert.equal(elapsedDaysInRange('2026-11-18', '2026-11-18', '2026-11-18'), 1);
});

test('saldo pré-pago lido do texto da Meta', () => {
  assert.equal(parsePrepaidBalance('Saldo disponível (R$ 1.234,56 BRL)'), 1234.56);
  assert.equal(parsePrepaidBalance('Available balance (R$1,234.56 BRL)'), 1234.56);
  assert.equal(parsePrepaidBalance('Available balance (R$87,10 BRL)'), 87.1);
  assert.equal(parsePrepaidBalance(null), null);
});

console.log(`\n${passed} testes passaram.`);
