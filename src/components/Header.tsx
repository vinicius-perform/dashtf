import React from 'react';
import { 
  ChevronDown, 
  RefreshCw 
} from 'lucide-react';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { MetaAdAccount, MetaConfig } from '../types/meta';

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
  session?: any;
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
  lastUpdatedTime,
  session
}) => {
  const displayTimestamp = lastUpdatedTime || new Date().toLocaleString('pt-BR');

  const user = session?.user;
  const userEmail: string = user?.email || '';
  const userName: string = user?.user_metadata?.name || user?.name || (userEmail ? userEmail.split('@')[0] : 'Usuário');
  
  // Format username (e.g. antonio.neto, viniciusmarinhods)
  const displayUsername = userEmail ? userEmail.split('@')[0] : (userName.toLowerCase().replace(/\s+/g, ''));
  
  // Format initials (e.g. AN for Antonio Neto, VM for Vinicius Marinho)
  const userInitials = (() => {
    if (user?.user_metadata?.name || user?.name) {
      const parts = (user.user_metadata?.name || user.name).trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (userEmail) {
      const prefix = userEmail.split('@')[0];
      const dotParts = prefix.split(/[\._\-]/);
      if (dotParts.length >= 2) {
        return (dotParts[0][0] + dotParts[1][0]).toUpperCase();
      }
      return prefix.slice(0, 2).toUpperCase();
    }
    return 'AN';
  })();

  const userRole = (user?.user_metadata?.role || user?.role || 'admin').toLowerCase();
  const isSuper = userEmail.toLowerCase().includes('viniciusmarinhods');
  const isAdmin = userRole === 'admin' || userEmail.toLowerCase().includes('dottech.ai') || isSuper;
  const roleSubtitle = isSuper ? 'Supervisor' : isAdmin ? 'Administrador' : 'Gestor de Tráfego';

  return (
    <header className="bg-brand-sidebar border-b border-brand-border px-6 py-4 space-y-4">
      {/* Top Utility Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            {activeTab === 'gerenciador' && 'Visão Geral'}
            {activeTab === 'tarefas' && 'Gestão de Tarefas'}
            {activeTab === 'financeiro' && 'Financeiro & Abastecimentos'}
            {activeTab === 'integracoes' && 'Integrações Meta'}
          </h1>
          <p className="text-xs text-brand-textMuted mt-0.5">
            {activeTab === 'gerenciador'
              ? `Acompanhe suas métricas principais em um só lugar • Última atualização: ${displayTimestamp}`
              : activeTab === 'tarefas'
              ? 'Cronograma de check-ins da semana e encaminhamentos operacionais da equipe'
              : activeTab === 'financeiro'
              ? 'Controle de saldo, recargas e fluxo orçamentário'
              : 'Conecte sua conta de anúncios do Facebook Ads e sincronize dados reais da sua operação'}
          </p>
        </div>

        {/* Right Action Icons & User Profile */}
        <div className="flex items-center gap-4">
          {/* Dynamic User Profile */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-neon to-emerald-400 text-black font-black flex items-center justify-center text-xs shadow-md">
              {userInitials}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white">
                {displayUsername}
              </span>
              <span className="text-[10px] text-zinc-400">{roleSubtitle}</span>
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

            {/* Neon Green Filtrar Button */}
            <button 
              onClick={onRefresh}
              className="flex items-center gap-2 bg-brand-neon text-black font-bold text-xs px-4 py-1.5 rounded-lg hover:bg-brand-neonHover transition-all shadow-md shadow-brand-neon/20 cursor-pointer"
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
