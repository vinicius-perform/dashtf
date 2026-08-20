import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CrmLead, CrmLeadSummary } from '../types/crm';
import { fetchCrmLeads, computeCrmLeadSummary, createManualCrmLead } from '../services/crmLeadsService';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { MetricCard } from './MetricCard';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { getThisMonthRange, formatDateRangeLabel } from '../utils/timezone';
import { AddLeadModal } from './AddLeadModal';
import { 
  Users, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Calendar,
  Plus,
  Database
} from 'lucide-react';

interface CrmLeadsViewProps {
  isLoading?: boolean;
}

// 1. Dados do Seed Histórico (Apenas data YYYY-MM-DD)
const historicalSeedData = [
  { data_hora: "2026-07-14", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Sim", valor_conversao: 4248.00 },
  { data_hora: "2026-07-16", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-07-17", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-07-18", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-07-18", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-07-21", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Sim", valor_conversao: 6500.00 },
  { data_hora: "2026-07-21", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Sim", valor_conversao: 4500.00 },
  { data_hora: "2026-07-22", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-07-24", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-07-26", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-07-27", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Sim", valor_conversao: 5000.00 },
  { data_hora: "2026-07-27", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-07-28", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Sim", valor_conversao: 7500.00 },
  { data_hora: "2026-07-31", campaign_id: "120251244489170597", ad_id: "120251244489190597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-08-01", campaign_id: "120251244489170597", ad_id: "120251244489190597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-08-02", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-08-03", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-08-03", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-08-03", campaign_id: "120251244489170597", ad_id: "120251244489190597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-08-05", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Sim", venda: "Sim", valor_conversao: 5000.00 },
  { data_hora: "2026-08-05", campaign_id: "120251244489170597", ad_id: "120251244489190597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-08-07", campaign_id: "120251415522530597", ad_id: "120251415591680597", agendamento: "Sim", venda: "Sim", valor_conversao: 4000.00 },
  { data_hora: "2026-08-10", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-08-11", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-08-12", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
  { data_hora: "2026-08-16", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Sim", venda: "Não", valor_conversao: 0 }
];

// 4. Formatação de Data Simples (Apenas DD/MM/YYYY)
const formatCrmDate = (isoStr?: string): string => {
  if (!isoStr) return '—';
  try {
    const datePart = isoStr.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [year, month, day] = datePart.split('-');
      return `${day}/${month}/${year}`;
    }
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoStr;
  }
};

const renderCrmStatusBadge = (val?: string) => {
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

export const CrmLeadsView: React.FC<CrmLeadsViewProps> = React.memo(({ isLoading: parentLoading = false }) => {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [agendamentoFilter, setAgendamentoFilter] = useState<string>('ALL');
  const [vendaFilter, setVendaFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const range = getThisMonthRange('America/Sao_Paulo');
    range.label = formatDateRangeLabel(range.startDate, range.endDate, 'America/Sao_Paulo');
    return range;
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCrmLeads();
      setLeads(data);
    } catch (err) {
      console.error('Erro ao carregar dados do CRM:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Lógica de Execução do Seed
  const runSeed = useCallback(async () => {
    setIsSeeding(true);
    try {
      for (let i = 0; i < historicalSeedData.length; i++) {
        const item = historicalSeedData[i];
        const dateIso = `${item.data_hora}T12:00:00.000Z`;
        await createManualCrmLead({
          data_hora: dateIso,
          nome: 'Lead Importado',
          telefone: '',
          campaign_id: item.campaign_id,
          ad_id: item.ad_id,
          agendamento: item.agendamento,
          venda: item.venda,
          valor_conversao: item.valor_conversao
        });
      }
      await loadData();
    } catch (err) {
      console.error('Erro ao executar seed histórico:', err);
    } finally {
      setIsSeeding(false);
    }
  }, [loadData]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleAgendamentoFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setAgendamentoFilter(e.target.value);
  }, []);

  const handleVendaFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setVendaFilter(e.target.value);
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  const filteredLeads = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    const hasSearch = searchLower.length > 0;
    const hasAgendamentoFilter = agendamentoFilter !== 'ALL';
    const hasVendaFilter = vendaFilter !== 'ALL';

    let startMs = 0;
    let endMs = Infinity;
    const hasDateRange = Boolean(dateRange.startDate && dateRange.endDate);

    if (hasDateRange) {
      startMs = new Date(`${dateRange.startDate}T00:00:00`).getTime();
      endMs = new Date(`${dateRange.endDate}T23:59:59.999`).getTime();
    }

    return leads.filter((lead) => {
      if (hasSearch) {
        const matchesSearch = 
          (lead.nome || '').toLowerCase().includes(searchLower) ||
          (lead.email || '').toLowerCase().includes(searchLower) ||
          (lead.telefone || '').toLowerCase().includes(searchLower) ||
          (lead.clinica || '').toLowerCase().includes(searchLower) ||
          (lead.sdr || '').toLowerCase().includes(searchLower) ||
          (lead.campaign_id || '').toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      if (hasAgendamentoFilter && lead.agendamento !== agendamentoFilter) {
        return false;
      }

      if (hasVendaFilter && lead.venda !== vendaFilter) {
        return false;
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
  }, [leads, search, agendamentoFilter, vendaFilter, dateRange.startDate, dateRange.endDate]);

  const summary: CrmLeadSummary = useMemo(() => {
    return computeCrmLeadSummary(filteredLeads);
  }, [filteredLeads]);

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

        <div className="flex items-center gap-3">
          <button
            onClick={runSeed}
            disabled={isSeeding || loading || parentLoading}
            className="inline-flex items-center gap-2 bg-zinc-800/90 hover:bg-zinc-700 text-brand-neon font-bold text-xs px-3.5 py-2 rounded-xl border border-brand-neon/30 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            title="Importar carga histórica de 26 leads"
          >
            {isSeeding ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-brand-neon" />
                <span>Importando Seed...</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4 text-brand-neon" />
                <span>Executar Seed</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-brand-neon hover:bg-brand-neonHover text-black font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-brand-neon/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Lead</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading || parentLoading || isSeeding}
            className="inline-flex items-center gap-2 bg-brand-sidebar hover:bg-zinc-800 text-white font-semibold text-xs px-3.5 py-2 rounded-xl border border-brand-border shadow-md transition-all disabled:opacity-50"
            title="Atualizar lista de leads"
          >
            <RefreshCw className={`w-4 h-4 text-brand-neon ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Leads Ingeridos"
          mainValue={formatNumber(summary.totalLeads)}
          extraInfoLabel="Base Consolidada"
          extraInfoValue="CRM Postgres"
          showDollarIcon={false}
          isLoading={loading || parentLoading}
        />

        <MetricCard
          title="Agendamentos Realizados"
          mainValue={formatNumber(summary.totalAgendamentos)}
          extraInfoLabel="Taxa de Agendamento"
          extraInfoValue={formatPercent(summary.taxaAgendamentoPct)}
          showDollarIcon={false}
          isLoading={loading || parentLoading}
        />

        <MetricCard
          title="Vendas Concluídas"
          mainValue={formatNumber(summary.totalVendas)}
          extraInfoLabel="Conversão Agendados"
          extraInfoValue={formatPercent(summary.taxaConversaoVendasPct)}
          showDollarIcon={false}
          isLoading={loading || parentLoading}
        />

        <MetricCard
          title="Faturamento Total"
          mainValue={formatCurrency(summary.faturamentoTotal)}
          extraInfoLabel="Ticket Médio"
          extraInfoValue={formatCurrency(summary.ticketMedio)}
          showDollarIcon={true}
          isLoading={loading || parentLoading}
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
            onChange={handleSearchChange}
            placeholder="Buscar por nome, e-mail, telefone, clínica, SDR ou ID da campanha..."
            className="w-full bg-brand-sidebar border border-brand-border rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-colors"
          />
        </div>

        {/* Filter Dropdowns & Action Button */}
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
          />

          {/* Agendamento Filter */}
          <div className="flex items-center gap-1.5 bg-brand-sidebar px-3 py-1.5 rounded-xl border border-brand-border text-xs">
            <span className="text-zinc-400 font-medium">Agendado:</span>
            <select
              value={agendamentoFilter}
              onChange={handleAgendamentoFilterChange}
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
              onChange={handleVendaFilterChange}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-zinc-900 text-white">Todas</option>
              <option value="Sim" className="bg-zinc-900 text-white">Sim</option>
              <option value="Não" className="bg-zinc-900 text-white">Não</option>
            </select>
          </div>

          {/* Prominent Action Button in Toolbar */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-brand-neon hover:bg-brand-neonHover text-black font-bold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-brand-neon/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Lead</span>
          </button>
        </div>
      </div>

      {/* Modal de Cadastro Manual de Leads */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLeadCreated={loadData}
      />

      {/* Main CRM Data Table - Exactly 7 Required Columns */}
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
                {/* Col 1: Data (Sticky) */}
                <th className="py-3.5 px-4 sticky left-0 z-30 bg-brand-sidebar border-r border-brand-border min-w-[130px] shadow-md">
                  Data
                </th>
                {/* Col 2: Nome do Lead (Sticky) */}
                <th className="py-3.5 px-4 sticky left-[130px] z-30 bg-brand-sidebar border-r border-brand-border min-w-[220px] shadow-md">
                  Nome do Lead
                </th>
                {/* Col 3: Campanha Meta ID */}
                <th className="py-3.5 px-4 min-w-[200px]">
                  Campanha Meta ID
                </th>
                {/* Col 4: Anúncio Meta ID */}
                <th className="py-3.5 px-4 min-w-[200px]">
                  Anúncio Meta ID
                </th>
                {/* Col 5: Agendamento */}
                <th className="py-3.5 px-4 text-center min-w-[130px]">
                  Agendamento
                </th>
                {/* Col 6: Venda */}
                <th className="py-3.5 px-4 text-center min-w-[130px]">
                  Venda
                </th>
                {/* Col 7: Valor Conversão */}
                <th className="py-3.5 px-4 text-right min-w-[160px]">
                  Valor Conversão
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-brand-border/70 font-medium">
              {loading || parentLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="border-b border-brand-border/40">
                    <td className="p-4 sticky left-0 z-20 bg-brand-sidebar border-r border-brand-border"><div className="h-4 w-24 rounded skeleton-shimmer" /></td>
                    <td className="p-4 sticky left-[130px] z-20 bg-brand-sidebar border-r border-brand-border"><div className="h-4 w-36 rounded skeleton-shimmer" /></td>
                    <td className="p-4"><div className="h-4 w-36 rounded skeleton-shimmer" /></td>
                    <td className="p-4"><div className="h-4 w-36 rounded skeleton-shimmer" /></td>
                    <td className="p-4 text-center"><div className="h-6 w-16 rounded skeleton-shimmer mx-auto" /></td>
                    <td className="p-4 text-center"><div className="h-6 w-16 rounded skeleton-shimmer mx-auto" /></td>
                    <td className="p-4 text-right"><div className="h-4 w-24 rounded skeleton-shimmer ml-auto" /></td>
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-500">
                    Nenhum lead encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-zinc-800/40 transition-colors group border-b border-brand-border/60"
                  >
                    {/* 1. Data (Sticky) */}
                    <td className="py-3.5 px-4 sticky left-0 z-20 bg-brand-card group-hover:bg-zinc-800 border-r border-brand-border min-w-[130px] font-mono text-zinc-300 shadow-md">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>{formatCrmDate(lead.data_hora)}</span>
                      </div>
                    </td>

                    {/* 2. Nome do Lead (Sticky) */}
                    <td className="py-3.5 px-4 sticky left-[130px] z-20 bg-brand-card group-hover:bg-zinc-800 border-r border-brand-border min-w-[220px] font-bold text-white shadow-md">
                      <div className="truncate max-w-[200px]" title={lead.nome}>
                        {lead.nome}
                      </div>
                    </td>

                    {/* 3. Campanha Meta ID */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-blue-400">
                      {lead.campaign_id || '—'}
                    </td>

                    {/* 4. Anúncio Meta ID */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                      {lead.ad_id || '—'}
                    </td>

                    {/* 5. Agendamento */}
                    <td className="py-3.5 px-4 text-center">
                      {renderCrmStatusBadge(lead.agendamento)}
                    </td>

                    {/* 6. Venda */}
                    <td className="py-3.5 px-4 text-center">
                      {renderCrmStatusBadge(lead.venda)}
                    </td>

                    {/* 7. Valor Conversão */}
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
});

CrmLeadsView.displayName = 'CrmLeadsView';
