import React, { useState, useEffect } from 'react';
import { X, Trash2, Tag, Sliders, ArrowUpDown, ChevronDown, Check } from 'lucide-react';
import { SavedView, FilterTag, createSavedView, updateSavedView, deleteSavedView } from '../services/meta/savedViewsStore';

interface EditViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetView?: SavedView;
  currentFilters: FilterTag[];
  currentSorting?: { column: string; direction: 'ASC' | 'DESC' };
  onApplyView: (view: SavedView) => void;
}

export const EditViewModal: React.FC<EditViewModalProps> = ({
  isOpen,
  onClose,
  targetView,
  currentFilters,
  currentSorting,
  onApplyView
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [access, setAccess] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [enableFilters, setEnableFilters] = useState(true);
  const [enableColumns, setEnableColumns] = useState(true);
  const [enableSorting, setEnableSorting] = useState(true);
  const [filtersList, setFiltersList] = useState<FilterTag[]>([]);

  useEffect(() => {
    if (targetView) {
      setName(targetView.name || '');
      setDescription(targetView.description || '');
      setAccess(targetView.access || 'PRIVATE');
      setFiltersList(targetView.config?.filters || []);
    } else {
      setName('');
      setDescription('');
      setAccess('PRIVATE');
      setFiltersList(currentFilters);
    }
  }, [targetView, currentFilters, isOpen]);

  if (!isOpen) return null;

  const handleSaveEdits = () => {
    if (!name.trim()) return;

    if (targetView) {
      const updated = updateSavedView(targetView.id, {
        name: name.trim(),
        description: description.trim(),
        access,
        config: {
          filters: enableFilters ? filtersList : [],
          sorting: enableSorting ? currentSorting : undefined
        }
      });
      const edited = updated.find(v => v.id === targetView.id);
      if (edited) onApplyView(edited);
    } else {
      const created = createSavedView({
        name: name.trim(),
        description: description.trim(),
        access,
        isDefault: false,
        config: {
          filters: enableFilters ? filtersList : [],
          sorting: enableSorting ? currentSorting : undefined
        }
      });
      onApplyView(created);
    }
    onClose();
  };

  const handleSaveCopy = () => {
    if (!name.trim()) return;
    const created = createSavedView({
      name: `${name.trim()} (Cópia)`,
      description: description.trim(),
      access,
      isDefault: false,
      config: {
        filters: enableFilters ? filtersList : [],
        sorting: enableSorting ? currentSorting : undefined
      }
    });
    onApplyView(created);
    onClose();
  };

  const handleDelete = () => {
    if (targetView && confirm(`Excluir a visualização "${targetView.name}"?`)) {
      deleteSavedView(targetView.id);
      onClose();
    }
  };

  const handleRemoveFilter = (filterId: string) => {
    setFiltersList(prev => prev.filter(f => f.id !== filterId));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <h3 className="text-base font-bold text-white tracking-tight">
            {targetView ? 'Editar visualização' : 'Criar nova visualização'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Nome Input */}
          <div>
            <div className="flex justify-between items-center mb-1 font-bold text-zinc-300">
              <span>Nome</span>
              <span className="text-[10px] text-zinc-500">{name.length}/100</span>
            </div>
            <input
              type="text"
              maxLength={100}
              placeholder="Digite o nome da visualização"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Descrição Input */}
          <div>
            <div className="flex justify-between items-center mb-1 font-bold text-zinc-300">
              <span>Descrição</span>
              <span className="text-[10px] text-zinc-500">{description.length}/350</span>
            </div>
            <textarea
              rows={2}
              maxLength={350}
              placeholder="Descreva a visualização"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Acesso Select */}
          <div>
            <div className="mb-1 font-bold text-zinc-300">Acesso</div>
            <select
              value={access}
              onChange={(e) => setAccess(e.target.value as any)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="PRIVATE">Somente você</option>
              <option value="PUBLIC">Todos na conta de anúncios</option>
            </select>
          </div>

          <hr className="border-zinc-800" />

          {/* Configurações Header */}
          <div>
            <div className="font-bold text-white text-sm mb-0.5">Configurações</div>
            <p className="text-[11px] text-zinc-400">
              Ative as configurações para aplicá-las quando abrir essa visualização rápida.
            </p>
          </div>

          {/* Switch: Filtros */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200">Filtros</span>
              <input
                type="checkbox"
                checked={enableFilters}
                onChange={(e) => setEnableFilters(e.target.checked)}
                className="w-4 h-4 accent-blue-500 cursor-pointer"
              />
            </div>

            {enableFilters && (
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-2">
                {filtersList.length === 0 ? (
                  <div className="text-[11px] text-zinc-500 italic">Nenhum filtro ativo configurado</div>
                ) : (
                  filtersList.map((f) => (
                    <div key={f.id} className="inline-flex items-center gap-1.5 bg-blue-950/70 border border-blue-500/40 text-blue-300 text-[11px] px-2.5 py-1 rounded-md mr-1 mb-1">
                      <Tag className="w-3 h-3 text-blue-400" />
                      <span>{f.label}: <strong>{f.value}</strong></span>
                      <button onClick={() => handleRemoveFilter(f.id)} className="hover:text-red-400 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Switch: Classificação (Sorting) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200">Classificação</span>
              <input
                type="checkbox"
                checked={enableSorting}
                onChange={(e) => setEnableSorting(e.target.checked)}
                className="w-4 h-4 accent-blue-500 cursor-pointer"
              />
            </div>

            {enableSorting && (
              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 flex items-center justify-between text-zinc-300">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
                  <span>Coluna: <strong>{currentSorting?.column || 'Valor gasto'}</strong></span>
                </div>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono uppercase">
                  {currentSorting?.direction || 'DESC'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions matching screenshot */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-2">
          {targetView ? (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors"
              title="Excluir visualização"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveCopy}
              className="px-3.5 py-2 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition-colors"
            >
              Salvar cópia
            </button>
            <button
              onClick={handleSaveEdits}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md shadow-blue-600/30"
            >
              Salvar edições
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
