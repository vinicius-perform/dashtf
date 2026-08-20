import React, { useState, useEffect, useMemo } from 'react';
import { CrmLead } from '../types/crm';
import { fetchCrmLeads } from '../services/crmLeadsService';
import { MetaAd, MetaCampaign, MetaAdSet } from '../types/meta';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { MetricCard } from './MetricCard';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { getThisMonthRange, formatDateRangeLabel } from '../utils/timezone';
import { 
  Layers, 
  Search, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  Trophy, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Filter,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

export interface CreativePerformance {
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  campaign_name: string;
  adset_id: string;
  adset_name: string;
  thumbnail_url?: string;
  leadsCount: number;
  agendamentosCount: number;
  vendasCount: number;
  investimento: number;
  receitaGerada: number;
  roas: number;
  lucroLiquido: number;
  veredicto: 'LUCRATIVO' | 'NEUTRO' | 'PREJUIZO';
}

interface CreativesViewProps {
  ads?: MetaAd[];
  campaigns?: MetaCampaign[];
  adsets?: MetaAdSet[];
  isLoading?: boolean;
}

export const CreativesView: React.FC<CreativesViewProps> = ({ 
  ads = [], 
  campaigns = [], 
  adsets = [], 
  isLoading: parentLoading = false 
}) => {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const range = getThisMonthRange('America/Sao_Paulo');
    range.label = formatDateRangeLabel(range.startDate, range.endDate, 'America/Sao_Paulo');
    return range;
  });

  const loadData = async () => {
    setLoading(true);
    const crmData = await fetchCrmLeads();
    setLeads(crmData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Filter raw CRM leads by date range and search text
  const filteredCrmLeads = useMemo(() => {
    return leads.filter((lead) => {
      const searchLower = search.toLowerCase().trim();
      const matchesSearch = 
        !searchLower ||
        (lead.nome || '').toLowerCase().includes(searchLower) ||
        (lead.email || '').toLowerCase().includes(searchLower) ||
        (lead.telefone || '').toLowerCase().includes(searchLower) ||
        (lead.clinica || '').toLowerCase().includes(searchLower) ||
        (lead.sdr || '').toLowerCase().includes(searchLower) ||
        (lead.ad_id || '').toLowerCase().includes(searchLower) ||
        (lead.campaign_id || '').toLowerCase().includes(searchLower);

      let matchesDate = true;
      if (dateRange.startDate && dateRange.endDate) {
        const rawDate = lead.data_hora || lead.created_at;
        if (rawDate) {
          const leadTime = new Date(rawDate).getTime();
          const startMs = new Date(`${dateRange.startDate}T00:00:00`).getTime();
          const endMs = new Date(`${dateRange.endDate}T23:59:59.999`).getTime();
          matchesDate = !isNaN(leadTime) && leadTime >= startMs && leadTime <= endMs;
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [leads, search, dateRange]);

  // 2. Aggregate CRM leads and Meta Ads spend per Creative (ad_id)
  const creativesPerformanceList: CreativePerformance[] = useMemo(() => {
    // Map ad_id -> CRM metrics
    const crmMap = new Map<string, {
      leadsCount: number;
      agendamentosCount: number;
      vendasCount: number;
      receitaGerada: number;
      campaign_id?: string;
      adset_id?: string;
    }>();

    filteredCrmLeads.forEach((lead) => {
      const adIdKey = (lead.ad_id || 'unattributed').trim();
      if (!crmMap.has(adIdKey)) {
        crmMap.set(adIdKey, {
          leadsCount: 0,
          agendamentosCount: 0,
          vendasCount: 0,
          receitaGerada: 0,
          campaign_id: lead.campaign_id,
          adset_id: lead.adset_id
        });
      }
      const item = crmMap.get(adIdKey)!;
      item.leadsCount += 1;
      if ((lead.agendamento || '').toLowerCase() === 'sim') item.agendamentosCount += 1;
      if ((lead.venda || '').toLowerCase() === 'sim') item.vendasCount += 1;
      item.receitaGerada += Number(lead.valor_conversao) || 0;
      if (!item.campaign_id && lead.campaign_id) item.campaign_id = lead.campaign_id;
      if (!item.adset_id && lead.adset_id) item.adset_id = lead.adset_id;
    });

    // Collect all unique ad_ids from both ads engine and CRM leads
    const allAdIds = new Set<string>();
    ads.forEach((ad) => allAdIds.add(ad.id));
    crmMap.forEach((_, key) => {
      if (key !== 'unattributed') allAdIds.add(key);
    });

    const result: CreativePerformance[] = [];

    // Helper map for ads lookups
    const adsMap = new Map<string, MetaAd>();
    ads.forEach((ad) => adsMap.set(ad.id, ad));

    allAdIds.forEach((adId) => {
      const metaAd = adsMap.get(adId);
      const crmData = crmMap.get(adId) || {
        leadsCount: 0,
        agendamentosCount: 0,
        vendasCount: 0,
        receitaGerada: 0
      };

      // Spend from Meta Ads engine
      const investimento = metaAd?.spend || 0;
      const receitaGerada = crmData.receitaGerada;
      const lucroLiquido = receitaGerada - investimento;

      let roas = 0;
      if (investimento > 0) {
        roas = receitaGerada / investimento;
      } else if (receitaGerada > 0) {
        roas = 999; // Infinite ROAS
      }

      // Determine verdict status
      let veredicto: 'LUCRATIVO' | 'NEUTRO' | 'PREJUIZO' = 'NEUTRO';
      if (receitaGerada > investimento && receitaGerada > 0) {
        veredicto = 'LUCRATIVO';
      } else if (investimento > 0 && receitaGerada < investimento) {
        veredicto = 'PREJUIZO';
      } else if (receitaGerada === investimento && receitaGerada > 0) {
        veredicto = 'NEUTRO';
      }

      // Ad details fallback
      const ad_name = metaAd?.name || `Anúncio ID ${adId}`;
      const campaign_name = metaAd?.campaign_name || (crmData.campaign_id ? `Campanha ID ${crmData.campaign_id}` : '—');
      const adset_name = metaAd?.adset_name || (crmData.adset_id ? `Conjunto ID ${crmData.adset_id}` : '—');
      const campaign_id = metaAd?.campaign_id || crmData.campaign_id || '';
      const adset_id = metaAd?.adset_id || crmData.adset_id || '';

      result.push({
        ad_id: adId,
        ad_name,
        campaign_id,
        campaign_name,
        adset_id,
        adset_name,
        thumbnail_url: metaAd?.thumbnail_url,
        leadsCount: crmData.leadsCount,
        agendamentosCount: crmData.agendamentosCount,
        vendasCount: crmData.vendasCount,
        investimento,
        receitaGerada,
        roas,
        lucroLiquido,
        veredicto
      });
    });

    // Include unattributed CRM leads if any
    if (crmMap.has('unattributed')) {
      const crmData = crmMap.get('unattributed')!;
      result.push({
        ad_id: 'unattributed',
        ad_name: 'Leads Sem Anúncio Mapeado',
        campaign_id: '',
        campaign_name: 'Origem Direta / Não Identificada',
        adset_id: '',
        adset_name: '—',
        leadsCount: crmData.leadsCount,
        agendamentosCount: crmData.agendamentosCount,
        vendasCount: crmData.vendasCount,
        investimento: 0,
        receitaGerada: crmData.receitaGerada,
        roas: 999,
        lucroLiquido: crmData.receitaGerada,
        veredicto: 'LUCRATIVO'
      });
    }

    // Sort by Receita Gerada DESC
    return result.sort((a, b) => b.receitaGerada - a.receitaGerada);
  }, [filteredCrmLeads, ads]);

  // 3. Filtered performance list based on Status dropdown & search text
  const displayedCreatives = useMemo(() => {
    return creativesPerformanceList.filter((item) => {
      const matchesSearch = 
        !search.trim() ||
        item.ad_name.toLowerCase().includes(search.toLowerCase()) ||
        item.campaign_name.toLowerCase().includes(search.toLowerCase()) ||
        item.ad_id.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = 
        statusFilter === 'ALL' ||
        item.veredicto === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [creativesPerformanceList, search, statusFilter]);

  // 4. Operation Summary Metrics (KPI Cards)
  const summaryMetrics = useMemo(() => {
    const totalInvestido = creativesPerformanceList.reduce((acc, c) => acc + c.investimento, 0);
    const totalFaturamento = creativesPerformanceList.reduce((acc, c) => acc + c.receitaGerada, 0);
    const roasGlobal = totalInvestido > 0 ? totalFaturamento / totalInvestido : (totalFaturamento > 0 ? 999 : 0);

    // Champion Creative (Highest Revenue)
    const champion = creativesPerformanceList.length > 0 ? creativesPerformanceList[0] : null;

    return {
      totalInvestido,
      totalFaturamento,
      roasGlobal,
      championName: champion ? champion.ad_name : 'Nenhum',
      championReceita: champion ? champion.receitaGerada : 0
    };
  }, [creativesPerformanceList]);

  const getVerdictBadge = (veredicto: 'LUCRATIVO' | 'NEUTRO' | 'PREJUIZO', roas: number) => {
    if (veredicto === 'LUCRATIVO') {
      return (
        <span className="inline-flex items-center gap-1.5 bg-brand-neon text-black font-bold px-2.5 py-0.5 rounded-full text-xs shadow-md shadow-brand-neon/20">
          <Sparkles className="w-3.5 h-3.5 fill-black text-brand-neon" />
          <span>Lucrativo</span>
        </span>
      );
    }
    if (veredicto === 'PREJUIZO') {
      return (
        <span className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Prejuízo / Escalar c/ Cuidado</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">
        <span>Empatado / Neutro</span>
      </span>
    );
  };

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
          onClick={loadData}
          disabled={loading || parentLoading}
          className="inline-flex items-center gap-2 bg-brand-sidebar hover:bg-zinc-800 text-white font-semibold text-xs px-3.5 py-2 rounded-xl border border-brand-border shadow-md transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-brand-neon ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Atribuição</span>
        </button>
      </div>

      {/* Operation KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Investido em Anúncios"
          mainValue={formatCurrency(summaryMetrics.totalInvestido)}
          extraInfoLabel="Mídia Meta Ads"
          extraInfoValue="Período Selecionado"
          showDollarIcon={true}
          isLoading={loading || parentLoading}
        />

        <MetricCard
          title="Faturamento Atribuído a Criativos"
          mainValue={formatCurrency(summaryMetrics.totalFaturamento)}
          extraInfoLabel="Contratos CRM"
          extraInfoValue="Vendas Atribuídas"
          showDollarIcon={true}
          isLoading={loading || parentLoading}
        />

        <MetricCard
          title="ROAS Global de Criativos"
          mainValue={summaryMetrics.roasGlobal === 999 ? '∞' : `${summaryMetrics.roasGlobal.toFixed(2)}x`}
          extraInfoLabel="Retorno s/ Investimento"
          extraInfoValue={summaryMetrics.totalFaturamento >= summaryMetrics.totalInvestido ? 'Operação Lucrativa' : 'Abaixo do Breakeven'}
          showDollarIcon={false}
          isLoading={loading || parentLoading}
        />

        <MetricCard
          title="Criativo Campeão (Mais Lucrativo)"
          mainValue={formatCurrency(summaryMetrics.championReceita)}
          extraInfoLabel="Campeão"
          extraInfoValue={summaryMetrics.championName}
          showDollarIcon={false}
          isLoading={loading || parentLoading}
        />
      </div>

      {/* Controls: Search Bar, Date Range Picker & Verdict Filter */}
      <div className="bg-brand-card p-4 rounded-2xl border border-brand-border shadow-lg flex flex-wrap items-center justify-between gap-4">
        {/* Search Bar Input */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome do anúncio, campanha ou ID do criativo..."
            className="w-full bg-brand-sidebar border border-brand-border rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-colors"
          />
        </div>

        {/* Date Range Picker & Status Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />

          <div className="flex items-center gap-1.5 bg-brand-sidebar px-3 py-1.5 rounded-xl border border-brand-border text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400 font-medium">Veredito:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-zinc-900 text-white">Todos</option>
              <option value="LUCRATIVO" className="bg-zinc-900 text-white">Lucrativos</option>
              <option value="NEUTRO" className="bg-zinc-900 text-white">Empatados / Neutros</option>
              <option value="PREJUIZO" className="bg-zinc-900 text-white">Prejuízo</option>
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
                Cruzamento de custo de mídia Meta Ads com receita real de contrato no CRM
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
                  Leads
                </th>
                {/* Col 4: Agendamentos */}
                <th className="py-3.5 px-4 text-center min-w-[130px]">
                  Agendamentos
                </th>
                {/* Col 5: Vendas Concluídas */}
                <th className="py-3.5 px-4 text-center min-w-[130px]">
                  Vendas Concluídas
                </th>
                {/* Col 6: Investimento (R$) */}
                <th className="py-3.5 px-4 text-right min-w-[150px]">
                  Investimento (R$)
                </th>
                {/* Col 7: Receita Gerada (R$) */}
                <th className="py-3.5 px-4 text-right min-w-[160px]">
                  Receita Gerada (R$)
                </th>
                {/* Col 8: ROAS do Criativo */}
                <th className="py-3.5 px-4 text-center min-w-[130px]">
                  ROAS Criativo
                </th>
                {/* Col 9: Status / Veredito */}
                <th className="py-3.5 px-4 text-center min-w-[180px]">
                  Status / Veredito
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
                    <td className="p-4 text-center"><div className="h-6 w-28 rounded skeleton-shimmer mx-auto" /></td>
                  </tr>
                ))
              ) : displayedCreatives.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-zinc-500">
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
                          <div className="font-mono text-[10px] text-zinc-400">
                            ID: {item.ad_id}
                          </div>
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
                      {formatNumber(item.leadsCount)}
                    </td>

                    {/* 4. Agendamentos */}
                    <td className="py-3.5 px-4 text-center font-semibold text-zinc-200">
                      {formatNumber(item.agendamentosCount)}
                    </td>

                    {/* 5. Vendas Concluídas */}
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-400">
                      {formatNumber(item.vendasCount)}
                    </td>

                    {/* 6. Investimento (R$) */}
                    <td className="py-3.5 px-4 text-right text-zinc-300 font-semibold">
                      {formatCurrency(item.investimento)}
                    </td>

                    {/* 7. Receita Gerada (R$) */}
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400 text-sm">
                      {formatCurrency(item.receitaGerada)}
                    </td>

                    {/* 8. ROAS do Criativo */}
                    <td className="py-3.5 px-4 text-center font-extrabold text-white text-xs">
                      {item.roas === 999 ? '∞' : `${item.roas.toFixed(2)}x`}
                    </td>

                    {/* 9. Status / Veredito */}
                    <td className="py-3.5 px-4 text-center">
                      {getVerdictBadge(item.veredicto, item.roas)}
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
};
