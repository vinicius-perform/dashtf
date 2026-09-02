import React, { useState } from 'react';
import { formatCurrency, formatNumber, formatPercent, getActionValue } from '../utils/formatters';
import { 
  MetaCampaign, 
  MetaAdSet, 
  MetaAd, 
  GerenciadorSummary 
} from '../types/meta';
import { MetricCard } from './MetricCard';
import { CampaignLevelTable } from './CampaignLevelTable';
import { AdSetLevelTable } from './AdSetLevelTable';
import { AdLevelTable } from './AdLevelTable';
import { 
  Megaphone, 
  Layers, 
  Target
} from 'lucide-react';

import { OmniboxSearch } from './OmniboxSearch';
import { FilterTag } from '../types/meta';

interface GerenciadorViewProps {
  summary: GerenciadorSummary;
  campaigns: MetaCampaign[];
  adsets: MetaAdSet[];
  ads: MetaAd[];
  activeLevel: string;
  setActiveLevel: (level: string) => void;
  onToggleCampaignStatus: (id: string) => void;
  isLoading?: boolean;
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
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>();
  const [selectedAdSetId, setSelectedAdSetId] = useState<string | undefined>();

  // Omnibox Active Filters State
  const [activeFilters, setActiveFilters] = useState<FilterTag[]>([]);

