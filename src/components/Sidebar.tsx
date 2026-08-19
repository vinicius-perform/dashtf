import React from 'react';
import { Logo } from './Logo';
import { 
  LayoutDashboard, 
  Link2, 
  Settings
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeLevel?: string;
  setActiveLevel?: (level: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  activeLevel,
  setActiveLevel
}) => {
  return (
    <aside className="w-64 bg-brand-sidebar border-r border-brand-border flex flex-col shrink-0 min-h-screen select-none">
      {/* Top Brand Logo Header */}
      <div className="p-5 border-b border-brand-border flex items-center justify-between">
        <Logo />
        <button className="text-brand-textMuted hover:text-white p-1 rounded transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      </div>

      {/* Menu Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold text-brand-textMuted uppercase tracking-wider">
            Menu Principal
          </div>

          <nav className="space-y-1">
            {/* Dashboard Button (Highlighted in Neon Yellow if Active) */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-brand-neon text-black font-bold shadow-md shadow-brand-neon/20'
                  : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </button>

            {/* Integrações Meta Button */}
            <button
              onClick={() => setActiveTab('integracoes')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'integracoes'
                  ? 'bg-brand-neon text-black font-bold shadow-md shadow-brand-neon/20'
                  : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Link2 className="w-4 h-4" />
                <span>Integrações Meta</span>
              </div>
              <span className="text-[10px] bg-blue-600/30 text-blue-400 border border-blue-500/30 font-semibold px-1.5 py-0.5 rounded">
                API
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Footer Settings */}
      <div className="p-3 border-t border-brand-border">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors">
          <Settings className="w-4 h-4" />
          <span>Configurações</span>
        </button>
      </div>
    </aside>
  );
};
