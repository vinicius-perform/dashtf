import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  formatCurrency, 
  formatNumber, 
  formatPercent, 
  getActionValue 
} from '../utils/formatters';
import { 
  MetaCampaign, 
  MetaAdSet, 
  MetaAd, 
  GerenciadorSummary,
  MetaAdAccount,
  MetaConfig,
  MetaAccountCarteiraItem,
  FilterTag
} from '../types/meta';
import { MetricCard } from './MetricCard';
import { CampaignLevelTable } from './CampaignLevelTable';
import { AdSetLevelTable } from './AdSetLevelTable';
import { AdLevelTable } from './AdLevelTable';
import { AlertasTrilho } from './AlertasTrilho';
import { CarteiraTableView } from './CarteiraTableView';
import { AdsMetricsTable } from './AdsMetricsTable';
import { 
  Megaphone, 
  Layers, 
  Target,
  LayoutDashboard,
  ArrowLeft,
  RefreshCw,
  Wallet,
  Sparkles,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { OmniboxSearch } from './OmniboxSearch';
import { fetchCarteiraAccounts } from '../services/carteiraEngine';
import { getSavedMetaConfig } from '../services/metaDataEngine';

interface GerenciadorViewProps {
  summary: GerenciadorSummary;
  campaigns: MetaCampaign[];
  adsets: MetaAdSet[];
  ads: MetaAd[];
  activeLevel: string;
  setActiveLevel: (level: string) => void;
  onToggleCampaignStatus: (id: string) => void;
  isLoading?: boolean;
  accounts?: MetaAdAccount[];
  metaConfig?: MetaConfig;
  dateRange?: any;
  selectedAccountId?: string;
  setSelectedAccountId?: (id: string) => void;
  onRefresh?: () => void;
}

export const GerenciadorView: React.FC<GerenciadorViewProps> = React.memo(({
  summary,
  campaigns,
  adsets,
  ads,
  activeLevel,
  setActiveLevel,
  onToggleCampaignStatus,
  isLoading = false,
  accounts = [],
  metaConfig,
  dateRange,
  selectedAccountId,
  setSelectedAccountId,
  onRefresh,
}) => {
  // Modo de visualização: 'carteira' (Padrão DashTF 2.0) | 'campanhas' (Drill-down detalhado)
  const [viewMode, setViewMode] = useState<'carteira' | 'campanhas'>('carteira');

  // Estado dos dados da Carteira de Contas (com saúde financeira e metas de CPL)
  const [carteiraItems, setCarteiraItems] = useState<MetaAccountCarteiraItem[]>([]);
  const [isCarteiraLoading, setIsCarteiraLoading] = useState<boolean>(false);

  // Estados de seleção interna do drill-down de campanhas
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>();
  const [selectedAdSetId, setSelectedAdSetId] = useState<string | undefined>();
  const [activeFilters, setActiveFilters] = useState<FilterTag[]>([]);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [selectedAdSetIds, setSelectedAdSetIds] = useState<string[]>([]);
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);

  // Estado local para anúncios e ações de status
  const [localAds, setLocalAds] = useState<MetaAd[]>(ads);
  useEffect(() => {
    setLocalAds(ads);
  }, [ads]);

  const handleToggleAdStatus = useCallback((adId: string) => {
    setLocalAds((prev) =>
      prev.map((ad) =>
        ad.id === adId
          ? {
              ...ad,
              status: ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
              effective_status: ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
            }
          : ad
      )
    );
  }, []);

  // Meta CPL da conta ativa selecionada
  const currentAccountMetaCpl = useMemo(() => {
    const found = carteiraItems.find((item) => item.id === selectedAccountId);
    return found?.meta_cpl ?? null;
  }, [carteiraItems, selectedAccountId]);

  // 1. Carregamento dos dados da Carteira de Contas em tempo real
  const loadCarteira = useCallback(async () => {
    if (!accounts || accounts.length === 0) return;
    setIsCarteiraLoading(true);
    try {
      const activeConfig = metaConfig || getSavedMetaConfig();
      const items = await fetchCarteiraAccounts(activeConfig, accounts, dateRange);
      setCarteiraItems(items);
    } catch (err) {
      console.error('Erro ao sincronizar dados da carteira:', err);
    } finally {
      setIsCarteiraLoading(false);
    }
  }, [accounts, metaConfig, dateRange]);

  useEffect(() => {
    loadCarteira();
  }, [loadCarteira]);

  // Atualização reativa de Meta de CPL salva no Supabase
  const handleMetaCplUpdated = useCallback((accountId: string, newMetaCpl: number) => {
    setCarteiraItems((prev) =>
      prev.map((item) => {
        if (item.id === accountId) {
          const statusPercent =
            item.cpl && newMetaCpl > 0
              ? parseFloat((((item.cpl - newMetaCpl) / newMetaCpl) * 100).toFixed(1))
              : null;
          const excesso =
            item.cpl && item.cpl > newMetaCpl
              ? parseFloat(((item.cpl - newMetaCpl) * (item.conversas || 1)).toFixed(2))
              : 0;

          return {
            ...item,
            meta_cpl: newMetaCpl,
            status_meta_percent: statusPercent,
            excesso_pago: excesso,
          };
        }
        return item;
      })
    );
  }, []);

  // Selecionar conta e abrir drill-down de campanhas
  const handleInspectAccount = useCallback(
    (accId: string) => {
      if (setSelectedAccountId) {
        setSelectedAccountId(accId);
      }
      setActiveLevel('top25');
      setViewMode('campanhas');
    },
    [setSelectedAccountId, setActiveLevel]
  );

  // Nome da conta selecionada
  const selectedAccName = useMemo(() => {
    const found = accounts.find((a) => a.id === selectedAccountId);
    return found ? found.name : metaConfig?.accountName || 'Conta Selecionada';
  }, [accounts, selectedAccountId, metaConfig]);

  // Controles de Filtros do Omnibox
  const handleAddFilter = (tag: FilterTag) => {
    setActiveFilters((prev) => [...prev, tag]);
  };
  const handleRemoveFilter = (id: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.id !== id));
  };
  const handleClearAllFilters = () => {
    setActiveFilters([]);
  };

  // Filtragem de Campanhas por Omnibox
  const filteredCampaignsByTags = useMemo(() => {
    if (!activeFilters || activeFilters.length === 0) return campaigns;
    return campaigns.filter((item) => {
      return activeFilters.every((tag) => {
        const valLower = (tag.value || '').toLowerCase();
        if (tag.type === 'NAME') return (item.name || '').toLowerCase().includes(valLower);
        if (tag.type === 'ID') return (item.id || '').toLowerCase().includes(valLower);
        if (tag.type === 'STATUS') {
          const statusLabel = (item.deliveryInfo?.label || item.status || '').toLowerCase();
          return statusLabel.includes(valLower);
        }
        if (tag.type === 'SPEND') {
          const itemSpend = item.spend ?? 0;
          return itemSpend > (parseFloat(valLower) || 0);
        }
        return true;
      });
    });
  }, [campaigns, activeFilters]);

  // Toggle Handlers de Seleção
  const handleToggleSelectCampaign = useCallback((id: string) => {
    setSelectedCampaignIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const handleToggleSelectAllCampaigns = useCallback((visibleIds: string[]) => {
    setSelectedCampaignIds((prev) => {
      const allSelected = visibleIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      } else {
        return Array.from(new Set([...prev, ...visibleIds]));
      }
    });
  }, []);

  const handleToggleSelectAdSet = useCallback((id: string) => {
    setSelectedAdSetIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const handleToggleSelectAllAdSets = useCallback((visibleIds: string[]) => {
    setSelectedAdSetIds((prev) => {
      const allSelected = visibleIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      } else {
        return Array.from(new Set([...prev, ...visibleIds]));
      }
    });
  }, []);

  const handleToggleSelectAd = useCallback((id: string) => {
    setSelectedAdIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const handleToggleSelectAllAds = useCallback((visibleIds: string[]) => {
    setSelectedAdIds((prev) => {
      const allSelected = visibleIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      } else {
        return Array.from(new Set([...prev, ...visibleIds]));
      }
    });
  }, []);

  const handleSelectCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setSelectedCampaignIds([campaignId]);
    setSelectedAdSetId(undefined);
    setSelectedAdSetIds([]);
    setActiveLevel('conjuntos');
  };

  const handleSelectAdSet = (adsetId: string) => {
    setSelectedAdSetId(adsetId);
    setSelectedAdSetIds([adsetId]);
    setActiveLevel('anuncios');
  };

  // Filtragem em cascata para conjuntos e anúncios
  const filteredAdSetsForTab = useMemo(() => {
    let list = adsets;
    const selCampIds = selectedCampaignIds.map((id) => String(id));
    if (selCampIds.length > 0) {
      list = list.filter((as) => selCampIds.includes(String(as.campaign_id)));
    }
    if (!activeFilters || activeFilters.length === 0) return list;
    return list.filter((item) => {
      return activeFilters.every((tag) => {
        const valLower = (tag.value || '').toLowerCase();
        if (tag.type === 'NAME') return (item.name || '').toLowerCase().includes(valLower);
        if (tag.type === 'ID') return String(item.id).toLowerCase().includes(valLower);
        if (tag.type === 'STATUS') {
          const statusLabel = (item.deliveryInfo?.label || item.status || '').toLowerCase();
          return statusLabel.includes(valLower);
        }
        if (tag.type === 'SPEND') {
          const itemSpend = item.spend ?? 0;
          return itemSpend > (parseFloat(valLower) || 0);
        }
        return true;
      });
    });
  }, [adsets, selectedCampaignIds, activeFilters]);

  const filteredAdsForTab = useMemo(() => {
    let list = ads;
    const selAdSetIds = selectedAdSetIds.map((id) => String(id));
    const selCampIds = selectedCampaignIds.map((id) => String(id));

    if (selAdSetIds.length > 0) {
      list = list.filter((ad) => selAdSetIds.includes(String(ad.adset_id)));
    } else if (selCampIds.length > 0) {
      list = list.filter((ad) => selCampIds.includes(String(ad.campaign_id)));
    }

    if (!activeFilters || activeFilters.length === 0) return list;

    return list.filter((item) => {
      return activeFilters.every((tag) => {
        const valLower = (tag.value || '').toLowerCase();
        if (tag.type === 'NAME') return (item.name || '').toLowerCase().includes(valLower);
        if (tag.type === 'ID') return String(item.id).toLowerCase().includes(valLower);
        if (tag.type === 'STATUS') {
          const statusLabel = (item.deliveryInfo?.label || item.status || '').toLowerCase();
          return statusLabel.includes(valLower);
        }
        if (tag.type === 'SPEND') {
          const itemSpend = item.spend ?? 0;
          return itemSpend > (parseFloat(valLower) || 0);
        }
        return true;
      });
    });
  }, [ads, selectedAdSetIds, selectedCampaignIds, activeFilters]);

  // Itens visíveis para KPIs de campanha
  const activeVisibleItems = useMemo(() => {
    if (activeLevel === 'conjuntos') return filteredAdSetsForTab;
    if (activeLevel === 'anuncios') return filteredAdsForTab;
    return filteredCampaignsByTags;
  }, [activeLevel, filteredCampaignsByTags, filteredAdSetsForTab, filteredAdsForTab]);

  // Agregação de métricas para a tela de campanhas
  const aggregatedKPIs = useMemo<GerenciadorSummary>(() => {
    const items = activeVisibleItems && activeVisibleItems.length > 0 ? activeVisibleItems : campaigns;

    let spendSum = 0;
    let impressionsSum = 0;
    let totalLinkClicks = 0;
    let totalLpViews = 0;
    let leadsSum = 0;
    // Resultados por tipo (leads, conversas, visitas, outros): nunca somamos tipos diferentes
    const byCategory: Record<string, { count: number; spend: number }> = {};

    items.forEach((item: any) => {
      if (item.spend !== null && item.spend !== undefined) {
        spendSum += parseFloat(item.spend || 0);
      }
      if (item.impressions !== null && item.impressions !== undefined) {
        impressionsSum += parseInt(item.impressions || 0);
      }

      const actionsArray =
        item.actions ||
        item.rawRecord?.insights?.data?.[0]?.actions ||
        item.rawRecord?.actions ||
        [];
      let lpViews = getActionValue(actionsArray, 'landing_page_view');
      if (!lpViews && item.landingPageViews) {
        lpViews = parseInt(item.landingPageViews, 10);
      }

      let linkClicks =
        item.inline_link_clicks !== undefined && item.inline_link_clicks !== null
          ? parseInt(item.inline_link_clicks as any, 10)
          : getActionValue(actionsArray, 'link_click') ||
            (item.clicks ? parseInt(item.clicks as any, 10) : 0);

      if (!linkClicks && item.clicks) {
        linkClicks = parseInt(item.clicks as any, 10);
      }


      totalLinkClicks += linkClicks;
      totalLpViews += lpViews;

      const cat = item.resultCategory || 'outros';
      byCategory[cat] = byCategory[cat] || { count: 0, spend: 0 };
      byCategory[cat].spend += parseFloat(item.spend || 0) || 0;
      if (item.conversions !== null && item.conversions !== undefined) {
        byCategory[cat].count += Number(item.conversions) || 0;
      }
    });

    // Exibe o tipo de resultado que concentra mais gasto; custo = gasto desse tipo ÷ resultados
    let chosenCategory: string | null = null;
    for (const [cat, v] of Object.entries(byCategory)) {
      if (v.count <= 0) continue;
      if (!chosenCategory || v.spend > byCategory[chosenCategory].spend) chosenCategory = cat;
    }
    leadsSum = chosenCategory ? byCategory[chosenCategory].count : 0;
    const chosenSpend = chosenCategory ? byCategory[chosenCategory].spend : 0;

    if (spendSum === 0 && summary && summary.investimentoTotal) {
      spendSum = summary.investimentoTotal;
      impressionsSum = summary.impressioesTotal || 0;
      totalLinkClicks = summary.cliquesTotal || 0;
      totalLpViews = summary.landingPageViewsTotal || 0;
      leadsSum = summary.leadsTotal || 0;
    }

    const cpmMedio = impressionsSum > 0 ? parseFloat(((spendSum / impressionsSum) * 1000).toFixed(2)) : 0;
    const ctrMedio = impressionsSum > 0 ? parseFloat(((totalLinkClicks / impressionsSum) * 100).toFixed(2)) : 0;
    const globalConnectRate =
      totalLinkClicks > 0 && totalLpViews > 0 ? parseFloat(((totalLpViews / totalLinkClicks) * 100).toFixed(2)) : null;
    const cpcMedio = totalLinkClicks > 0 ? parseFloat((spendSum / totalLinkClicks).toFixed(2)) : null;
    const cpaMedio = leadsSum > 0 ? parseFloat(((chosenSpend || spendSum) / leadsSum).toFixed(2)) : null;

    return {
      investimentoTotal: spendSum,
      cpmMedio,
      ctrMedio,
      connectRate: globalConnectRate,
      impressioesTotal: impressionsSum,
      cliquesTotal: totalLinkClicks,
      landingPageViewsTotal: totalLpViews,
      cpcMedio,
      leadsTotal: leadsSum > 0 ? leadsSum : null,
      cpaMedio,
      resultCategory: chosenCategory,
    } as GerenciadorSummary & { resultCategory: string | null };
  }, [activeVisibleItems, campaigns, summary]);

  const kpiCategory = (aggregatedKPIs as any).resultCategory as string | null;
  const kpiResultTitle =
    kpiCategory === 'conversas' ? 'Conversas' : kpiCategory === 'visitas' ? 'Visitas' : kpiCategory === 'leads' || !kpiCategory ? 'Leads' : 'Resultados';
  const kpiCostTitle =
    kpiCategory === 'conversas' ? 'Custo por Conversa' : kpiCategory === 'visitas' ? 'Custo por Visita' : kpiCategory === 'leads' || !kpiCategory ? 'Custo por Lead' : 'Custo por Resultado';

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* SELETOR DE MODO SUPERIOR (CARTEIRA DE CONTAS VS DETALHES DA CONTA) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-neon/10 border border-brand-neon/20 text-brand-neon shadow-lg shadow-brand-neon/5">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              <span>{viewMode === 'carteira' ? 'Carteira de Contas' : selectedAccName}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-neon/15 text-brand-neon border border-brand-neon/30">
                DashTF 2.0
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              {viewMode === 'carteira'
                ? 'Saúde financeira, alertas de saldo e acompanhamento de metas de CPL em tempo real'
                : 'Métricas detalhadas, funil de performance e inspeção em nível de campanhas'}
            </p>
          </div>
        </div>

        {/* Botões de Alternância de Visão */}
        <div className="flex items-center gap-2 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setViewMode('carteira')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'carteira'
                ? 'bg-brand-neon text-black shadow-md shadow-brand-neon/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Visão de Carteira ({carteiraItems.length})</span>
          </button>

          <button
            onClick={() => setViewMode('campanhas')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'campanhas'
                ? 'bg-brand-neon text-black shadow-md shadow-brand-neon/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Detalhes da Conta</span>
          </button>

          <button
            onClick={() => {
              loadCarteira();
              if (onRefresh) onRefresh();
            }}
            disabled={isCarteiraLoading || isLoading}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-1"
            title="Atualizar dados da carteira"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCarteiraLoading || isLoading ? 'animate-spin text-brand-neon' : ''}`} />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODO 1: VISÃO DE CARTEIRA (FASE 1 - SAÚDE FINANCEIRA & METAS) */}
      {/* ============================================================== */}
      {viewMode === 'carteira' && (
        <div className="space-y-6">
          {/* 1. INDICADORES SUPERIORES (TRILHO DE ALERTAS) */}
          <AlertasTrilho
            items={carteiraItems}
            onSelectAccount={(accId) => handleInspectAccount(accId)}
          />

          {/* 2. REFATORAÇÃO DA TABELA DE CONTAS (VISÃO DE CARTEIRA) */}
          <CarteiraTableView
            items={carteiraItems}
            isLoading={isCarteiraLoading}
            selectedAccountId={selectedAccountId}
            onSelectAccount={setSelectedAccountId}
            onDrillDown={(accId) => handleInspectAccount(accId)}
            onMetaCplUpdated={handleMetaCplUpdated}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* MODO 2: DETALHES DA CONTA (CAMPANHAS, CONJUNTOS, ANÚNCIOS)    */}
      {/* ============================================================== */}
      {viewMode === 'campanhas' && (
        <div className="space-y-6">
          {/* Barra de Navegação de Retorno */}
          <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode('carteira')}
              className="flex items-center gap-2 text-xs font-bold text-zinc-300 hover:text-brand-neon transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Voltar para Carteira de Contas</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>Conta ativa:</span>
              <strong className="text-white">{selectedAccName}</strong>
              <span className="font-mono text-zinc-500">({selectedAccountId})</span>
            </div>
          </div>

          {/* 6 Top Metric KPI Cards (Funil de Performance Real) */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <MetricCard
              title="Investimento"
              mainValue={formatCurrency(aggregatedKPIs.investimentoTotal)}
              showDollarIcon={true}
              isLoading={isLoading}
            />
            <MetricCard
              title="CPM"
              mainValue={
                aggregatedKPIs.cpmMedio !== null && aggregatedKPIs.cpmMedio !== undefined
                  ? formatCurrency(aggregatedKPIs.cpmMedio)
                  : 'R$ 0,00'
              }
              showDollarIcon={true}
              isLoading={isLoading}
            />
            <MetricCard
              title="CTR"
              mainValue={formatPercent(aggregatedKPIs.ctrMedio)}
              showDollarIcon={false}
              isLoading={isLoading}
            />
            <MetricCard
              title="Connect Rate"
              mainValue={formatPercent(aggregatedKPIs.connectRate)}
              valueClassName={
                (aggregatedKPIs.connectRate ?? 0) >= 70 ? 'text-emerald-400' : 'text-red-400'
              }
              showDollarIcon={false}
              isLoading={isLoading}
            />
            <MetricCard
              title={kpiResultTitle}
              mainValue={
                aggregatedKPIs.leadsTotal !== null && aggregatedKPIs.leadsTotal !== undefined
                  ? formatNumber(aggregatedKPIs.leadsTotal)
                  : '0'
              }
              showDollarIcon={false}
              isLoading={isLoading}
            />
            <MetricCard
              title={kpiCostTitle}
              mainValue={
                aggregatedKPIs.cpaMedio !== null && aggregatedKPIs.cpaMedio !== undefined
                  ? formatCurrency(aggregatedKPIs.cpaMedio)
                  : aggregatedKPIs.leadsTotal && aggregatedKPIs.investimentoTotal
                  ? formatCurrency(aggregatedKPIs.investimentoTotal / aggregatedKPIs.leadsTotal)
                  : '—'
              }
              showDollarIcon={true}
              isLoading={isLoading}
            />
          </div>

          {/* Omnibox Smart Search */}
          <div className="bg-brand-card p-4 rounded-2xl border border-brand-border shadow-lg">
            <OmniboxSearch
              activeFilters={activeFilters}
              onAddFilter={handleAddFilter}
              onRemoveFilter={handleRemoveFilter}
              onClearAllFilters={handleClearAllFilters}
            />
          </div>

          {/* 3 Level Navigation Tabs */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-border pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveLevel('top25')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeLevel === 'top25'
                      ? 'bg-brand-neon text-black font-black shadow-md shadow-brand-neon/20'
                      : 'bg-brand-card text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Top 25 Anúncios ({Math.min(25, localAds.length)})</span>
                </button>

                <button
                  onClick={() => setActiveLevel('campanhas')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeLevel === 'campanhas'
                      ? 'bg-brand-neon text-black shadow-md shadow-brand-neon/20'
                      : 'bg-brand-card text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <Megaphone className="w-4 h-4" />
                  <span>Campanhas ({filteredCampaignsByTags.length})</span>
                  {selectedCampaignIds.length > 0 && (
                    <span className="ml-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {selectedCampaignIds.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveLevel('conjuntos')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeLevel === 'conjuntos'
                      ? 'bg-brand-neon text-black shadow-md shadow-brand-neon/20'
                      : 'bg-brand-card text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Conjuntos de Anúncios ({filteredAdSetsForTab.length})</span>
                  {selectedAdSetIds.length > 0 ? (
                    <span className="ml-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {selectedAdSetIds.length}
                    </span>
                  ) : selectedCampaignIds.length > 0 ? (
                    <span className="ml-1 bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full">
                      Filtrado por {selectedCampaignIds.length} camp.
                    </span>
                  ) : null}
                </button>

                <button
                  onClick={() => setActiveLevel('anuncios')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeLevel === 'anuncios'
                      ? 'bg-brand-neon text-black shadow-md shadow-brand-neon/20'
                      : 'bg-brand-card text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  <span>Anúncios ({filteredAdsForTab.length})</span>
                  {selectedAdIds.length > 0 ? (
                    <span className="ml-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {selectedAdIds.length}
                    </span>
                  ) : selectedAdSetIds.length > 0 ? (
                    <span className="ml-1 bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full">
                      Filtrado por {selectedAdSetIds.length} conj.
                    </span>
                  ) : selectedCampaignIds.length > 0 ? (
                    <span className="ml-1 bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full">
                      Filtrado por {selectedCampaignIds.length} camp.
                    </span>
                  ) : null}
                </button>
              </div>

              {/* Selection Banner */}
              <div className="flex items-center gap-2 text-xs">
                {selectedCampaignIds.length > 0 && (
                  <span className="bg-blue-950/60 border border-blue-500/40 text-blue-200 px-3 py-1 rounded-lg flex items-center gap-2 font-medium">
                    <span>
                      Filtrado por <strong>{selectedCampaignIds.length}</strong>{' '}
                      {selectedCampaignIds.length === 1 ? 'campanha selecionada' : 'campanhas selecionadas'}
                    </span>
                    <button
                      onClick={() => setSelectedCampaignIds([])}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold transition-all"
                      title="Limpar seleção de campanhas"
                    >
                      Limpar
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Tabelas de Detalhes por Nível */}
            {activeLevel === 'top25' && (
              <AdsMetricsTable
                ads={localAds}
                adsets={adsets}
                metaCpl={currentAccountMetaCpl}
                accountName={selectedAccName}
                onToggleAdStatus={handleToggleAdStatus}
                isLoading={isLoading}
              />
            )}

            {activeLevel === 'campanhas' && (
              <CampaignLevelTable
                campaigns={filteredCampaignsByTags}
                selectedCampaignIds={selectedCampaignIds}
                onToggleSelectCampaign={handleToggleSelectCampaign}
                onToggleSelectAllCampaigns={handleToggleSelectAllCampaigns}
                onSelectCampaign={handleSelectCampaign}
                onToggleStatus={onToggleCampaignStatus}
                isLoading={isLoading}
              />
            )}

            {activeLevel === 'conjuntos' && (
              <AdSetLevelTable
                adsets={filteredAdSetsForTab}
                selectedCampaignId={selectedCampaignId}
                selectedAdSetIds={selectedAdSetIds}
                onToggleSelectAdSet={handleToggleSelectAdSet}
                onToggleSelectAllAdSets={handleToggleSelectAllAdSets}
                onSelectAdSet={handleSelectAdSet}
                onClearCampaignFilter={() => {
                  setSelectedCampaignId(undefined);
                  setSelectedCampaignIds([]);
                }}
                isLoading={isLoading}
              />
            )}

            {activeLevel === 'anuncios' && (
              <AdLevelTable
                ads={filteredAdsForTab}
                selectedAdSetId={selectedAdSetId}
                selectedAdIds={selectedAdIds}
                onToggleSelectAd={handleToggleSelectAd}
                onToggleSelectAllAds={handleToggleSelectAllAds}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
});

GerenciadorView.displayName = 'GerenciadorView';
