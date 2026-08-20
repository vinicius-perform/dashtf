import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CreativePerformance, CreativesSummaryMetrics } from '../types/creatives';
import { CrmLead } from '../types/crm';
import { fetchCrmLeads } from '../services/crmLeadsService';
import { MetaAd, MetaCampaign, MetaAdSet } from '../types/meta';
import { formatCurrency, formatNumber, formatMultiplier } from '../utils/formatters';
import { MetricCard } from './MetricCard';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { getThisMonthRange, formatDateRangeLabel } from '../utils/timezone';
import { 
  Layers, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  Minus, 
  Filter, 
  Image as ImageIcon,
  ArrowUpDown,
  Copy,
  Check
} from 'lucide-react';

interface CreativesViewProps {
  ads?: MetaAd[];
  campaigns?: MetaCampaign[];
  adsets?: MetaAdSet[];
  isLoading?: boolean;
  dateRange?: DateRange;
  setDateRange?: (range: DateRange) => void;
  onRefresh?: () => void;
}

interface CrmAdAggregation {
  leads_generated: number;
  agendamentos: number;
  vendas: number;
  revenue: number;
  campaign_id?: string;
  adset_id?: string;
}

const renderStatusBadge = (status: 'LUCRATIVO' | 'EMPATE' | 'PREJUIZO' | 'ORGANICO') => {
  switch (status) {
    case 'LUCRATIVO':
      return (
        <span className="inline-flex items-center gap-1.5 bg-brand-neon text-black font-bold px-2.5 py-0.5 rounded-full text-xs shadow-md shadow-brand-neon/20">
          <Sparkles className="w-3.5 h-3.5 fill-black text-brand-neon" />
          <span>Lucrativo</span>
        </span>
      );
    case 'PREJUIZO':
      return (
        <span className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Prejuízo</span>
        </span>
      );
    case 'ORGANICO':
      return (
        <span className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          <span>Orgânico / Direto</span>
        </span>
      );
    case 'EMPATE':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">
          <Minus className="w-3 h-3 text-yellow-400" />
          <span>Empate</span>
        </span>
      );
  }
};