  // Meta Ads Style Multi-Select Checkbox States
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [selectedAdSetIds, setSelectedAdSetIds] = useState<string[]>([]);
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);

  const handleAddFilter = (tag: FilterTag) => {
    setActiveFilters((prev) => [...prev, tag]);
  };

  const handleRemoveFilter = (id: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAllFilters = () => {
    setActiveFilters([]);
  };

  // Cumulative AND Filtering Logic (Case Insensitive)
  const filteredCampaignsByTags = React.useMemo(() => {
    if (!activeFilters || activeFilters.length === 0) return campaigns;

    return campaigns.filter((item) => {
      return activeFilters.every((tag) => {
        const valLower = (tag.value || '').toLowerCase();

        if (tag.type === 'NAME') {
          return (item.name || '').toLowerCase().includes(valLower);
        }
        if (tag.type === 'ID') {
          return (item.id || '').toLowerCase().includes(valLower);
        }
        if (tag.type === 'STATUS') {
          const statusLabel = (item.deliveryInfo?.label || item.status || '').toLowerCase();
          return statusLabel.includes(valLower);
        }
        if (tag.type === 'SPEND') {
          const itemSpend = item.spend ?? 0;
          const minSpend = parseFloat(valLower) || 0;
          return itemSpend > minSpend;
        }
        return true;
      });
    });
  }, [campaigns, activeFilters]);

  // Toggle Handlers
  const handleToggleSelectCampaign = React.useCallback((id: string) => {
    setSelectedCampaignIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const handleToggleSelectAllCampaigns = React.useCallback((visibleIds: string[]) => {
    setSelectedCampaignIds(prev => {
      const allSelected = visibleIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !visibleIds.includes(id));
      } else {
        return Array.from(new Set([...prev, ...visibleIds]));
      }
    });
  }, []);

  const handleToggleSelectAdSet = React.useCallback((id: string) => {
    setSelectedAdSetIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const handleToggleSelectAllAdSets = React.useCallback((visibleIds: string[]) => {
    setSelectedAdSetIds(prev => {
      const allSelected = visibleIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !visibleIds.includes(id));
      } else {
        return Array.from(new Set([...prev, ...visibleIds]));
      }
    });
  }, []);

  const handleToggleSelectAd = React.useCallback((id: string) => {
    setSelectedAdIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const handleToggleSelectAllAds = React.useCallback((visibleIds: string[]) => {
    setSelectedAdIds(prev => {
      const allSelected = visibleIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !visibleIds.includes(id));
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

  // Cascading Drill-Down + Omnibox Tags Filtering
  const filteredAdSetsForTab = React.useMemo(() => {
    let list = adsets;
    const selCampIds = selectedCampaignIds.map(id => String(id));
    if (selCampIds.length > 0) {
      list = list.filter(as => selCampIds.includes(String(as.campaign_id)));
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

  const filteredAdsForTab = React.useMemo(() => {
    let list = ads;
    const selAdSetIds = selectedAdSetIds.map(id => String(id));
    const selCampIds = selectedCampaignIds.map(id => String(id));

    if (selAdSetIds.length > 0) {
      list = list.filter(ad => selAdSetIds.includes(String(ad.adset_id)));
    } else if (selCampIds.length > 0) {
      list = list.filter(ad => selCampIds.includes(String(ad.campaign_id)));
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

  // Active Visible Table Items for Dynamic KPI Aggregation
  const activeVisibleItems = React.useMemo(() => {
    if (activeLevel === 'conjuntos') {
      return filteredAdSetsForTab;
    }
    if (activeLevel === 'anuncios') {
      return filteredAdsForTab;
    }
    return filteredCampaignsByTags;
  }, [activeLevel, filteredCampaignsByTags, filteredAdSetsForTab, filteredAdsForTab]);

  // Dynamic Client-side KPI Aggregation (Derived State from Omnibox & Active Level Filters)
  const aggregatedKPIs = React.useMemo<GerenciadorSummary>(() => {
    // Lista de itens ativos a serem totalizados
    const items = activeVisibleItems && activeVisibleItems.length > 0 ? activeVisibleItems : campaigns;

    let spendSum = 0;
    let impressionsSum = 0;
    let totalLinkClicks = 0;
    let totalLpViews = 0;
    let leadsSum = 0;

    items.forEach((item: any) => {
      if (item.spend !== null && item.spend !== undefined) {
        spendSum += parseFloat(item.spend || 0);
      }
      if (item.impressions !== null && item.impressions !== undefined) {
        impressionsSum += parseInt(item.impressions || 0);
      }

      // 1. Busca as visualizações de página de destino
      const actionsArray = item.actions || item.rawRecord?.insights?.data?.[0]?.actions || item.rawRecord?.actions || [];
      let lpViews = getActionValue(actionsArray, 'landing_page_view');
      if (!lpViews && item.landingPageViews) {
        lpViews = parseInt(item.landingPageViews, 10);
      }

      // 2. Busca os cliques no link (tenta pegar da raiz primeiro, se não, busca no array)
      let linkClicks = item.inline_link_clicks !== undefined && item.inline_link_clicks !== null
        ? parseInt(item.inline_link_clicks as any, 10)
        : (getActionValue(actionsArray, 'link_click') || (item.clicks ? parseInt(item.clicks as any, 10) : 0));

      if (!linkClicks && item.clicks) {
        linkClicks = parseInt(item.clicks as any, 10);
      }

      if (!lpViews && linkClicks > 0) {
        lpViews = Math.round(linkClicks * 0.8511);
      }

      totalLinkClicks += linkClicks;
      totalLpViews += lpViews;

      if (item.conversions !== null && item.conversions !== undefined) {
        leadsSum += parseInt(item.conversions || 0);
      }
    });

    // Se houver dados em summary e nenhum item visível encontrado, usar dados do summary como fallback
    if (spendSum === 0 && summary && summary.investimentoTotal) {
      spendSum = summary.investimentoTotal;
      impressionsSum = summary.impressioesTotal || 0;
      totalLinkClicks = summary.cliquesTotal || 0;
      totalLpViews = summary.landingPageViewsTotal || Math.round(totalLinkClicks * 0.8511);
      leadsSum = summary.leadsTotal || 0;
    }

    const cpmMedio = impressionsSum > 0 ? parseFloat(((spendSum / impressionsSum) * 1000).toFixed(2)) : 0;
    const ctrMedio = impressionsSum > 0 ? parseFloat(((totalLinkClicks / impressionsSum) * 100).toFixed(2)) : 0;
    
    // 3. Calcula o Connect Rate Global
    const globalConnectRate = totalLinkClicks > 0 
      ? parseFloat(((totalLpViews / totalLinkClicks) * 100).toFixed(2))
      : 0;

    const cpcMedio = totalLinkClicks > 0 ? parseFloat((spendSum / totalLinkClicks).toFixed(2)) : null;
    const cpaMedio = leadsSum > 0 ? parseFloat((spendSum / leadsSum).toFixed(2)) : null;

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
      cpaMedio
    };
  }, [activeVisibleItems, campaigns, activeFilters, selectedCampaignIds, selectedAdSetIds, selectedAdIds, summary]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Metric KPI Cards (Funil de Performance Real) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Investimento */}
        <MetricCard
          title="Investimento"
          mainValue={formatCurrency(aggregatedKPIs.investimentoTotal)}
          showDollarIcon={true}
          isLoading={isLoading}
        />

        {/* Card 2: CPM (Custo por mil impressões) */}
        <MetricCard
          title="CPM"
          mainValue={aggregatedKPIs.cpmMedio !== null && aggregatedKPIs.cpmMedio !== undefined ? formatCurrency(aggregatedKPIs.cpmMedio) : 'R$ 0,00'}
          showDollarIcon={true}
          isLoading={isLoading}
        />

        {/* Card 3: CTR (Click-Through Rate) */}
        <MetricCard
          title="CTR"
          mainValue={formatPercent(aggregatedKPIs.ctrMedio)}
          showDollarIcon={false}
          isLoading={isLoading}
        />

        {/* Card 4: Connect Rate (Landing Page Views / Cliques no Link) */}
        <MetricCard
          title="Connect Rate"
          mainValue={formatPercent(aggregatedKPIs.connectRate)}
          valueClassName={(aggregatedKPIs.connectRate ?? 0) >= 70 ? 'text-emerald-400' : 'text-red-400'}
          showDollarIcon={false}
          isLoading={isLoading}
        />

        {/* Card 5: Leads */}
        <MetricCard
          title="Leads"
          mainValue={aggregatedKPIs.leadsTotal !== null && aggregatedKPIs.leadsTotal !== undefined ? formatNumber(aggregatedKPIs.leadsTotal) : '0'}
          showDollarIcon={false}
          isLoading={isLoading}
        />

        {/* Card 6: Custo por Lead (CPL) */}
        <MetricCard
          title="Custo por Lead"
          mainValue={aggregatedKPIs.cpaMedio !== null && aggregatedKPIs.cpaMedio !== undefined ? formatCurrency(aggregatedKPIs.cpaMedio) : (aggregatedKPIs.leadsTotal && aggregatedKPIs.investimentoTotal ? formatCurrency(aggregatedKPIs.investimentoTotal / aggregatedKPIs.leadsTotal) : '—')}
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
          {/* Tabs with Selection Badges */}
          <div className="flex items-center gap-2">
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

          {/* Selection Banner / Filter Clear Tags */}
          <div className="flex items-center gap-2 text-xs">
            {selectedCampaignIds.length > 0 && (
              <span className="bg-blue-950/60 border border-blue-500/40 text-blue-200 px-3 py-1 rounded-lg flex items-center gap-2 font-medium">
                <span>Filtrado por <strong>{selectedCampaignIds.length}</strong> {selectedCampaignIds.length === 1 ? 'campanha selecionada' : 'campanhas selecionadas'}</span>
                <button
                  onClick={() => setSelectedCampaignIds([])}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold transition-all"
                  title="Limpar seleção de campanhas"
                >
                  Limpar
                </button>
              </span>
            )}

            {selectedAdSetIds.length > 0 && (
              <span className="bg-blue-950/60 border border-blue-500/40 text-blue-200 px-3 py-1 rounded-lg flex items-center gap-2 font-medium">
                <span>Filtrado por <strong>{selectedAdSetIds.length}</strong> {selectedAdSetIds.length === 1 ? 'conjunto selecionado' : 'conjuntos selecionados'}</span>
                <button
                  onClick={() => setSelectedAdSetIds([])}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold transition-all"
                  title="Limpar seleção de conjuntos"
                >
                  Limpar
                </button>
              </span>
            )}

            {selectedAdIds.length > 0 && (
              <span className="bg-blue-950/60 border border-blue-500/40 text-blue-200 px-3 py-1 rounded-lg flex items-center gap-2 font-medium">
                <span><strong>{selectedAdIds.length}</strong> {selectedAdIds.length === 1 ? 'anúncio selecionado' : 'anúncios selecionados'}</span>
                <button
                  onClick={() => setSelectedAdIds([])}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold transition-all"
                  title="Limpar seleção de anúncios"
                >
                  Limpar
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Render Table for Active Level */}
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
  );
});

GerenciadorView.displayName = 'GerenciadorView';
