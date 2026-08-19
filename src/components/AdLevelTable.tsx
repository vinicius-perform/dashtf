import React, { useState } from 'react';
import { MetaAd } from '../types/meta';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { TableCheckbox } from './TableCheckbox';
import { DeliveryBadge } from './DeliveryBadge';
import { 
  Target, 
  Search, 
  Play, 
  Pause, 
  ExternalLink, 
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
  onClearAdSetFilter,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO' | 'CAROUSEL'>('ALL');
  const { widths, startResizing } = useColumnResize();

  const filteredAds = ads.filter((ad) => {
    const matchesAdSet = !selectedAdSetId || ad.adset_id === selectedAdSetId;
    const matchesSearch = ad.name.toLowerCase().includes(search.toLowerCase()) || ad.headline.toLowerCase().includes(search.toLowerCase());
    const matchesFormat = formatFilter === 'ALL' || ad.format === formatFilter;
    return matchesAdSet && matchesSearch && matchesFormat;
  });

  const { sortState, toggleSort, sortedItems: sortedAds } = useTableSort(filteredAds);

  const visibleIds = sortedAds.map(ad => ad.id);
  const isAllVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedAdIds.includes(id));

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden shadow-lg">
      {/* Header Controls */}
      <div className="p-4 border-b border-brand-border flex items-center justify-between bg-brand-sidebar">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Anúncios e Criativos ({sortedAds.length})
            </h3>
            <p className="text-xs text-brand-textMuted">
              Performance individual dos criativos
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
              <th className="py-3 px-3 w-10 text-center" style={{ width: '40px', minWidth: '40px' }}>
                <TableCheckbox
                  checked={isAllVisibleSelected}
                  onChange={() => onToggleSelectAllAds && onToggleSelectAllAds(visibleIds)}
                  title="Selecionar/Desmarcar todos visíveis"
                />
              </th>
              <SortableHeader columnKey="status" label="Status" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.status} align="center" />
              <th className="py-3 px-4 w-14" style={{ width: '60px', minWidth: '60px' }}>Preview</th>
              <SortableHeader columnKey="name" label="Anúncio" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.name} align="left" />
              <SortableHeader columnKey="deliveryInfo" label="Veiculação" sortState={sortState} onSort={toggleSort} onResizeStart={startResizing} width={widths.deliveryInfo} align="center" />
              <th className="py-3 px-4 text-right" style={{ width: '120px', minWidth: '120px' }}>Orçamento</th>
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
              <th className="py-3 px-4 text-center" style={{ width: '80px', minWidth: '80px' }}>Meta Ads</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border text-xs font-medium">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skel-${idx}`} className="border-b border-brand-border/60">
                  <td className="p-3 text-center"><div className="h-4 w-4 rounded skeleton-shimmer mx-auto" /></td>
                  <td className="p-3 text-center"><div className="h-6 w-6 rounded-full skeleton-shimmer mx-auto" /></td>
                  <td className="p-3"><div className="h-10 w-10 rounded skeleton-shimmer" /></td>
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
              sortedAds.map((ad) => {
                const isSelected = selectedAdIds.includes(ad.id);
                return (
                  <tr
                    key={ad.id}
                    className={`transition-colors group ${
                      isSelected 
                        ? 'bg-blue-950/40 border-l-2 border-l-blue-500 hover:bg-blue-900/50' 
                        : 'hover:bg-zinc-800/40'
                    }`}
                  >
                    {/* Checkbox Column */}
                    <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <TableCheckbox
                        checked={isSelected}
                        onChange={() => onToggleSelectAd && onToggleSelectAd(ad.id)}
                      />
                    </td>

                    {/* Status Switch */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center ${
                        ad.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {ad.status === 'ACTIVE' ? <Play className="w-3 h-3 fill-emerald-400" /> : <Pause className="w-3 h-3 fill-yellow-400" />}
                      </span>
                    </td>

                {/* Thumbnail Preview */}
                <td className="py-3 px-4">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-brand-border bg-zinc-900 shrink-0">
                    <img
                      src={ad.thumbnail_url}
                      alt={ad.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white p-0.5 rounded text-[8px]">
                      {ad.format === 'VIDEO' ? <Video className="w-2 h-2 text-brand-neon" /> : <ImageIcon className="w-2 h-2 text-blue-400" />}
                    </span>
                  </div>
                </td>

                {/* Name & Headline */}
                <td className="py-3.5 px-4 max-w-[260px]">
                  <div className="font-bold text-white group-hover:text-brand-neon transition-colors truncate">
                    {ad.name}
                  </div>
                  <div className="text-[11px] text-zinc-300 italic mt-0.5 truncate">
                    "{ad.headline}"
                  </div>
                </td>

                {/* Veiculação */}
                <td className="py-3.5 px-3 text-center">
                  <DeliveryBadge deliveryInfo={ad.deliveryInfo} statusFallback={ad.status} />
                </td>

                {/* Orçamento */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  Herdado (AdSet)
                </td>

                {/* Valor Gasto */}
                <td className="py-3.5 px-4 text-right font-bold text-white">
                  {formatCurrency(ad.spend)}
                </td>

                {/* Resultados (Number + Event Label below matching Meta Ads Manager) */}
                <td className="py-3.5 px-4 text-right">
                  <div className="font-bold text-emerald-400 text-xs">
                    {formatNumber(ad.conversions)}
                  </div>
                  {ad.resultLabel && (
                    <div className="text-[10px] text-zinc-400 font-normal mt-0.5 truncate max-w-[140px] ml-auto">
                      {ad.resultLabel}
                    </div>
                  )}
                </td>

                {/* Custo por Resultado */}
                <td className="py-3.5 px-4 text-right text-zinc-300 font-semibold">
                  {formatCurrency(ad.cpa)}
                </td>

                {/* Visitas ao perfil */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatNumber(ad.profileVisits)}
                </td>

                {/* % Retenção de Vídeo */}
                <td className="py-3.5 px-4 text-right text-brand-neon font-semibold">
                  {formatPercent(ad.retentionPct)}
                </td>

                {/* Seguidores no Instagram */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatNumber(ad.followersGained)}
                </td>

                {/* CPS */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatCurrency(ad.cps)}
                </td>

                {/* Impressões */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatNumber(ad.impressions)}
                </td>

                {/* CPM */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatCurrency(ad.cpm)}
                </td>

                {/* Alcance */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatNumber(ad.reach)}
                </td>

                {/* Frequência */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {ad.frequency !== null && ad.frequency !== undefined ? ad.frequency.toFixed(2) : '—'}
                </td>

                {/* Cliques no Link */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatNumber(ad.clicks)}
                </td>

                {/* CPC */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatCurrency(ad.cpc)}
                </td>

                {/* Visualizações da página */}
                <td className="py-3.5 px-4 text-right text-zinc-300">
                  {formatNumber(ad.landingPageViews)}
                </td>

                {/* CTR Único % */}
                <td className="py-3.5 px-4 text-right font-bold text-brand-neon">
                  {formatPercent(ad.ctr)}
                </td>

                {/* Meta Ads Link */}
                <td className="py-3.5 px-4 text-center">
                  <a
                    href={`https://adsmanager.facebook.com/adsmanager/manage/ads?act=${ad.campaign_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-400 hover:text-brand-neon text-xs font-medium transition-colors"
                    title="Ver no Meta Ads Manager"
                  >
                    <span>Meta</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
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
