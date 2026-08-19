export type MetricSource = 'DIRECT_API' | 'DERIVED';
export type MetricFormat = 'CURRENCY' | 'NUMBER' | 'PERCENT' | 'MULTIPLIER';

export interface MetricDefinition {
  key: string;
  displayName: string;
  description: string;
  source: MetricSource;
  metaField?: string;
  actionType?: string;
  level?: 'ACCOUNT' | 'CAMPAIGN' | 'ADSET' | 'AD' | 'ALL';
  calculationType?: 'SUM' | 'AVERAGE' | 'FORMULA';
  formula?: string;
  format: MetricFormat;
  isPrimaryResult?: boolean;
  validationRules?: string[];
}

export const METRIC_DICTIONARY: Record<string, MetricDefinition> = {
  SPEND: {
    key: 'SPEND',
    displayName: 'Valor Gasto (Spend)',
    description: 'Valor total investido no período, retornado diretamente pela Meta API.',
    source: 'DIRECT_API',
    metaField: 'spend',
    level: 'ALL',
    calculationType: 'SUM',
    format: 'CURRENCY',
    validationRules: ['non-negative', 'must-match-currency']
  },
  IMPRESSIONS: {
    key: 'IMPRESSIONS',
    displayName: 'Impressões',
    description: 'Número de vezes que os anúncios foram exibidos em tela.',
    source: 'DIRECT_API',
    metaField: 'impressions',
    level: 'ALL',
    calculationType: 'SUM',
    format: 'NUMBER',
    validationRules: ['non-negative', 'integer']
  },
  REACH: {
    key: 'REACH',
    displayName: 'Alcance (Reach)',
    description: 'Número de contas de centro de contas únicas que viram os anúncios pelo menos uma vez.',
    source: 'DIRECT_API',
    metaField: 'reach',
    level: 'ALL',
    calculationType: 'SUM',
    format: 'NUMBER',
    validationRules: ['non-negative', 'integer', 'lte-impressions']
  },
  FREQUENCY: {
    key: 'FREQUENCY',
    displayName: 'Frequência',
    description: 'Média de vezes que cada pessoa viu o anúncio (Impressões / Alcance).',
    source: 'DIRECT_API',
    metaField: 'frequency',
    level: 'ALL',
    calculationType: 'AVERAGE',
    format: 'NUMBER',
    validationRules: ['gte-1']
  },
  CLICKS: {
    key: 'CLICKS',
    displayName: 'Cliques (Todos)',
    description: 'Total de cliques recebidos no anúncio (incluindo cliques no perfil, ver mais, etc.).',
    source: 'DIRECT_API',
    metaField: 'clicks',
    level: 'ALL',
    calculationType: 'SUM',
    format: 'NUMBER',
    validationRules: ['non-negative', 'integer']
  },
  LINK_CLICKS: {
    key: 'LINK_CLICKS',
    displayName: 'Cliques no Link',
    description: 'Cliques em links que levam a destinos selecionados pelo anunciante.',
    source: 'DIRECT_API',
    actionType: 'link_click',
    level: 'ALL',
    calculationType: 'SUM',
    format: 'NUMBER',
    validationRules: ['non-negative', 'integer']
  },
  LANDING_PAGE_VIEWS: {
    key: 'LANDING_PAGE_VIEWS',
    displayName: 'Visualizações da Página de Destino',
    description: 'Número de vezes que uma pessoa clicou no link e a página carregou com sucesso.',
    source: 'DIRECT_API',
    actionType: 'landing_page_view',
    level: 'ALL',
    calculationType: 'SUM',
    format: 'NUMBER',
    validationRules: ['non-negative', 'integer']
  },
  CTR: {
    key: 'CTR',
    displayName: 'CTR (Taxa de Clique)',
    description: 'Porcentagem de vezes que as pessoas viram o anúncio e clicaram.',
    source: 'DIRECT_API',
    metaField: 'ctr',
    level: 'ALL',
    calculationType: 'FORMULA',
    formula: '(clicks / impressions) * 100',
    format: 'PERCENT',
    validationRules: ['between-0-100']
  },
  CPC: {
    key: 'CPC',
    displayName: 'CPC (Custo por Clique)',
    description: 'Custo médio por cada clique no anúncio.',
    source: 'DERIVED',
    level: 'ALL',
    calculationType: 'FORMULA',
    formula: 'spend / clicks',
    format: 'CURRENCY',
    validationRules: ['non-negative', 'null-if-zero-clicks']
  },
  CPM: {
    key: 'CPM',
    displayName: 'CPM (Custo por Mil Impressões)',
    description: 'Custo médio para cada 1.000 impressões de anúncios.',
    source: 'DERIVED',
    level: 'ALL',
    calculationType: 'FORMULA',
    formula: '(spend / impressions) * 1000',
    format: 'CURRENCY',
    validationRules: ['non-negative', 'null-if-zero-impressions']
  },
  LEADS: {
    key: 'LEADS',
    displayName: 'Leads (Cadastros)',
    description: 'Cadastros de potenciais clientes coletados via formulários nativos ou site.',
    source: 'DIRECT_API',
    actionType: 'lead',
    level: 'ALL',
    calculationType: 'SUM',
    format: 'NUMBER',
    isPrimaryResult: true,
    validationRules: ['non-negative', 'integer']
  },
  CONTACTS: {
    key: 'CONTACTS',
    displayName: 'Contatos (Mensagens/WhatsApp)',
    description: 'Contatos iniciados pelo usuário via WhatsApp, Messenger ou Direct.',
    source: 'DIRECT_API',
    actionType: 'contact',
    level: 'ALL',
    calculationType: 'SUM',
    format: 'NUMBER',
    validationRules: ['non-negative', 'integer']
  },
  PURCHASES: {
    key: 'PURCHASES',
    displayName: 'Compras (Vendas)',
    description: 'Número de eventos de compra realizados via Pixel ou Conversões da Meta.',
    source: 'DIRECT_API',
    actionType: 'purchase',
    level: 'ALL',
    calculationType: 'SUM',
    format: 'NUMBER',
    isPrimaryResult: true,
    validationRules: ['non-negative', 'integer']
  },
  REGISTRATIONS: {
    key: 'REGISTRATIONS',
    displayName: 'Conclusões de Cadastro',
    description: 'Registros de inscrição ou cadastro concluídos.',
    source: 'DIRECT_API',
    actionType: 'complete_registration',
    level: 'ALL',
    calculationType: 'SUM',
    format: 'NUMBER',
    validationRules: ['non-negative', 'integer']
  },
  INSTAGRAM_PROFILE_VISITS: {
    key: 'INSTAGRAM_PROFILE_VISITS',
    displayName: 'Visitas ao Perfil do Instagram',
    description: 'Número de visitas ao perfil corporativo do Instagram geradas pelos anúncios.',
    source: 'DIRECT_API',
    actionType: 'instagram_profile_visit',
    level: 'ALL',
    calculationType: 'SUM',
    format: 'NUMBER',
    validationRules: ['non-negative', 'integer']
  },
  FOLLOWERS: {
    key: 'FOLLOWERS',
    displayName: 'Seguidores Adquiridos',
    description: 'Novos seguidores no Instagram atribuídos aos anúncios.',
    source: 'DIRECT_API',
    actionType: 'profile_follow',
    level: 'ALL',
    calculationType: 'SUM',
    format: 'NUMBER',
    validationRules: ['non-negative', 'integer']
  },
  CPS: {
    key: 'CPS',
    displayName: 'CPS (Custo por Seguidor)',
    description: 'Investimento total dividido pelo número de novos seguidores.',
    source: 'DERIVED',
    level: 'ALL',
    calculationType: 'FORMULA',
    formula: 'spend / followers',
    format: 'CURRENCY',
    validationRules: ['non-negative', 'null-if-zero-followers']
  },
  CPA: {
    key: 'CPA',
    displayName: 'CPA (Custo por Resultado Principal)',
    description: 'Custo por cada conversão/resultado principal da campanha.',
    source: 'DERIVED',
    level: 'ALL',
    calculationType: 'FORMULA',
    formula: 'spend / primaryResultValue',
    format: 'CURRENCY',
    validationRules: ['non-negative', 'null-if-zero-conversions']
  },
  ROAS: {
    key: 'ROAS',
    displayName: 'ROAS (Retorno sobre Investimento)',
    description: 'Valor total retornado em compras dividido pelo investimento.',
    source: 'DERIVED',
    level: 'ALL',
    calculationType: 'FORMULA',
    formula: 'purchase_value / spend',
    format: 'MULTIPLIER',
    validationRules: ['non-negative']
  }
};
