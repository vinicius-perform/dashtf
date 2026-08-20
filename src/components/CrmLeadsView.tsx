import React, { useState, useEffect, useMemo } from 'react';
import { CrmLead, CrmLeadSummary } from '../types/crm';
import { fetchCrmLeads, computeCrmLeadSummary } from '../services/crmLeadsService';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { MetricCard } from './MetricCard';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { getThisMonthRange, formatDateRangeLabel } from '../utils/timezone';
import { 
  Users, 
  Search, 
  RefreshCw, 
  CheckCircle2,
  XCircle,
  Phone,
  Clock
} from 'lucide-react';

interface CrmLeadsViewProps {
  isLoading?: boolean;
}

export const CrmLeadsView: React.FC<CrmLeadsViewProps> = ({ isLoading: parentLoading = false }) => {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [agendamentoFilter, setAgendamentoFilter] = useState<string>('ALL');
  const [vendaFilter, setVendaFilter] = useState<string>('ALL');

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const range = getThisMonthRange('America/Sao_Paulo');
    range.label = formatDateRangeLabel(range.startDate, range.endDate, 'America/Sao_Paulo');
    return range;
  });

  const loadData = async () => {
    setLoading(true);
    const data = await fetchCrmLeads();
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const searchLower = search.toLowerCase().trim();
      const matchesSearch = 
        !searchLower ||
        (lead.nome || '').toLowerCase().includes(searchLower) ||
        (lead.email || '').toLowerCase().includes(searchLower) ||
        (lead.telefone || '').toLowerCase().includes(searchLower) ||
        (lead.clinica || '').toLowerCase().includes(searchLower) ||
        (lead.sdr || '').toLowerCase().includes(searchLower) ||
        (lead.campaign_id || '').toLowerCase().includes(searchLower);

      const matchesAgendamento = agendamentoFilter === 'ALL' || lead.agendamento === agendamentoFilter;
      const matchesVenda = vendaFilter === 'ALL' || lead.venda === vendaFilter;

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

      return matchesSearch && matchesAgendamento && matchesVenda && matchesDate;
    });
  }, [leads, search, agendamentoFilter, vendaFilter, dateRange]);

  const summary: CrmLeadSummary = useMemo(() => {
    return computeCrmLeadSummary(filteredLeads);
  }, [filteredLeads]);

  const formatCrmDate = (isoStr?: string) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} às ${hours}:${minutes}`;
    } catch {
      return isoStr;
    }
  };

  const getStatusBadge = (val?: string) => {
    const isYes = (val || '').trim().toLowerCase() === 'sim';
    if (isYes) {
      return (
        <span className="inline-flex items-center gap-1.5 bg-brand-neon text-black font-bold px-2.5 py-0.5 rounded-full text-xs shadow-md shadow-brand-neon/20">
          <CheckCircle2 className="w-3.5 h-3.5 fill-black text-brand-neon" />
          <span>Sim</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 px-2.5 py-0.5 rounded-full text-xs font-medium">
        <XCircle className="w-3 h-3 text-zinc-500" />
        <span>Não</span>
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto animate-fadeIn">
      {/* Top Header & Overview Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Single Source of Truth
            </span>
            <span className="text-xs text-zinc-400">Atribuição CRM Real-time</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Gestão de Leads & Conversões
          </h1>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-brand-sidebar hover:bg-zinc-800 text-white font-semibold text-xs px-3.5 py-2 rounded-xl border border-brand-border shadow-md transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-brand-neon ${loading ? 'animate-spin' : ''}`} />
          <span>Sincronizar Planilha</span>
        </button>
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Leads Ingeridos"
          mainValue={formatNumber(summary.totalLeads)}
          extraInfoLabel="Base Consolidada"
          extraInfoValue="Google Sheets"
          showDollarIcon={false}
          isLoading={loading}
        />

        <MetricCard
          title="Agendamentos Realizados"
          mainValue={formatNumber(summary.totalAgendamentos)}
          extraInfoLabel="Taxa de Agendamento"
          extraInfoValue={formatPercent(summary.taxaAgendamentoPct)}
          showDollarIcon={false}
          isLoading={loading}
        />

        <MetricCard
          title="Vendas Concluídas"
          mainValue={formatNumber(summary.totalVendas)}
          extraInfoLabel="Conversão Agendados"
          extraInfoValue={formatPercent(summary.taxaConversaoVendasPct)}
          showDollarIcon={false}
          isLoading={loading}
        />

        <MetricCard
          title="Faturamento Total"
          mainValue={formatCurrency(summary.faturamentoTotal)}
          extraInfoLabel="Ticket Médio"
          extraInfoValue={formatCurrency(summary.ticketMedio)}
          showDollarIcon={true}
          isLoading={loading}
        />
      </div>

      {/* Controls & Search Bar */}
      <div className="bg-brand-card p-4 rounded-2xl border border-brand-border shadow-lg flex flex-wrap items-center justify-between gap-4">
        {/* Real-time Search Input */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, telefone, clínica, SDR ou ID da campanha..."
            className="w-full bg-brand-sidebar border border-brand-border rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-colors"
          />
        </div>

        {/* Filter Dropdowns & Date Range Picker */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Picker Component */}
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />

          {/* Agendamento Filter */}
          <div className="flex items-center gap-1.5 bg-brand-sidebar px-3 py-1.5 rounded-xl border border-brand-border text-xs">
            <span className="text-zinc-400 font-medium">Agendado:</span>
            <select
              value={agendamentoFilter}
              onChange={(e) => setAgendamentoFilter(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-zinc-900 text-white">Todos</option>
              <option value="Sim" className="bg-zinc-900 text-white">Sim</option>
              <option value="Não" className="bg-zinc-900 text-white">Não</option>
            </select>
          </div>

          {/* Venda Filter */}
          <div className="flex items-center gap-1.5 bg-brand-sidebar px-3 py-1.5 rounded-xl border border-brand-border text-xs">
            <span className="text-zinc-400 font-medium">Venda:</span>
            <select
              value={vendaFilter}
              onChange={(e) => setVendaFilter(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-zinc-900 text-white">Todas</option>
              <option value="Sim" className="bg-zinc-900 text-white">Sim</option>
              <option value="Não" className="bg-zinc-900 text-white">Não</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main CRM Data Table - Exactly 9 Required Columns */}
      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-brand-border flex items-center justify-between bg-brand-sidebar">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Base de Leads ({filteredLeads.length})
              </h3>
              <p className="text-xs text-brand-textMuted">
                Atribuição direta entre leads, identificadores Meta Ads e conversão comercial
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Container with Sticky Left Columns */}
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
            <thead>
              <tr className="bg-brand-sidebar border-b border-brand-border font-bold text-brand-textMuted uppercase tracking-wider text-[11px]">
                {/* Col 1: Data / Hora (Sticky) */}
                <th className="py-3.5 px-4 sticky left-0 z-30 bg-brand-sidebar border-r border-brand-border min-w-[170px] shadow-md">
                  Data / Hora
                </th>
                {/* Col 2: Nome do Lead (Sticky) */}
                <th className="py-3.5 px-4 sticky left-[170px] z-30 bg-brand-sidebar border-r border-brand-border min-w-[220px] shadow-md">
                  Nome do Lead
                </th>
                {/* Col 3: Telefone */}
                <th className="py-3.5 px-4 min-w-[150px]">
                  Telefone
                </th>
                {/* Col 4: Campanha Meta ID */}
                <th className="py-3.5 px-4 min-w-[180px]">
                  Campanha Meta ID
                </th>
                {/* Col 5: Conjunto Meta ID */}
                <th className="py-3.5 px-4 min-w-[180px]">
                  Conjunto Meta ID
                </th>
                {/* Col 6: Anúncio Meta ID */}
                <th className="py-3.5 px-4 min-w-[180px]">
                  Anúncio Meta ID
                </th>
                {/* Col 7: Agendamento */}
                <th className="py-3.5 px-4 text-center min-w-[130px]">
                  Agendamento
                </th>
                {/* Col 8: Venda */}
                <th className="py-3.5 px-4 text-center min-w-[130px]">
                  Venda
                </th>
                {/* Col 9: Valor Conversão */}
                <th className="py-3.5 px-4 text-right min-w-[160px]">
                  Valor Conversão
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-brand-border/70 font-medium">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="border-b border-brand-border/40">
                    <td className="p-4 sticky left-0 z-20 bg-brand-sidebar border-r border-brand-border"><div className="h-4 w-32 rounded skeleton-shimmer" /></td>
                    <td className="p-4 sticky left-[170px] z-20 bg-brand-sidebar border-r border-brand-border"><div className="h-4 w-40 rounded skeleton-shimmer" /></td>
                    <td className="p-4"><div className="h-4 w-28 rounded skeleton-shimmer" /></td>
                    <td className="p-4"><div className="h-4 w-32 rounded skeleton-shimmer" /></td>
                    <td className="p-4"><div className="h-4 w-32 rounded skeleton-shimmer" /></td>
                    <td className="p-4"><div className="h-4 w-32 rounded skeleton-shimmer" /></td>
                    <td className="p-4 text-center"><div className="h-6 w-16 rounded skeleton-shimmer mx-auto" /></td>
                    <td className="p-4 text-center"><div className="h-6 w-16 rounded skeleton-shimmer mx-auto" /></td>
                    <td className="p-4 text-right"><div className="h-4 w-24 rounded skeleton-shimmer ml-auto" /></td>
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-zinc-500">
                    Nenhum lead encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-zinc-800/40 transition-colors group border-b border-brand-border/60"
                  >
                    {/* 1. Data / Hora (Sticky) */}
                    <td className="py-3.5 px-4 sticky left-0 z-20 bg-brand-card group-hover:bg-zinc-800 border-r border-brand-border min-w-[170px] text-zinc-300 shadow-md">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span>{formatCrmDate(lead.data_hora)}</span>
                      </div>
                    </td>

                    {/* 2. Nome do Lead (Sticky) */}
                    <td className="py-3.5 px-4 sticky left-[170px] z-20 bg-brand-card group-hover:bg-zinc-800 border-r border-brand-border min-w-[220px] font-bold text-white shadow-md">
                      <div className="truncate max-w-[200px]" title={lead.nome}>
                        {lead.nome}
                      </div>
                    </td>

                    {/* 3. Telefone */}
                    <td className="py-3.5 px-4 text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span>{lead.telefone || '—'}</span>
                      </div>
                    </td>

                    {/* 4. Campanha Meta ID */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-blue-400">
                      {lead.campaign_id || '—'}
                    </td>

                    {/* 5. Conjunto Meta ID */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                      {lead.adset_id || '—'}
                    </td>

                    {/* 6. Anúncio Meta ID */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                      {lead.ad_id || '—'}
                    </td>

                    {/* 7. Agendamento */}
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(lead.agendamento)}
                    </td>

                    {/* 8. Venda */}
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(lead.venda)}
                    </td>

                    {/* 9. Valor Conversão */}
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      {lead.valor_conversao ? formatCurrency(lead.valor_conversao) : '—'}
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
