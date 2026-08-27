import React from 'react';
import { Logo } from './Logo';
import { 
  LayoutDashboard, 
  Radar,
  Users,
  Layers,
  Link2, 
  Settings,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeLevel?: string;
  setActiveLevel?: (level: string) => void;
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({ 
  activeTab, 
  setActiveTab,
  activeLevel,
  setActiveLevel,
  onLogout,
  isCollapsed = false,
  onToggleCollapse
}) => {
  return (
    <aside 
      className={`bg-brand-sidebar border-r border-brand-border flex flex-col shrink-0 min-h-screen select-none transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Brand Logo Header */}
      <div className={`p-4 border-b border-brand-border flex items-center ${isCollapsed ? 'justify-center flex-col gap-3' : 'justify-between'}`}>
        <Logo collapsed={isCollapsed} />
        <button 
          onClick={onToggleCollapse}
          className="text-brand-textMuted hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      </div>

      {/* Menu Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          {!isCollapsed && (
            <div className="px-3 mb-2 text-[11px] font-bold text-brand-textMuted uppercase tracking-wider transition-opacity duration-200">
              Menu Principal
            </div>
          )}

          <nav className="space-y-1">
            {/* Gerenciador Button (Highlighted in Neon Yellow if Active) */}
            <button
              onClick={() => setActiveTab('gerenciador')}
              title={isCollapsed ? 'Gerenciador' : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'gerenciador'
                  ? 'bg-brand-neon text-black font-bold shadow-md shadow-brand-neon/20'
                  : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Gerenciador</span>}
            </button>

            {/* Mineração Button */}
            <button
              onClick={() => setActiveTab('mineracao')}
              title={isCollapsed ? 'Mineração' : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} rounded-lg text-sm font-medium transition-all ${
                activeTab === 'mineracao'
                  ? 'bg-brand-neon text-black font-bold shadow-md shadow-brand-neon/20'
                  : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
              }`}
            >
              <Radar className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Mineração</span>}
            </button>

            {/* Leads Button */}
            <button
              onClick={() => setActiveTab('leads')}
              title={isCollapsed ? 'Leads' : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} rounded-lg text-sm font-medium transition-all ${
                activeTab === 'leads'
                  ? 'bg-brand-neon text-black font-bold shadow-md shadow-brand-neon/20'
                  : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Leads</span>}
            </button>

            {/* Criativos Button */}
            <button
              onClick={() => setActiveTab('criativos')}
              title={isCollapsed ? 'Criativos' : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} rounded-lg text-sm font-medium transition-all ${
                activeTab === 'criativos'
                  ? 'bg-brand-neon text-black font-bold shadow-md shadow-brand-neon/20'
                  : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Criativos</span>}
            </button>

            {/* Integrações Meta Button */}
            <button
              onClick={() => setActiveTab('integracoes')}
              title={isCollapsed ? 'Integrações Meta' : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} rounded-lg text-sm font-medium transition-all ${
                activeTab === 'integracoes'
                  ? 'bg-brand-neon text-black font-bold shadow-md shadow-brand-neon/20'
                  : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
              }`}
            >
              <Link2 className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Integrações Meta</span>}
            </button>
          </nav>
        </div>
      </div>

      {/* Footer Settings & Logout */}
      <div className="p-3 border-t border-brand-border space-y-1">
        <button 
          title={isCollapsed ? 'Configurações' : undefined}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2'} rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Configurações</span>}
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            title={isCollapsed ? 'Sair da Conta' : undefined}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2'} rounded-lg text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sair da Conta</span>}
          </button>
        )}
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';
