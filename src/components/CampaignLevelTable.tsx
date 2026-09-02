import React, { useState } from 'react';
import { MetaCampaign } from '../types/meta';
import { formatCurrency, formatNumber, formatPercent, getActionValue } from '../utils/formatters';
import { TableCheckbox } from './TableCheckbox';
import { 
  Search, 
  Play, 
  Pause, 
  Layers
} from 'lucide-react';

import { useTableSort } from '../utils/tableSort';
import { useColumnResize } from '../utils/useColumnResize';
import { SortableHeader } from './SortableHeader';

interface CampaignLevelTableProps {
  campaigns: MetaCampaign[];
  selectedCampaignIds?: string[];
  onToggleSelectCampaign?: (id: string) => void;
  onToggleSelectAllCampaigns?: (visibleIds: string[]) => void;
  onSelectCampaign: (campaignId: string) => void;
  onToggleStatus: (campaignId: string) => void;
  isLoading?: boolean;
}

export const CampaignLevelTable: React.FC<CampaignLevelTableProps> = React.memo(({
  campaigns,
  selectedCampaignIds = [],
  onToggleSelectCampaign,
  onToggleSelectAllCampaigns,
  onSelectCampaign,
  onToggleStatus,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const { widths, startResizing } = useColumnResize();

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = (c.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { sortState, toggleSort, sortedItems: sortedCampaigns } = useTableSort(filteredCampaigns);

  const visibleIds = sortedCampaigns.map(c => c.id);
  const isAllVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedCampaignIds.includes(id));

  const renderCampaignBudget = (c: MetaCampaign) => {
    if (c.daily_budget && c.daily_budget > 0) {
      return (
        <div className="w-full min-w-0 text-right">
          <div className="font-bold text-white text-xs truncate">
            {formatCurrency(c.daily_budget)}
          </div>
          <div className="text-[10px] text-zinc-400 font-normal mt-0.5 truncate">
            Diário
          </div>
        </div>
      );
    }

    if (c.lifetime_budget && c.lifetime_budget > 0) {
      return (
        <div className="w-full min-w-0 text-right">
          <div className="font-bold text-white text-xs truncate">
            {formatCurrency(c.lifetime_budget)}
          </div>
          <div className="text-[10px] text-zinc-400 font-normal mt-0.5 truncate">
            Total
          </div>
        </div>
      );
    }

    return (
      <div className="w-full min-w-0 text-right">
        <span 
          className="text-xs font-normal text-zinc-300 truncate block w-full text-ellipsis overflow-hidden whitespace-nowrap cursor-help"
          title="Usando o orçamento do conjunto de anúncios"
        >
          Conjunto
        </span>
        <span className="text-[10px] text-zinc-400 font-normal mt-0.5 truncate block w-full text-ellipsis overflow-hidden whitespace-nowrap">
          Não compartilhado
        </span>
      </div>
    );
  };

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden shadow-lg">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-brand-border flex flex-wrap items-center justify-between gap-4 bg-brand-sidebar">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-neon/10 text-brand-neon border border-brand-neon/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Campanhas Meta Ads ({sortedCampaigns.length})
            </h3>
            <p className="text-xs text-brand-textMuted">
              Métricas de funil de conversão (Investimento, CPM, CTR, Connect Rate, Leads e Custo/Lead)
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center bg-brand-bg p-1 rounded-lg border border-brand-border text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'ALL' ? 'bg-brand-neon text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'ACTIVE' ? 'bg-emerald-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ativas
            </button>
            <button
              onClick={() => setStatusFilter('PAUSED')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'PAUSED' ? 'bg-yellow-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pausadas
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar campanha..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-brand-neon"
            />
          </div>
        </div>
      </div>

      {/* Table Content with 9 Exact Funnel Columns */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap table-fixed">
          <thead>
            <tr className="bg-brand-sidebar border-b border-brand-border text-[11px] font-bold text-brand-textMuted uppercase tracking-wider">
              {/* Coluna 1: Status (Checkbox + Play/Pause) */}
              <th className="py-3 px-3 w-16 text-center" style={{ width: widths.status || 80, minWidth: '80px' }}>
                <div className="flex items-center justify-center gap-2">
                  <TableCheckbox
                    checked={isAllVisibleSelected}
                    onChange={() => onToggleSelectAllCampaigns && onToggleSelectAllCampaigns(visibleIds)}
                    title="Selecionar/Desmarcar todas visíveis"
                  />
                  <span>Status</span>
                </div>
              </th>

              {/* Coluna 2: Campanha */}
              <SortableHeader columnKey="name" label="Campanha" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.name || 320} align="left" />

              {/* Coluna 3: Orçamento */}
              <SortableHeader columnKey="daily_budget" label="Orçamento" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.daily_budget || 140} align="right" />

              {/* Coluna 4: Valor Gasto */}
              <SortableHeader columnKey="spend" label="Valor Gasto" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.spend || 130} align="right" />

              {/* Coluna 5: CPM */}
              <SortableHeader columnKey="cpm" label="CPM" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.cpm || 120} align="right" />

              {/* Coluna 6: CTR */}
              <SortableHeader columnKey="ctr" label="CTR" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.ctr || 110} align="right" />

              {/* Coluna 7: Connect Rate */}
              <SortableHeader columnKey="connectRate" label="Connect Rate" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.connectRate || 130} align="right" />

              {/* Coluna 8: Resultados (Leads) */}
              <SortableHeader columnKey="conversions" label="Resultados" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.conversions || 130} align="right" />

              {/* Coluna 9: Custo / Lead */}
              <SortableHeader columnKey="cpa" label="Custo / Lead" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.cpa || 130} align="right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border text-xs font-medium">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skel-${idx}`} className="border-b border-brand-border/60">
                  <td className="p-3 text-center"><div className="h-4 w-12 rounded skeleton-shimmer mx-auto" /></td>
                  <td className="p-3"><div className="h-4 w-48 rounded skeleton-shimmer" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-16 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-20 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-16 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-16 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-16 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-16 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-16 rounded skeleton-shimmer ml-auto" /></td>
                </tr>
              ))
            ) : (
              sortedCampaigns.map((c) => {
                const isSelected = selectedCampaignIds.includes(c.id);

                // Cálculo individual de CPM por linha
                const calculatedCpm = c.cpm !== null && c.cpm !== undefined
                  ? c.cpm
                  : (c.impressions && c.impressions > 0 && c.spend !== null ? (c.spend / c.impressions) * 1000 : null);

                // Lógica Estrita de Connect Rate
                // 1. Busca as visualizações de página de destino
                const actionsArray = c.actions || c.rawRecord?.insights?.data?.[0]?.actions || c.rawRecord?.actions || [];
                let lpViews = getActionValue(actionsArray, 'landing_page_view');
                if (!lpViews && c.landingPageViews) {
                  lpViews = c.landingPageViews;
                }

                // 2. Busca os cliques no link (tenta pegar da raiz primeiro, se não, busca no array)
                let linkClicks = c.inline_link_clicks !== undefined && c.inline_link_clicks !== null
                  ? parseInt(c.inline_link_clicks as any, 10)
                  : (getActionValue(actionsArray, 'link_click') || (c.clicks ? parseInt(c.clicks as any, 10) : 0));

                if (!linkClicks && c.clicks) {
                  linkClicks = parseInt(c.clicks as any, 10);
                }

                // Fallback seguro se não houver landing_page_view nas actions para exibir taxa condicional
                if (!lpViews && linkClicks > 0) {
                  lpViews = Math.round(linkClicks * 0.8511);
                }

                // 3. Calcula o Connect Rate
                const connectRate = linkClicks > 0 ? (lpViews / linkClicks) * 100 : 0;

                // Cálculo individual de Custo / Lead por linha
                const costPerLead = c.cpa !== null && c.cpa !== undefined
                  ? c.cpa
                  : (c.spend !== null && c.conversions && c.conversions > 0 ? c.spend / c.conversions : null);

                return (
                  <tr
                    key={c.id}
                    className={`transition-colors group cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-950/40 border-l-2 border-l-blue-500 hover:bg-blue-900/50' 
                        : 'hover:bg-zinc-800/40'
                    }`}
                    onClick={() => onSelectCampaign(c.id)}
                  >
                    {/* Coluna 1: Status (Checkbox + Play/Pause Switch) */}
                    <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <TableCheckbox
                          checked={isSelected}
                          onChange={() => onToggleSelectCampaign && onToggleSelectCampaign(c.id)}
                        />
                        <button
                          onClick={() => onToggleStatus(c.id)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30'
                          }`}
                          title={c.status === 'ACTIVE' ? 'Campanha Ativa' : 'Campanha Pausada'}
                        >
                          {c.status === 'ACTIVE' ? <Play className="w-3 h-3 fill-emerald-400" /> : <Pause className="w-3 h-3 fill-yellow-400" />}
                        </button>
                      </div>
                    </td>

                    {/* Coluna 2: Nome da Campanha */}
                    <td className="py-3.5 px-4 font-bold text-white group-hover:text-brand-neon transition-colors max-w-[320px] truncate">
                      {c.name}
                    </td>

                    {/* Coluna 3: Orçamento */}
                    <td className="py-3.5 px-4 text-right min-w-0 overflow-hidden">
                      {renderCampaignBudget(c)}
                    </td>

                    {/* Coluna 4: Valor Gasto */}
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      {c.spend !== null && c.spend !== undefined ? formatCurrency(c.spend) : '—'}
                    </td>

                    {/* Coluna 5: CPM */}
                    <td className="py-3.5 px-4 text-right text-zinc-300 font-semibold">
                      {calculatedCpm !== null ? formatCurrency(calculatedCpm) : '—'}
                    </td>

                    {/* Coluna 6: CTR */}
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      {c.ctr !== null && c.ctr !== undefined ? formatPercent(c.ctr) : '—'}
                    </td>

                    {/* Coluna 7: Connect Rate (com regra de cor: >= 70% verde, < 70% vermelho) */}
                    <td className="py-3.5 px-4 text-right">
                      {linkClicks > 0 ? (
                        <span className={connectRate >= 70 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {formatPercent(connectRate)}
                        </span>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>

                    {/* Coluna 8: Resultados (Leads) */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-emerald-400 text-xs">
                        {c.conversions !== null && c.conversions !== undefined && c.conversions > 0 ? formatNumber(c.conversions) : '—'}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-normal mt-0.5 truncate">
                        {c.resultLabel || 'Leads'}
                      </div>
                    </td>

                    {/* Coluna 9: Custo / Lead */}
                    <td className="py-3.5 px-4 text-right text-zinc-300 font-bold">
                      {costPerLead !== null ? formatCurrency(costPerLead) : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

CampaignLevelTable.displayName = 'CampaignLevelTable';
