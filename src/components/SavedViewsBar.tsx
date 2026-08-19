import React from 'react';
import { SavedView } from '../services/meta/savedViewsStore';
import { Folder, ArrowUpRight, Mail, Navigation, Plus, Settings, Check } from 'lucide-react';

interface SavedViewsBarProps {
  views: SavedView[];
  activeViewId: string;
  onSelectView: (view: SavedView) => void;
  onOpenEditModal: (view?: SavedView) => void;
}

export const SavedViewsBar: React.FC<SavedViewsBarProps> = ({
  views,
  activeViewId,
  onSelectView,
  onOpenEditModal
}) => {
  const getIconForView = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('todos')) return <Folder className="w-3.5 h-3.5 text-blue-400" />;
    if (lower.includes('ações') || lower.includes('acoes')) return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />;
    if (lower.includes('veiculação') || lower.includes('tiveram')) return <Mail className="w-3.5 h-3.5 text-purple-400" />;
    if (lower.includes('ativos') || lower.includes('ativo')) return <Navigation className="w-3.5 h-3.5 text-amber-400" />;
    return null;
  };

  const activeView = views.find(v => v.id === activeViewId) || views[0];

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      {/* Preset View Buttons */}
      {views.map((view) => {
        const isActive = view.id === activeViewId;
        return (
          <button
            key={view.id}
            onClick={() => onSelectView(view)}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isActive
                ? 'bg-blue-950/60 border-blue-500 text-blue-300 shadow-md shadow-blue-500/10'
                : 'bg-brand-sidebar border-brand-border text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {getIconForView(view.name)}
            <span>{view.name}</span>
            {isActive && <Check className="w-3 h-3 text-blue-400 ml-0.5" />}
          </button>
        );
      })}

      {/* Edit Active View Button */}
      <button
        onClick={() => onOpenEditModal(activeView)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-brand-border bg-brand-sidebar hover:bg-zinc-800 text-zinc-300 transition-colors"
        title="Editar configurações da visualização ativa"
      >
        <Settings className="w-3.5 h-3.5 text-zinc-400" />
        <span>Editar visualização</span>
      </button>

      {/* Save New View (+ Ver mais / Criar Nova) */}
      <button
        onClick={() => onOpenEditModal(undefined)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-dashed border-zinc-700 hover:border-brand-neon bg-transparent text-zinc-400 hover:text-brand-neon transition-all"
        title="Salvar nova visualização customizada"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Nova visualização</span>
      </button>
    </div>
  );
};