export const CreativesView: React.FC<CreativesViewProps> = React.memo(({ 
  ads = [], 
  campaigns = [], 
  adsets = [], 
  isLoading: parentLoading = false,
  dateRange: propDateRange,
  setDateRange: propSetDateRange,
  onRefresh
}) => {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedAdId, setCopiedAdId] = useState<string | null>(null);

  const handleCopyId = useCallback((adId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!adId || adId === 'ORGANICO') return;
    navigator.clipboard.writeText(adId);
    setCopiedAdId(adId);
    setTimeout(() => {
      setCopiedAdId((prev) => (prev === adId ? null : prev));
    }, 2000);
  }, []);

  const [localDateRange, setLocalDateRange] = useState<DateRange>(() => {
    const range = getThisMonthRange('America/Sao_Paulo');
    range.label = formatDateRangeLabel(range.startDate, range.endDate, 'America/Sao_Paulo');
    return range;
  });

  const effectiveDateRange = propDateRange || localDateRange;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const crmData = await fetchCrmLeads();
      setLeads(crmData);
    } catch (err) {
      console.error('Erro ao carregar leads para a análise de criativos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleManualRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const crmPromise = fetchCrmLeads().then(setLeads);
      const parentPromise = onRefresh ? onRefresh() : Promise.resolve();
      await Promise.all([crmPromise, parentPromise]);
    } catch (err) {
      console.error('Erro ao recarregar dados de atribuição:', err);
    } finally {
      setLoading(false);
    }
  }, [onRefresh]);

  const handleDateRangeChange = useCallback((range: DateRange) => {
    if (propSetDateRange) {
      propSetDateRange(range);
    } else {
      setLocalDateRange(range);
    }
  }, [propSetDateRange]);

  // 1. Filtrar leads do CRM por período e texto em tempo linear O(N)
  const filteredCrmLeads = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    const hasSearch = searchLower.length > 0;
    
    let startMs = 0;
    let endMs = Infinity;
    const hasDateRange = Boolean(effectiveDateRange.startDate && effectiveDateRange.endDate);
    
    if (hasDateRange) {
      startMs = new Date(`${effectiveDateRange.startDate}T00:00:00`).getTime();
      endMs = new Date(`${effectiveDateRange.endDate}T23:59:59.999`).getTime();
    }

    return leads.filter((lead) => {
      if (hasSearch) {
        const matchesSearch = 
          (lead.nome || '').toLowerCase().includes(searchLower) ||
          (lead.email || '').toLowerCase().includes(searchLower) ||
          (lead.telefone || '').toLowerCase().includes(searchLower) ||
          (lead.clinica || '').toLowerCase().includes(searchLower) ||
          (lead.sdr || '').toLowerCase().includes(searchLower) ||
          (lead.ad_id || '').toLowerCase().includes(searchLower) ||
          (lead.campaign_id || '').toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      if (hasDateRange) {
        const rawDate = lead.data_hora || lead.created_at;
        if (rawDate) {
          const leadTime = new Date(rawDate).getTime();
          if (isNaN(leadTime) || leadTime < startMs || leadTime > endMs) {
            return false;
          }
        }
      }

      return true;
    });
  }, [leads, search, effectiveDateRange.startDate, effectiveDateRange.endDate]);

  // 2. Algoritmo de Cruzamento de Dados O(N) com Hash Maps
  const creativesPerformanceList: CreativePerformance[] = useMemo(() => {
    // Passo 1 (Dicionário CRM): Hash Map O(N_leads)
    const crmMap = new Map<string, CrmAdAggregation>();

    for (let i = 0; i < filteredCrmLeads.length; i++) {
      const lead = filteredCrmLeads[i];
      const rawAdId = lead.ad_id ? String(lead.ad_id).trim() : '';
      const adIdKey = rawAdId.length > 0 ? rawAdId : 'ORGANICO';

      let agg = crmMap.get(adIdKey);
      if (!agg) {
        agg = {
          leads_generated: 0,
          agendamentos: 0,
          vendas: 0,
          revenue: 0,
          campaign_id: lead.campaign_id ? String(lead.campaign_id) : undefined,
          adset_id: lead.adset_id ? String(lead.adset_id) : undefined
        };
        crmMap.set(adIdKey, agg);
      }

      agg.leads_generated += 1;
      if ((lead.agendamento || '').trim().toLowerCase() === 'sim') {
        agg.agendamentos += 1;
      }
      if ((lead.venda || '').trim().toLowerCase() === 'sim') {
        agg.vendas += 1;
      }

      const valor = Number(lead.valor_conversao);
      if (!isNaN(valor) && valor > 0) {
        agg.revenue += valor;
      }

      if (!agg.campaign_id && lead.campaign_id) {
        agg.campaign_id = String(lead.campaign_id);
      }
      if (!agg.adset_id && lead.adset_id) {
        agg.adset_id = String(lead.adset_id);
      }
    }

    // Passo 2 (Mesclagem com Meta Ads): O(N_ads)
    const result: CreativePerformance[] = [];
    const visitedAdIds = new Set<string>();

    for (let j = 0; j < ads.length; j++) {
      const ad = ads[j];
      const adIdStr = String(ad.id).trim();
      visitedAdIds.add(adIdStr);

      const crmMetrics = crmMap.get(adIdStr) || {
        leads_generated: 0,
        agendamentos: 0,
        vendas: 0,
        revenue: 0
      };

      const spend = typeof ad.spend === 'number' ? ad.spend : (parseFloat(String(ad.spend || '0')) || 0);
      const revenue = crmMetrics.revenue;
      const lucro = revenue - spend;

      let roas = 0;
      if (spend > 0) {
        roas = revenue / spend;
      } else if (revenue > 0) {
        roas = 999; // Infinite ROAS (Receita com custo zero no período)
      }

      // Passo 3 (Matemática e Veredicto)
      let status: 'LUCRATIVO' | 'EMPATE' | 'PREJUIZO' | 'ORGANICO' = 'EMPATE';
      if (spend > 0 && revenue > spend) {
        status = 'LUCRATIVO';
      } else if (spend > 0 && revenue < spend) {
        status = 'PREJUIZO';
      } else if (spend > 0 && revenue === spend) {
        status = 'EMPATE';
      } else if (spend === 0 && revenue > 0) {
        status = 'ORGANICO';
      } else {
        status = 'EMPATE';
      }

      result.push({
        ad_id: adIdStr,
        ad_name: ad.name || `Anúncio ID ${adIdStr}`,
        campaign_id: ad.campaign_id || crmMetrics.campaign_id || '',
        campaign_name: ad.campaign_name || 'Campanha Meta',
        adset_id: ad.adset_id || crmMetrics.adset_id || '',
        adset_name: ad.adset_name || 'Conjunto de Anúncios',
        spend,
        leads_generated: crmMetrics.leads_generated,
        agendamentos: crmMetrics.agendamentos,
        vendas: crmMetrics.vendas,
        revenue,
        roas,
        lucro,
        status,
        thumbnail_url: ad.thumbnail_url
      });
    }

    // Passo 4 (Criativos do CRM não listados na Meta e Bucket Orgânico)
    crmMap.forEach((crmMetrics, key) => {
      if (!visitedAdIds.has(key)) {
        if (key === 'ORGANICO') {
          result.push({
            ad_id: 'ORGANICO',
            ad_name: 'Orgânico / Direto / Não Rastreado',
            campaign_id: '',
            campaign_name: 'Origem Direta / Não Identificada',
            adset_id: '',
            adset_name: '—',
            spend: 0,
            leads_generated: crmMetrics.leads_generated,
            agendamentos: crmMetrics.agendamentos,
            vendas: crmMetrics.vendas,
            revenue: crmMetrics.revenue,
            roas: 999,
            lucro: crmMetrics.revenue,
            status: 'ORGANICO'
          });
        } else {
          const revenue = crmMetrics.revenue;
          result.push({
            ad_id: key,
            ad_name: `Anúncio CRM ID ${key}`,
            campaign_id: crmMetrics.campaign_id || '',
            campaign_name: crmMetrics.campaign_id ? `Campanha ID ${crmMetrics.campaign_id}` : 'Campanha Meta (Histórica)',
            adset_id: crmMetrics.adset_id || '',
            adset_name: crmMetrics.adset_id ? `Conjunto ID ${crmMetrics.adset_id}` : '—',
            spend: 0,
            leads_generated: crmMetrics.leads_generated,
            agendamentos: crmMetrics.agendamentos,
            vendas: crmMetrics.vendas,
            revenue,
            roas: 999,
            lucro: revenue,
            status: revenue > 0 ? 'LUCRATIVO' : 'EMPATE'
          });
        }
      }
    });

    // Ordenação padrão: Maior Lucro Descendente
    return result.sort((a, b) => b.lucro - a.lucro);
  }, [filteredCrmLeads, ads]);

  // 3. Filtrar lista por Status e Busca
  const displayedCreatives = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    return creativesPerformanceList.filter((item) => {
      const matchesSearch = 
        !searchLower ||
        item.ad_name.toLowerCase().includes(searchLower) ||
        item.campaign_name.toLowerCase().includes(searchLower) ||
        item.ad_id.toLowerCase().includes(searchLower);

      const matchesStatus = 
        statusFilter === 'ALL' ||
        item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [creativesPerformanceList, search, statusFilter]);

  // 4. Métricas Globais dos KPIs em passada única O(N)
  const summaryMetrics: CreativesSummaryMetrics = useMemo(() => {
    let totalSpend = 0;
    let totalRevenue = 0;
    let totalLeads = 0;
    let totalVendas = 0;
    
    let champion: CreativePerformance | null = null;
    let maxChampionScore = -Infinity;

    for (let i = 0; i < creativesPerformanceList.length; i++) {
      const c = creativesPerformanceList[i];
      totalSpend += c.spend;
      totalRevenue += c.revenue;
      totalLeads += c.leads_generated;
      totalVendas += c.vendas;

      // Criativo Campeão: Maior volume de lucro e vendas
      const score = c.lucro + (c.vendas * 1000);
      if (c.ad_id !== 'ORGANICO' && score > maxChampionScore) {
        maxChampionScore = score;
        champion = c;
      }
    }

    const lucroLiquido = totalRevenue - totalSpend;
    const roasMedio = totalSpend > 0 
      ? totalRevenue / totalSpend 
      : (totalRevenue > 0 ? 999 : 0);

    return {
      totalSpend,
      totalRevenue,
      lucroLiquido,
      roasMedio,
      totalLeads,
      totalVendas,
      championCreative: champion ? {
        name: champion.ad_name,
        ad_id: champion.ad_id,
        lucro: champion.lucro,
        revenue: champion.revenue,
        vendas: champion.vendas
      } : null
    };
  }, [creativesPerformanceList]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleStatusFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Unit Economics de Mídia
            </span>
            <span className="text-xs text-zinc-400">Atribuição Meta Ads × Receita CRM</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Performance de Criativos & Lucratividade
          </h1>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={loading || parentLoading}
          className="inline-flex items-center gap-2 bg-brand-sidebar hover:bg-zinc-800 text-white font-semibold text-xs px-3.5 py-2 rounded-xl border border-brand-border shadow-md transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-brand-neon ${loading || parentLoading ? 'animate-spin' : ''}`} />
          <span>Atualizar Atribuição</span>
        </button>
      </div>

      {/* Operation KPI Cards Grid (4 Colunas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Investimento Total"
          mainValue={formatCurrency(summaryMetrics.totalSpend)}
          extraInfoLabel="Custo Meta Ads"
          extraInfoValue="Período Selecionado"
          showDollarIcon={true}
          isLoading={loading || parentLoading}
        />

        <MetricCard
          title="Receita Total (CRM)"
          mainValue={formatCurrency(summaryMetrics.totalRevenue)}
          extraInfoLabel="Vendas Contratadas"
          extraInfoValue={`${formatNumber(summaryMetrics.totalVendas)} vendas registradas`}
          showDollarIcon={true}
          isLoading={loading || parentLoading}
        />

        <MetricCard
          title="Lucro Líquido"
          mainValue={formatCurrency(summaryMetrics.lucroLiquido)}
          extraInfoLabel="ROAS Geral"
          extraInfoValue={summaryMetrics.roasMedio === 999 ? '∞' : formatMultiplier(summaryMetrics.roasMedio)}
          showDollarIcon={false}
          isLoading={loading || parentLoading}
        />

        <MetricCard
          title="Criativo Campeão"
          mainValue={summaryMetrics.championCreative ? formatCurrency(summaryMetrics.championCreative.lucro) : '—'}
          extraInfoLabel="Maior Lucratividade"
          extraInfoValue={summaryMetrics.championCreative ? summaryMetrics.championCreative.name : 'Nenhum'}
          showDollarIcon={false}
          isLoading={loading || parentLoading}
        />
      </div>

      {/* Controls: Omnibox Search Bar, Date Range Picker & Status Filter */}
      <div className="bg-brand-card p-4 rounded-2xl border border-brand-border shadow-lg flex flex-wrap items-center justify-between gap-4">
        {/* Search Bar Input */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar por nome do anúncio, campanha ou ID do criativo..."
            className="w-full bg-brand-sidebar border border-brand-border rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-colors"
          />
        </div>

        {/* Date Range Picker & Status Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker
            value={effectiveDateRange}
            onChange={handleDateRangeChange}
          />

          <div className="flex items-center gap-1.5 bg-brand-sidebar px-3 py-1.5 rounded-xl border border-brand-border text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-zinc-900 text-white">Todos</option>
              <option value="LUCRATIVO" className="bg-zinc-900 text-white">Lucrativos</option>
              <option value="PREJUIZO" className="bg-zinc-900 text-white">Prejuízo</option>
              <option value="EMPATE" className="bg-zinc-900 text-white">Empate</option>
              <option value="ORGANICO" className="bg-zinc-900 text-white">Orgânico / Direto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Attribution & Unit Economics Table */}
      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-brand-border flex items-center justify-between bg-brand-sidebar">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Ranking de Criativos ({displayedCreatives.length})
              </h3>
              <p className="text-xs text-brand-textMuted">
                Cruzamento de custo de mídia Meta Ads com receita real de contrato no CRM (Ordenado por Lucro)
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Container with Sticky Left Column */}
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
            <thead>
              <tr className="bg-brand-sidebar border-b border-brand-border font-bold text-brand-textMuted uppercase tracking-wider text-[11px]">
                {/* Col 1: Criativo / Ad ID (Sticky) */}
                <th className="py-3.5 px-4 sticky left-0 z-30 bg-brand-sidebar border-r border-brand-border min-w-[260px] shadow-md">
                  Criativo / Ad ID
                </th>
                {/* Col 2: Campanha / Conjunto */}
                <th className="py-3.5 px-4 min-w-[220px]">
                  Campanha / Conjunto
                </th>
                {/* Col 3: Leads Gerados */}
                <th className="py-3.5 px-4 text-center min-w-[120px]">
                  Leads (CRM)
                </th>
                {/* Col 4: Agendamentos */}
                <th className="py-3.5 px-4 text-center min-w-[130px]">
                  Agendamentos
                </th>
                {/* Col 5: Vendas */}
                <th className="py-3.5 px-4 text-center min-w-[120px]">
                  Vendas
                </th>
                {/* Col 6: Investimento (R$) */}
                <th className="py-3.5 px-4 text-right min-w-[150px]">
                  Investimento (R$)
                </th>
                {/* Col 7: Receita Gerada (R$) */}
                <th className="py-3.5 px-4 text-right min-w-[160px]">
                  Receita (R$)
                </th>
                {/* Col 8: ROAS */}
                <th className="py-3.5 px-4 text-center min-w-[120px]">
                  ROAS
                </th>
                {/* Col 9: Lucro Líquido (R$) */}
                <th className="py-3.5 px-4 text-right min-w-[160px]">
                  <div className="flex items-center justify-end gap-1 text-white">
                    <span>Lucro Líquido</span>
                    <ArrowUpDown className="w-3 h-3 text-brand-neon" />
                  </div>
                </th>
                {/* Col 10: Status / Veredicto */}
                <th className="py-3.5 px-4 text-center min-w-[160px]">
                  Status / Veredicto
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-brand-border/70 font-medium">
              {loading || parentLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="border-b border-brand-border/40">
                    <td className="p-4 sticky left-0 z-20 bg-brand-sidebar border-r border-brand-border"><div className="h-4 w-48 rounded skeleton-shimmer" /></td>
                    <td className="p-4"><div className="h-4 w-36 rounded skeleton-shimmer" /></td>
                    <td className="p-4 text-center"><div className="h-4 w-12 rounded skeleton-shimmer mx-auto" /></td>
                    <td className="p-4 text-center"><div className="h-4 w-12 rounded skeleton-shimmer mx-auto" /></td>
                    <td className="p-4 text-center"><div className="h-4 w-12 rounded skeleton-shimmer mx-auto" /></td>
                    <td className="p-4 text-right"><div className="h-4 w-20 rounded skeleton-shimmer ml-auto" /></td>
                    <td className="p-4 text-right"><div className="h-4 w-24 rounded skeleton-shimmer ml-auto" /></td>
                    <td className="p-4 text-center"><div className="h-4 w-16 rounded skeleton-shimmer mx-auto" /></td>
                    <td className="p-4 text-right"><div className="h-4 w-24 rounded skeleton-shimmer ml-auto" /></td>
                    <td className="p-4 text-center"><div className="h-6 w-28 rounded skeleton-shimmer mx-auto" /></td>
                  </tr>
                ))
              ) : displayedCreatives.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-zinc-500">
                    Nenhum criativo encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayedCreatives.map((item) => (
                  <tr
                    key={item.ad_id}
                    className="hover:bg-zinc-800/40 transition-colors group border-b border-brand-border/60"
                  >
                    {/* 1. Criativo / Ad ID (Sticky) */}
                    <td className="py-3.5 px-4 sticky left-0 z-20 bg-brand-card group-hover:bg-zinc-800 border-r border-brand-border min-w-[260px] font-bold text-white shadow-md">
                      <div className="flex items-center gap-3">
                        {item.thumbnail_url ? (
                          <img 
                            src={item.thumbnail_url} 
                            alt={item.ad_name} 
                            className="w-9 h-9 rounded-lg object-cover border border-brand-border shrink-0" 
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-brand-border flex items-center justify-center text-zinc-500 shrink-0">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-bold text-white max-w-[190px]" title={item.ad_name}>
                            {item.ad_name}
                          </div>
                          {item.ad_id === 'ORGANICO' ? (
                            <div className="font-mono text-[10px] text-zinc-500">
                              Origem Direta
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleCopyId(item.ad_id, e)}
                              title="Clique para copiar o ID"
                              className="group/copy flex items-center gap-1.5 font-mono text-[10px] text-zinc-400 hover:text-green-400 transition-colors duration-200 cursor-pointer text-left select-none"
                            >
                              <span>ID: {item.ad_id}</span>
                              {copiedAdId === item.ad_id ? (
                                <span className="inline-flex items-center gap-0.5 text-brand-neon font-sans text-[10px] font-bold animate-in fade-in">
                                  <Check className="w-3 h-3 text-brand-neon" />
                                  <span>Copiado!</span>
                                </span>
                              ) : (
                                <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 transition-opacity duration-200 text-zinc-400 group-hover/copy:text-green-400" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Campanha / Conjunto */}
                    <td className="py-3.5 px-4 text-zinc-300">
                      <div className="truncate max-w-[200px] font-semibold text-white" title={item.campaign_name}>
                        {item.campaign_name}
                      </div>
                      <div className="truncate max-w-[200px] text-[11px] text-zinc-400" title={item.adset_name}>
                        {item.adset_name}
                      </div>
                    </td>

                    {/* 3. Leads Gerados */}
                    <td className="py-3.5 px-4 text-center font-bold text-white">
                      {formatNumber(item.leads_generated)}
                    </td>

                    {/* 4. Agendamentos */}
                    <td className="py-3.5 px-4 text-center font-semibold text-zinc-200">
                      {formatNumber(item.agendamentos)}
                    </td>

                    {/* 5. Vendas */}
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-400">
                      {formatNumber(item.vendas)}
                    </td>

                    {/* 6. Investimento (R$) */}
                    <td className="py-3.5 px-4 text-right text-zinc-300 font-semibold">
                      {formatCurrency(item.spend)}
                    </td>

                    {/* 7. Receita Gerada (R$) */}
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      {formatCurrency(item.revenue)}
                    </td>

                    {/* 8. ROAS */}
                    <td className="py-3.5 px-4 text-center font-extrabold text-white text-xs">
                      {item.roas === 999 ? '∞' : (item.spend === 0 && item.revenue === 0 ? '—' : formatMultiplier(item.roas))}
                    </td>

                    {/* 9. Lucro Líquido (R$) */}
                    <td className={`py-3.5 px-4 text-right font-black text-sm ${item.lucro >= 0 ? 'text-brand-neon' : 'text-rose-400'}`}>
                      {formatCurrency(item.lucro)}
                    </td>

                    {/* 10. Status / Veredicto */}
                    <td className="py-3.5 px-4 text-center">
                      {renderStatusBadge(item.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

CreativesView.displayName = 'CreativesView';
