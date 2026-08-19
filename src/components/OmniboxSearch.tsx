import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Tag, Filter } from 'lucide-react';
import { FilterTag } from '../services/meta/savedViewsStore';

interface OmniboxSearchProps {
  activeFilters: FilterTag[];
  onAddFilter: (tag: FilterTag) => void;
  onRemoveFilter: (id: string) => void;
  onClearAllFilters: () => void;
}

export const OmniboxSearch: React.FC<OmniboxSearchProps> = ({
  activeFilters,
  onAddFilter,
  onRemoveFilter,
  onClearAllFilters
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      createFilterFromInput(inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && activeFilters.length > 0) {
      // Remove last filter on backspace if input is empty
      onRemoveFilter(activeFilters[activeFilters.length - 1].id);
    }
  };

  const createFilterFromInput = (val: string, forcedType?: 'NAME' | 'ID' | 'STATUS') => {
    const isDigits = /^\d+$/.test(val);
    const type = forcedType || (isDigits ? 'ID' : 'NAME');
    const label = type === 'ID' ? 'ID da campanha' : 'Nome contém';

    const newTag: FilterTag = {
      id: `filter_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      label,
      value: val
    };

    onAddFilter(newTag);
    setInputValue('');
    setIsDropdownOpen(false);
  };

  const getSuggestions = () => {
    if (!inputValue.trim()) return [];
    const val = inputValue.trim();
    const isNum = /^\d+$/.test(val);
    const lower = val.toLowerCase();

    const suggestions = [];

    if (isNum) {
      suggestions.push({
        type: 'ID' as const,
        title: `Filtrar por ID da Campanha: "${val}"`,
        subtitle: 'Busca direta por ID numérico'
      });
    }

    suggestions.push({
      type: 'NAME' as const,
      title: `Nome da campanha contém: "${val}"`,
      subtitle: 'Filtro por palavra-chave (Case Insensitive)'
    });

    if ('ativo'.includes(lower)) {
      suggestions.push({
        type: 'STATUS' as const,
        value: 'Ativo',
        title: 'Veiculação: "Ativo"',
        subtitle: 'Filtra campanhas com veiculação verde'
      });
    }

    if ('pausado'.includes(lower)) {
      suggestions.push({
        type: 'STATUS' as const,
        value: 'Pausado',
        title: 'Veiculação: "Pausado"',
        subtitle: 'Filtra campanhas pausadas pelo usuário'
      });
    }

    return suggestions;
  };

  const suggestions = getSuggestions();

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Omnibox Input Container with Active Filter Tags */}
      <div
        className="w-full min-h-[42px] bg-brand-sidebar border border-brand-border focus-within:border-blue-500 rounded-xl px-3 py-1.5 flex flex-wrap items-center gap-2 shadow-inner transition-all cursor-text"
        onClick={() => setIsDropdownOpen(true)}
      >
        <Search className="w-4 h-4 text-zinc-400 shrink-0" />

        {/* Render Active Filter Tags (Pills) */}
        {activeFilters.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1.5 bg-blue-950/70 border border-blue-500/50 text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm animate-fadeIn"
          >
            <Tag className="w-3 h-3 text-blue-400 shrink-0" />
            <span>{tag.label}: <strong className="text-white font-bold">{tag.value}</strong></span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFilter(tag.id);
              }}
              className="hover:text-red-400 p-0.5 rounded transition-colors"
              title="Remover filtro"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Main Text Input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsDropdownOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsDropdownOpen(true)}
          placeholder={activeFilters.length === 0 ? "Pesquise para filtrar por: nome, identificação ou métrica" : "Adicionar outro filtro..."}
          className="flex-1 min-w-[200px] bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none py-1"
        />

        {activeFilters.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearAllFilters();
            }}
            className="text-[11px] text-zinc-400 hover:text-red-400 font-semibold px-2 py-0.5 rounded border border-zinc-700/60 transition-colors shrink-0"
          >
            Limpar tudo
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isDropdownOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-zinc-800 animate-fadeIn">
          {suggestions.map((sug, idx) => (
            <div
              key={idx}
              onClick={() => createFilterFromInput(sug.value || inputValue.trim(), sug.type)}
              className="p-3 hover:bg-blue-600/20 cursor-pointer flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Filter className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-blue-300">
                    {sug.title}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    {sug.subtitle}
                  </div>
                </div>
              </div>
              <span className="text-[10px] bg-zinc-800 text-zinc-400 group-hover:bg-blue-500 group-hover:text-white px-2 py-0.5 rounded font-mono">
                Enter ↵
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
