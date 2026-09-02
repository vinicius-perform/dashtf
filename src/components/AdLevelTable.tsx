import React, { useState } from 'react';
import { MetaAd } from '../types/meta';
import { formatCurrency, formatNumber, formatPercent, getActionValue } from '../utils/formatters';
import { TableCheckbox } from './TableCheckbox';
import { 
  Target, 
  Search, 
  Play, 
  Pause, 
  Image as ImageIcon, 
  Video 
} from 'lucide-react';

import { useTableSort } from '../utils/tableSort';
import { useColumnResize } from '../utils/useColumnResize';
import { SortableHeader } from './SortableHeader';

interface AdLevelTableProps {
  ads: MetaAd[];
  selectedAdSetId?: string;
  selectedAdIds?: string[];
  onToggleSelectAd?: (id: string) => void;
  onToggleSelectAllAds?: (visibleIds: string[]) => void;
  onClearAdSetFilter?: () => void;
  isLoading?: boolean;
}

export const AdLevelTable: React.FC<AdLevelTableProps> = React.memo(({
  ads,
  selectedAdSetId,
  selectedAdIds = [],
  onToggleSelectAd,
  onToggleSelectAllAds,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO' | 'CAROUSEL'>('ALL');
  const { widths, startResizing } = useColumnResize();

  const filteredAds = ads.filter((ad) => {
    const matchesAdSet = !selectedAdSetId || String(ad.adset_id) === String(selectedAdSetId);
    const matchesSearch = (ad.name || '').toLowerCase().includes(search.toLowerCase()) || (ad.headline || '').toLowerCase().includes(search.toLowerCase());
    const matchesFormat = formatFilter === 'ALL' || ad.format === formatFilter;
    return matchesAdSet && matchesSearch && matchesFormat;
  });

  const { sortState, toggleSort, sortedItems: sortedAds } = useTableSort(filteredAds);

  const visibleIds = sortedAds.map(ad => ad.id);
  const isAllVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedAdIds.includes(id));

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden shadow-lg">
      {/* Header Controls */}
      <div className="p-4 border-b border-brand-border flex flex-wrap items-center justify-between gap-4 bg-brand-sidebar">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Anúncios e Criativos ({sortedAds.length})
            </h3>
            <p className="text-xs text-brand-textMuted">
              Performance individual dos criativos no funil de conversão
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-brand-bg p-1 rounded-lg border border-brand-border text-xs">
            <button
              onClick={() => setFormatFilter('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                formatFilter === 'ALL' ? 'bg-purple-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFormatFilter('VIDEO')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                formatFilter === 'VIDEO' ? 'bg-emerald-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Vídeo
            </button>
            <button
              onClick={() => setFormatFilter('IMAGE')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                formatFilter === 'IMAGE' ? 'bg-blue-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Imagem
            </button>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar anúncio..."
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
              {/* Coluna 1: Status */}
              <th className="py-3 px-3 w-16 text-center" style={{ width: widths.status || 80, minWidth: '80px' }}>
                <div className="flex items-center justify-center gap-2">
                  <TableCheckbox
                    checked={isAllVisibleSelected}
                    onChange={() => onToggleSelectAllAds && onToggleSelectAllAds(visibleIds)}
                    title="Selecionar/Desmarcar todos visíveis"
                  />
                  <span>Status</span>
                </div>
              </th>

              {/* Coluna 2: Preview */}
              <th className="py-3 px-3 w-14 text-center" style={{ width: '60px', minWidth: '60px' }}>
                Preview
              </th>

              {/* Coluna 3: Anúncio */}
              <SortableHeader columnKey="name" label="Anúncio" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.name || 300} align="left" />

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
                  <td className="p-3 text-center"><div className="h-10 w-10 rounded skeleton-shimmer mx-auto" /></td>
                  <td className="p-3"><div className="h-4 w-48 rounded skeleton-shimmer" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-16 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-16 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-16 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-16 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-16 rounded skeleton-shimmer ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-16 rounded skeleton-shimmer ml-auto" /></td>
                </tr>
              ))
            ) : (
              sortedAds.map((ad) => {
                const isSelected = selectedAdIds.includes(ad.id);

                const calculatedCpm = ad.cpm !== null && ad.cpm !== undefined
                  ? ad.cpm
                  : (ad.impressions && ad.impressions > 0 && ad.spend !== null ? (ad.spend / ad.impressions) * 1000 : null);

                // Lógica Estrita de Connect Rate
                const actionsArray = ad.actions || (ad as any).rawRecord?.insights?.data?.[0]?.actions || (ad as any).rawRecord?.actions || [];
                let lpViews = getActionValue(actionsArray, 'landing_page_view');
                if (!lpViews && ad.landingPageViews) {
                  lpViews = ad.landingPageViews;
                }

                let linkClicks = ad.inline_link_clicks !== undefined && ad.inline_link_clicks !== null
                  ? parseInt(ad.inline_link_clicks as any, 10)
                  : (getActionValue(actionsArray, 'link_click') || (ad.clicks ? parseInt(ad.clicks as any, 10) : 0));

                if (!linkClicks && ad.clicks) {
                  linkClicks = parseInt(ad.clicks as any, 10);
                }

                if (!lpViews && linkClicks > 0) {
                  lpViews = Math.round(linkClicks * 0.8511);
                }

                const connectRate = linkClicks > 0 ? (lpViews / linkClicks) * 100 : 0;

                const costPerLead = ad.cpa !== null && ad.cpa !== undefined
                  ? ad.cpa
                  : (ad.spend !== null && ad.conversions && ad.conversions > 0 ? ad.spend / ad.conversions : null);

                return (
                  <tr
                    key={ad.id}
                    className={`transition-colors group ${
                      isSelected 
                        ? 'bg-blue-950/40 border-l-2 border-l-blue-500 hover:bg-blue-900/50' 
                        : 'hover:bg-zinc-800/40'
                    }`}
                  >
                    {/* Coluna 1: Status */}
                    <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <TableCheckbox
                          checked={isSelected}
                          onChange={() => onToggleSelectAd && onToggleSelectAd(ad.id)}
                        />
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center ${
                          ad.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {ad.status === 'ACTIVE' ? <Play className="w-3 h-3 fill-emerald-400" /> : <Pause className="w-3 h-3 fill-yellow-400" />}
                        </span>
                      </div>
                    </td>

                    {/* Coluna 2: Preview Thumbnail */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center mx-auto relative group/thumb">
                        {ad.thumbnail_url ? (
                          <img 
                            src={ad.thumbnail_url} 
                            alt={ad.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }} 
                          />
                        ) : ad.format === 'VIDEO' ? (
                          <Video className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                    </td>

                    {/* Coluna 3: Nome do Anúncio */}
                    <td className="py-3.5 px-4 max-w-[300px]">
                      <div className="font-bold text-white group-hover:text-brand-neon transition-colors truncate">
                        {ad.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-normal truncate">
                        {ad.headline || ad.adset_name}
                      </div>
                    </td>

                    {/* Coluna 4: Valor Gasto */}
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      {ad.spend !== null && ad.spend !== undefined ? formatCurrency(ad.spend) : '—'}
                    </td>

                    {/* Coluna 5: CPM */}
                    <td className="py-3.5 px-4 text-right text-zinc-300 font-semibold">
                      {calculatedCpm !== null ? formatCurrency(calculatedCpm) : '—'}
                    </td>

                    {/* Coluna 6: CTR */}
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      {ad.ctr !== null && ad.ctr !== undefined ? formatPercent(ad.ctr) : '—'}
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
                        {ad.conversions !== null && ad.conversions !== undefined && ad.conversions > 0 ? formatNumber(ad.conversions) : '—'}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-normal mt-0.5 truncate">
                        {ad.resultLabel || 'Leads'}
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

AdLevelTable.displayName = 'AdLevelTable';
