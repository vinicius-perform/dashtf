import React from 'react';
import { 
  Search, 
  Calendar, 
  ChevronDown, 
  Download, 
  LayoutGrid, 
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { MetaAdAccount, MetaConfig } from '../types/meta';
import { NexusSyncIndicator } from './NexusSyncIndicator';

import { SearchableSelect } from './SearchableSelect';

interface HeaderProps {
  activeTab: string;
  metaConfig: MetaConfig;
  accounts: MetaAdAccount[];
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  onRefresh: () => void;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenDebug: () => void;
  lastUpdatedTime?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  metaConfig,
  accounts,
  selectedAccountId,
  setSelectedAccountId,
  dateRange,
  setDateRange,
  onRefresh,
  isLoading,
  searchQuery,
  setSearchQuery,
  onOpenDebug,
  lastUpdatedTime
}) => {
  const displayTimestamp = lastUpdatedTime || new Date().toLocaleString('pt-BR');

  return (
    <header className="bg-brand-sidebar border-b border-brand-border px-6 py-4 space-y-4">
      {/* Top Utility Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            {activeTab === 'gerenciador' ? 'Visão Geral' : 'Integrações Meta'}
            {activeTab === 'gerenciador' && (
              <span className="text-xs bg-brand-neon/15 text-brand-neon font-semibold px-2.5 py-1 rounded-full border border-brand-neon/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-neon animate-pulse" />
                Meta Ads API
              </span>
            )}
          </h1>
          <p className="text-xs text-brand-textMuted mt-0.5">
            {activeTab === 'gerenciador'
              ? `Acompanhe suas métricas principais em um só lugar • Última atualização: ${displayTimestamp}`
              : 'Conecte sua conta de anúncios do Facebook Ads e sincronize dados reais da sua operação'}
          </p>
        </div>

        {/* Right Action Icons & User Profile */}
        <div className="flex items-center gap-4">
          {/* Nexus Sync Automation Heartbeat Indicator */}
          <NexusSyncIndicator onRefresh={onRefresh} />

          {/* Search Box */}
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-card border border-brand-border rounded-lg pl-9 pr-8 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-colors"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
              ⌘K
            </span>
          </div>

          {/* Meta Data Debug Engine Button */}
          <button
            onClick={onOpenDebug}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-neon/40 bg-brand-neon/10 hover:bg-brand-neon hover:text-black text-xs text-brand-neon font-bold transition-all"
            title="Abrir Auditoria de Dados RAW da Meta"
          >
            <span>🔍 Meta Data Debug</span>
          </button>

          {/* Export PDF Button */}
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-border bg-brand-card hover:bg-brand-cardHover text-xs text-zinc-300 font-medium transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>Exportar PDF</span>
          </button>

          {/* User Profile matching reference screenshot */}
          <div className="flex items-center gap-2 pl-2 border-l border-brand-border">
            <div className="w-8 h-8 rounded-full bg-brand-neon text-black font-bold flex items-center justify-center text-xs shadow-md">
              VM
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                viniciusmarinhods
                <span className="bg-yellow-400/20 text-yellow-400 text-[9px] font-extrabold px-1 rounded uppercase">
                  SUPER
                </span>
              </span>
              <span className="text-[10px] text-zinc-400">Supervisor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      {activeTab === 'gerenciador' && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Interactive Date Range Picker */}
            <DateRangePicker 
              value={dateRange} 
              onChange={setDateRange} 
              timezone={accounts.find(a => a.id === selectedAccountId)?.timezone_name || 'America/Sao_Paulo'}
            />

            {/* Fixed Active Account Indicator (No discovery on dashboard load) */}
            <div className="flex items-center gap-2 bg-brand-card border border-brand-border px-3.5 py-1.5 rounded-lg text-xs font-mono text-zinc-300">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">CONTA ATIVA:</span>
              <span className="font-bold text-white">{metaConfig.accountName || 'CA02 - FA'}</span>
              <span className="text-[11px] text-brand-neon bg-brand-neon/10 px-1.5 py-0.5 rounded border border-brand-neon/20 font-bold">
                ID: {metaConfig.selectedAccountId || '1115861513053539'} ({metaConfig.currency || 'BRL'})
              </span>
            </div>

            {/* Neon Green Filtrar Button */}
            <button 
              onClick={onRefresh}
              className="flex items-center gap-2 bg-brand-neon text-black font-bold text-xs px-4 py-1.5 rounded-lg hover:bg-brand-neonHover transition-all shadow-md shadow-brand-neon/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Filtrar</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

const FilterPill: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-card border border-brand-border text-xs text-zinc-300 cursor-pointer hover:border-zinc-700 transition-colors">
    <span>{label}</span>
    <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
  </div>
);
