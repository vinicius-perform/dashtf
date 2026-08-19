import React, { useState } from 'react';
import { MetaCampaign } from '../types/meta';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { TableCheckbox } from './TableCheckbox';
import { DeliveryBadge } from './DeliveryBadge';
import { 
  Search, 
  Play, 
  Pause, 
  Layers,
  ChevronRight
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
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { sortState, toggleSort, sortedItems: sortedCampaigns } = useTableSort(filteredCampaigns);

  const visibleIds = sortedCampaigns.map(c => c.id);
  const isAllVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedCampaignIds.includes(id));

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
              Métricas sincronizadas no padrão de colunas do Meta Ads Manager
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

      {/* Table Content with Interactive Column Resizing */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap table-fixed">
          <thead>
            <tr className="bg-brand-sidebar border-b border-brand-border text-[11px] font-bold text-brand-textMuted uppercase tracking-wider">
              {/* Checkbox Master Header Column */}
              <th className="py-3 px-3 w-10 text-center" style={{ width: '40px', minWidth: '40px' }}>
                <TableCheckbox
                  checked={isAllVisibleSelected}
                  onChange={() => onToggleSelectAllCampaigns && onToggleSelectAllCampaigns(visibleIds)}
                  title="Selecionar/Desmarcar todas visíveis"
                />
              </th>
              <SortableHeader columnKey="status" label="Status" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.status} align="center" />
              <SortableHeader columnKey="name" label="Campanha" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.name} align="left" />
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
              sortedCampaigns.map((c) => {
                const isSelected = selectedCampaignIds.includes(c.id);
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
                    {/* Checkbox Column */}
                    <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <TableCheckbox
                        checked={isSelected}
                        onChange={() => onToggleSelectCampaign && onToggleSelectCampaign(c.id)}
                      />
                    </td>
                  {/* Status Toggle Switch */}
                  <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
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
                  </td>

                  {/* Nome da Campanha */}
                  <td className="py-3.5 px-4 font-bold text-white group-hover:text-brand-neon transition-colors max-w-[280px] truncate">
                    {c.name}
                  </td>

                  {/* Veiculação */}
                  <td className="py-3.5 px-3 text-center">
                    <DeliveryBadge deliveryInfo={c.deliveryInfo} statusFallback={c.status} />
                  </td>

                  {/* Orçamento */}
                  <td className="py-3.5 px-4 text-right text-zinc-300">
                    {c.daily_budget ? formatCurrency(c.daily_budget) : 'CBO / Livre'}
                  </td>

                  {/* Valor Gasto */}
                  <td className="py-3.5 px-4 text-right font-bold text-white">
                    {formatCurrency(c.spend)}
                  </td>

                  {/* Resultados (Number + Event Label below matching Meta Ads Manager) */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="font-bold text-emerald-400 text-xs">
                      {formatNumber(c.conversions)}
                    </div>
                    {c.resultLabel && (
                      <div className="text-[10px] text-zinc-400 font-normal mt-0.5 truncate max-w-[140px] ml-auto">
                        {c.resultLabel}
                      </div>
                    )}
                  </td>

                  {/* Custo por Resultado */}
                  <td className="py-3.5 px-4 text-right text-zinc-300 font-semibold">
                    {formatCurrency(c.cpa)}
                  </td>

                  {/* Visitas ao Perfil */}
                  <td className="py-3.5 px-4 text-right text-zinc-300">
                    {formatNumber(c.profileVisits)}
                  </td>

                  {/* % Retenção de Vídeo */}
                  <td className="py-3.5 px-4 text-right text-brand-neon font-semibold">
                    {formatPercent(c.retentionPct)}
                  </td>

                  {/* Seguidores no Instagram */}
                  <td className="py-3.5 px-4 text-right text-zinc-300">
                    {formatNumber(c.followersGained)}
                  </td>

                  {/* CPS */}
                  <td className="py-3.5 px-4 text-right text-zinc-300">
                    {formatCurrency(c.cps)}
                  </td>

                  {/* Impressões */}
                  <td className="py-3.5 px-4 text-right text-zinc-300">
                    {formatNumber(c.impressions)}
                  </td>

                  {/* CPM */}
                  <td className="py-3.5 px-4 text-right text-zinc-300">
                    {formatCurrency(c.cpm)}
                  </td>

                  {/* Alcance */}
                  <td className="py-3.5 px-4 text-right text-zinc-300">
                    {formatNumber(c.reach)}
                  </td>

                  {/* Frequência */}
                  <td className="py-3.5 px-4 text-right text-zinc-300">
                    {c.frequency !== null && c.frequency !== undefined ? c.frequency.toFixed(2) : '—'}
                  </td>

                  {/* Cliques no Link */}
                  <td className="py-3.5 px-4 text-right text-zinc-300">
                    {formatNumber(c.clicks)}
                  </td>

                  {/* CPC */}
                  <td className="py-3.5 px-4 text-right text-zinc-300">
                    {formatCurrency(c.cpc)}
                  </td>

                  {/* Visualizações da página */}
                  <td className="py-3.5 px-4 text-right text-zinc-300">
                    {formatNumber(c.landingPageViews)}
                  </td>

                  {/* CTR Único % */}
                  <td className="py-3.5 px-4 text-right font-bold text-brand-neon">
                    {formatPercent(c.ctr)}
                  </td>

                  {/* Action Drilldown */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCampaign(c.id);
                      }}
                      className="inline-flex items-center gap-1 bg-brand-bg hover:bg-brand-neon text-zinc-300 hover:text-black font-semibold text-xs px-2.5 py-1 rounded-md border border-brand-border transition-all"
                    >
                      <span>Conjuntos</span>
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

CampaignLevelTable.displayName = 'CampaignLevelTable';
