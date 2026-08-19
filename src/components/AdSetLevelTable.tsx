import React, { useState } from 'react';
import { MetaAdSet } from '../types/meta';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { TableCheckbox } from './TableCheckbox';
import { DeliveryBadge } from './DeliveryBadge';
import { 
  Search, 
  Play, 
  Pause, 
  ChevronRight,
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
  onClearCampaignFilter,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const { widths, startResizing } = useColumnResize();

  const filteredAdSets = adsets.filter((as) => {
    const matchesCampaign = !selectedCampaignId || as.campaign_id === selectedCampaignId;
    const matchesSearch = as.name.toLowerCase().includes(search.toLowerCase()) || as.campaign_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || as.status === statusFilter;
    return matchesCampaign && matchesSearch && matchesStatus;
  });

  const { sortState, toggleSort, sortedItems: sortedAdSets } = useTableSort(filteredAdSets);

  const visibleIds = sortedAdSets.map(as => as.id);
  const isAllVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedAdSetIds.includes(id));

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden shadow-lg">
      {/* Header Controls */}
      <div className="p-4 border-b border-brand-border flex items-center justify-between bg-brand-sidebar">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Conjuntos de Anúncios ({sortedAdSets.length})
            </h3>
            <p className="text-xs text-brand-textMuted">
              Segmentação e otimização de orçamento
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

          <div className="relative w-64">
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

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap table-fixed">
          <thead>
            <tr className="bg-brand-sidebar border-b border-brand-border text-[11px] font-bold text-brand-textMuted uppercase tracking-wider">
              <th className="py-3 px-3 w-10 text-center" style={{ width: '40px', minWidth: '40px' }}>
                <TableCheckbox
                  checked={isAllVisibleSelected}
                  onChange={() => onToggleSelectAllAdSets && onToggleSelectAllAdSets(visibleIds)}
                  title="Selecionar/Desmarcar todos visíveis"
                />
              </th>
              <SortableHeader columnKey="status" label="Status" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.status} align="center" />
              <SortableHeader columnKey="name" label="Conjunto de Anúncios" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.name} align="left" />
              <SortableHeader columnKey="deliveryInfo" label="Veiculação" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.deliveryInfo} align="center" />
              <SortableHeader columnKey="daily_budget" label="Orçamento" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.daily_budget} align="right" />
              <SortableHeader columnKey="spend" label="Valor gasto" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.spend} align="right" />
              <SortableHeader columnKey="conversions" label="Resultados" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.conversions} align="right" />
              <SortableHeader columnKey="cpa" label="Custo p/ Resultado" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.cpa} align="right" />
              <SortableHeader columnKey="profileVisits" label="Visitas ao perfil" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.profileVisits} align="right" />
              <SortableHeader columnKey="retentionPct" label="% retenção vídeo" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.retentionPct} align="right" />
              <SortableHeader columnKey="followersGained" label="Seguidores IG" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.followersGained} align="right" />
              <SortableHeader columnKey="cps" label="CPS" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.cps} align="right" />
              <SortableHeader columnKey="impressions" label="Impressões" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.impressions} align="right" />
              <SortableHeader columnKey="cpm" label="CPM" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.cpm} align="right" />
              <SortableHeader columnKey="reach" label="Alcance" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.reach} align="right" />
              <SortableHeader columnKey="frequency" label="Frequência" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.frequency} align="right" />
              <SortableHeader columnKey="clicks" label="Cliques no link" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.clicks} align="right" />
              <SortableHeader columnKey="cpc" label="CPC" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.cpc} align="right" />
              <SortableHeader columnKey="landingPageViews" label="Visitas Página" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.landingPageViews} align="right" />
              <SortableHeader columnKey="ctr" label="CTR Único %" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.ctr} align="right" />
              <th className="py-3 px-4 text-center" style={{ width: '80px', minWidth: '80px' }}>Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border text-xs font-medium">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skel-${idx}`} className="border-b border-brand-border/60">
                  <td className="p-3 text-center"><div className="h-4 w-4 rounded skeleton-shimmer mx-auto" /></td>
                  <td className="p-3 text-center"><div className="h-6 w-6 rounded-full skeleton-shimmer mx-auto" /></td>
                  <td className="p-3"><div className="h-4 w-48 rounded skeleton-shimmer" /></td>
                  <td className="p-3 text-center"><div className="h-4 w-12 rounded skeleton-shimmer mx-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-16 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-20 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-16 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-16 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-12 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-12 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-12 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-12 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-16 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-center"><div className="h-6 w-20 rounded skeleton-shimmer mx-auto" /></td>
                </tr>
              ))
            ) : (
              sortedAdSets.map((as) => {
                const isSelected = selectedAdSetIds.includes(as.id);
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
                    {/* Checkbox Column */}
                    <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <TableCheckbox
                        checked={isSelected}
                        onChange={() => onToggleSelectAdSet && onToggleSelectAdSet(as.id)}
                      />
                    </td>
                {/* Status Switch */}
                <td className="py-3.5 px-3 text-center">
                  <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center ${
                    as.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {as.status === 'ACTIVE' ? <Play className="w-3 h-3 fill-emerald-400" /> : <Pause className="w-3 h-3 fill-yellow-400" />}
                  </span>
                </td>

                {/* Nome do Conjunto */}
                <td className="py-3.5 px-4 max-w-[280px]">
                  <div className="font-bold text-white group-hover:text-brand-neon transition-colors truncate">
                    {as.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
                    Público: {as.targeting_summary}
                  </div>
                </td>

                {/* Veiculação */}
                <td className="py-3.5 px-3 text-center">
                  <DeliveryBadge deliveryInfo={as.deliveryInfo} statusFallback={as.status} />
                </td>

                {/* Orçamento */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {as.daily_budget ? formatCurrency(as.daily_budget) : 'Herdado (CBO)'}
                </td>

                {/* Valor Gasto */}
                <td className="py-3.5 px-4 text-right font-bold text-white">
                  {formatCurrency(as.spend)}
                </td>

                {/* Resultados (Number + Event Label below matching Meta Ads Manager) */}
                <td className="py-3.5 px-4 text-right">
                  <div className="font-bold text-emerald-400 text-xs">
                    {formatNumber(as.conversions)}
                  </div>
                  {as.resultLabel && (
                    <div className="text-[10px] text-zinc-400 font-normal mt-0.5 truncate max-w-[140px] ml-auto">
                      {as.resultLabel}
                    </div>
                  )}
                </td>

                {/* Custo por Resultado */}
                <td className="py-3.5 px-4 text-right text-zinc-300 font-semibold">
                  {formatCurrency(as.cpa)}
                </td>

                {/* Visitas ao perfil */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatNumber(as.profileVisits)}
                </td>

                {/* % Retenção de Vídeo */}
                <td className="py-3.5 px-4 text-right text-brand-neon font-semibold">
                  {formatPercent(as.retentionPct)}
                </td>

                {/* Seguidores no Instagram */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatNumber(as.followersGained)}
                </td>

                {/* CPS */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatCurrency(as.cps)}
                </td>

                {/* Impressões */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatNumber(as.impressions)}
                </td>

                {/* CPM */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatCurrency(as.cpm)}
                </td>

                {/* Alcance */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatNumber(as.reach)}
                </td>

                {/* Frequência */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {as.frequency !== null && as.frequency !== undefined ? as.frequency.toFixed(2) : '—'}
                </td>

                {/* Cliques no Link */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatNumber(as.clicks)}
                </td>

                {/* CPC */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatCurrency(as.cpc)}
                </td>

                {/* Visualizações da página */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatNumber(as.landingPageViews)}
                </td>

                {/* CTR Único % */}
                <td className="py-3.5 px-4 text-right font-bold text-brand-neon">
                  {formatPercent(as.ctr)}
                </td>

                {/* Action */}
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAdSet(as.id);
                    }}
                    className="inline-flex items-center gap-1 bg-brand-bg hover:bg-brand-neon text-zinc-300 hover:text-black font-semibold text-xs px-2.5 py-1 rounded-md border border-brand-border transition-all"
                  >
                    <span>Anúncios</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
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
