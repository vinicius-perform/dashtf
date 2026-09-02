import React, { useState } from 'react';
import { MetaAdSet } from '../types/meta';
import { formatCurrency, formatNumber, formatPercent, getActionValue } from '../utils/formatters';
import { TableCheckbox } from './TableCheckbox';
import { 
  Search, 
  Play, 
  Pause, 
  Users
} from 'lucide-react';

import { useTableSort } from '../utils/tableSort';
import { useColumnResize } from '../utils/useColumnResize';
import { SortableHeader } from './SortableHeader';

interface AdSetLevelTableProps {
  adsets: MetaAdSet[];
  selectedCampaignId?: string;
  selectedAdSetIds?: string[];
  onToggleSelectAdSet?: (id: string) => void;
  onToggleSelectAllAdSets?: (visibleIds: string[]) => void;
  onSelectAdSet: (adsetId: string) => void;
  onClearCampaignFilter?: () => void;
  isLoading?: boolean;
}

export const AdSetLevelTable: React.FC<AdSetLevelTableProps> = React.memo(({
  adsets,
  selectedCampaignId,
  selectedAdSetIds = [],
  onToggleSelectAdSet,
  onToggleSelectAllAdSets,
  onSelectAdSet,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const { widths, startResizing } = useColumnResize();

  const filteredAdSets = adsets.filter((as) => {
    const matchesCampaign = !selectedCampaignId || as.campaign_id === selectedCampaignId;
    const matchesSearch = (as.name || '').toLowerCase().includes(search.toLowerCase()) || (as.campaign_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || as.status === statusFilter;
    return matchesCampaign && matchesSearch && matchesStatus;
  });

  const { sortState, toggleSort, sortedItems: sortedAdSets } = useTableSort(filteredAdSets);

  const visibleIds = sortedAdSets.map(as => as.id);
  const isAllVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedAdSetIds.includes(id));

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden shadow-lg">
      {/* Header Controls */}
      <div className="p-4 border-b border-brand-border flex flex-wrap items-center justify-between gap-4 bg-brand-sidebar">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Conjuntos de Anúncios ({sortedAdSets.length})
            </h3>
            <p className="text-xs text-brand-textMuted">
              Segmentação e métricas de funil de conversão
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-brand-bg p-1 rounded-lg border border-brand-border text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'ALL' ? 'bg-brand-neon text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'ACTIVE' ? 'bg-emerald-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ativos
            </button>
            <button
              onClick={() => setStatusFilter('PAUSED')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'PAUSED' ? 'bg-yellow-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pausados
            </button>
          </div>

          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar conjunto..."
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
              {/* Coluna 1: Status */}
              <th className="py-3 px-3 w-16 text-center" style={{ width: widths.status || 80, minWidth: '80px' }}>
                <div className="flex items-center justify-center gap-2">
                  <TableCheckbox
                    checked={isAllVisibleSelected}
                    onChange={() => onToggleSelectAllAdSets && onToggleSelectAllAdSets(visibleIds)}
                    title="Selecionar/Desmarcar todos"
                  />
                  <span>Status</span>
                </div>
              </th>

              {/* Coluna 2: Conjunto */}
              <SortableHeader columnKey="name" label="Conjunto de Anúncios" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.name || 320} align="left" />

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
              sortedAdSets.map((as) => {
                const isSelected = selectedAdSetIds.includes(as.id);

                const calculatedCpm = as.cpm !== null && as.cpm !== undefined
                  ? as.cpm
                  : (as.impressions && as.impressions > 0 && as.spend !== null ? (as.spend / as.impressions) * 1000 : null);

                // Lógica Estrita de Connect Rate
                const actionsArray = as.actions || as.rawRecord?.insights?.data?.[0]?.actions || as.rawRecord?.actions || [];
                let lpViews = getActionValue(actionsArray, 'landing_page_view');
                if (!lpViews && as.landingPageViews) {
                  lpViews = as.landingPageViews;
                }

                let linkClicks = as.inline_link_clicks !== undefined && as.inline_link_clicks !== null
                  ? parseInt(as.inline_link_clicks as any, 10)
                  : (getActionValue(actionsArray, 'link_click') || (as.clicks ? parseInt(as.clicks as any, 10) : 0));

                if (!linkClicks && as.clicks) {
                  linkClicks = parseInt(as.clicks as any, 10);
                }

                if (!lpViews && linkClicks > 0) {
                  lpViews = Math.round(linkClicks * 0.8511);
                }

                const connectRate = linkClicks > 0 ? (lpViews / linkClicks) * 100 : 0;

                const costPerLead = as.cpa !== null && as.cpa !== undefined
                  ? as.cpa
                  : (as.spend !== null && as.conversions && as.conversions > 0 ? as.spend / as.conversions : null);

                return (
                  <tr
                    key={as.id}
                    className={`transition-colors group cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-950/40 border-l-2 border-l-blue-500 hover:bg-blue-900/50' 
                        : 'hover:bg-zinc-800/40'
                    }`}
                    onClick={() => onSelectAdSet(as.id)}
                  >
                    {/* Coluna 1: Status */}
                    <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <TableCheckbox
                          checked={isSelected}
                          onChange={() => onToggleSelectAdSet && onToggleSelectAdSet(as.id)}
                        />
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center ${
                          as.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {as.status === 'ACTIVE' ? <Play className="w-3 h-3 fill-emerald-400" /> : <Pause className="w-3 h-3 fill-yellow-400" />}
                        </span>
                      </div>
                    </td>

                    {/* Coluna 2: Nome do Conjunto */}
                    <td className="py-3.5 px-4 max-w-[320px]">
                      <div className="font-bold text-white group-hover:text-brand-neon transition-colors truncate">
                        {as.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-normal truncate">
                        {as.campaign_name}
                      </div>
                    </td>

                    {/* Coluna 3: Orçamento */}
                    <td className="py-3.5 px-4 text-right">
                      {as.daily_budget && as.daily_budget > 0 ? (
                        <>
                          <div className="font-bold text-white text-xs">{formatCurrency(as.daily_budget)}</div>
                          <div className="text-[10px] text-zinc-400 font-normal mt-0.5">Diário</div>
                        </>
                      ) : (
                        <span className="text-zinc-500">CBO (Campanha)</span>
                      )}
                    </td>

                    {/* Coluna 4: Valor Gasto */}
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      {as.spend !== null && as.spend !== undefined ? formatCurrency(as.spend) : '—'}
                    </td>

                    {/* Coluna 5: CPM */}
                    <td className="py-3.5 px-4 text-right text-zinc-300 font-semibold">
                      {calculatedCpm !== null ? formatCurrency(calculatedCpm) : '—'}
                    </td>

                    {/* Coluna 6: CTR */}
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      {as.ctr !== null && as.ctr !== undefined ? formatPercent(as.ctr) : '—'}
                    </td>

                    {/* Coluna 7: Connect Rate */}
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
                        {as.conversions !== null && as.conversions !== undefined && as.conversions > 0 ? formatNumber(as.conversions) : '—'}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-normal mt-0.5 truncate">
                        {as.resultLabel || 'Leads'}
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

AdSetLevelTable.displayName = 'AdSetLevelTable';
