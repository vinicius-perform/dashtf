import React, { useState } from 'react';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { 
  MetaCampaign, 
  MetaAdSet, 
  MetaAd, 
  DashboardSummary 
} from '../types/meta';
import { MetricCard } from './MetricCard';
import { CampaignLevelTable } from './CampaignLevelTable';
import { AdSetLevelTable } from './AdSetLevelTable';
import { AdLevelTable } from './AdLevelTable';
import { 
  Megaphone, 
  Layers, 
  Target, 
  ChevronRight, 
  AlertCircle,
  HelpCircle,
  Maximize2
} from 'lucide-react';

import { SavedViewsBar } from './SavedViewsBar';
import { OmniboxSearch } from './OmniboxSearch';
import { EditViewModal } from './EditViewModal';
import { SavedView, FilterTag, getSavedViews } from '../services/meta/savedViewsStore';

interface DashboardViewProps {
  summary: DashboardSummary;
  campaigns: MetaCampaign[];
  adsets: MetaAdSet[];
  ads: MetaAd[];
  activeLevel: string;
  setActiveLevel: (level: string) => void;
  onToggleCampaignStatus: (id: string) => void;
  isLoading?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = React.memo(({
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

  // Saved Views & Omnibox States
  const [views, setViews] = useState<SavedView[]>(getSavedViews());
  const [activeViewId, setActiveViewId] = useState<string>('view_all');
  const [activeFilters, setActiveFilters] = useState<FilterTag[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetModalView, setTargetModalView] = useState<SavedView | undefined>();

  // Meta Ads Style Multi-Select Checkbox States
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [selectedAdSetIds, setSelectedAdSetIds] = useState<string[]>([]);
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);

  const handleSelectView = (view: SavedView) => {
    setActiveViewId(view.id);
    if (view.config?.filters) {
      setActiveFilters(view.config.filters);
    } else {
      setActiveFilters([]);
    }
  };

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
    setSelectedAdSetId(undefined);
    setActiveLevel('conjuntos');
  };

  const handleSelectAdSet = (adsetId: string) => {
    setSelectedAdSetId(adsetId);
    setActiveLevel('anuncios');
  };

  // Cascading Drill-Down Filtering (Meta Ads Cascade Logic)
  const filteredAdSetsForTab = React.useMemo(() => {
    if (selectedCampaignIds.length > 0) {
      return adsets.filter(as => selectedCampaignIds.includes(as.campaign_id));
    }
    return adsets;
  }, [adsets, selectedCampaignIds]);

  const filteredAdsForTab = React.useMemo(() => {
    if (selectedAdSetIds.length > 0) {
      return ads.filter(ad => selectedAdSetIds.includes(ad.adset_id));
    }
    if (selectedCampaignIds.length > 0) {
      return ads.filter(ad => selectedCampaignIds.includes(ad.campaign_id));
    }
    return ads;
  }, [ads, selectedAdSetIds, selectedCampaignIds]);

  const selectedCampaignName = campaigns.find(c => c.id === selectedCampaignId)?.name;
  const selectedAdSetName = adsets.find(as => as.id === selectedAdSetId)?.name;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Metric KPI Cards (Strict Data Integrity Engine Rules) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Investimento Total */}
        <MetricCard
          title="Investimento Total"
          mainValue={formatCurrency(summary.investimentoTotal)}
          isLoading={isLoading}
        />

        {/* Card 2: Impressões */}
        <MetricCard
          title="Impressões"
          mainValue={formatNumber(summary.impressioesTotal)}
          showDollarIcon={false}
          isLoading={isLoading}
        />

        {/* Card 3: Cliques */}
        <MetricCard
          title="Cliques no Link"
          mainValue={formatNumber(summary.cliquesTotal)}
          showDollarIcon={false}
          isLoading={isLoading}
        />

        {/* Card 4: CTR Médio */}
        <MetricCard
          title="CTR Médio"
          mainValue={formatPercent(summary.ctrMedio)}
          showDollarIcon={false}
          isLoading={isLoading}
        />

        {/* Card 5: CPC Médio */}
        <MetricCard
          title="CPC Médio"
          mainValue={formatCurrency(summary.cpcMedio)}
          isLoading={isLoading}
        />

        {/* Card 6: Conversões / Leads */}
        <MetricCard
          title="Leads / Compras"
          mainValue={formatNumber(summary.leadsTotal)}
          extraInfoLabel="CPA / CAC"
          extraInfoValue={formatCurrency(summary.cpaMedio)}
          showDollarIcon={false}
          isLoading={isLoading}
        />
      </div>

      {/* Saved Views Bar & Omnibox Smart Search (Meta Ads Manager Standard) */}
      <div className="space-y-3 bg-brand-card p-4 rounded-2xl border border-brand-border shadow-lg">
        <SavedViewsBar
          views={views}
          activeViewId={activeViewId}
          onSelectView={handleSelectView}
          onOpenEditModal={(view) => {
            setTargetModalView(view);
            setIsEditModalOpen(true);
          }}
        />

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

      {/* Modal Editar Visualização */}
      <EditViewModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        targetView={targetModalView}
        currentFilters={activeFilters}
        onApplyView={handleSelectView}
      />
    </div>
  );
});

DashboardView.displayName = 'DashboardView';
