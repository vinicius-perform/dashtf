import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, Building2, Star } from 'lucide-react';
import { MetaAdAccount } from '../types/meta';

interface SearchableSelectProps {
  accounts: MetaAdAccount[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const FAVORITES_KEY = 'fazendo_acontecer_favorite_accounts';

const getInitialFavorites = (): string[] => {
  const raw = localStorage.getItem(FAVORITES_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  // Default favorites (CA02 - FA and POUPE MAKE PARAIPABA)
  return ['act_1115861513053539', 'act_858751867277029'];
};

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  accounts,
  selectedId,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>(getInitialFavorites);

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedAccount = accounts.find((a) => a.id === selectedId) || accounts[0];
  const isSelectedFavorite = selectedAccount ? favorites.includes(selectedAccount.id) : false;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFavorite = (e: React.MouseEvent, accId: string) => {
    e.stopPropagation(); // Don't close dropdown or select account
    setFavorites((prev) => {
      const updated = prev.includes(accId)
        ? prev.filter((id) => id !== accId)
        : [...prev, accId];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const favoriteAccounts = filteredAccounts.filter((acc) => favorites.includes(acc.id));
  const otherAccounts = filteredAccounts.filter((acc) => !favorites.includes(acc.id));

  const handleSelectAccount = (accId: string) => {
    onSelect(accId);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-80" ref={containerRef}>
      {/* Input / Selector Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-brand-card border text-xs font-semibold cursor-pointer transition-all ${
          isOpen
            ? 'border-brand-neon ring-1 ring-brand-neon/30 text-white shadow-lg shadow-brand-neon/10'
            : 'border-brand-border hover:border-brand-neon/50 text-zinc-200'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 className="w-3.5 h-3.5 text-brand-neon shrink-0" />
          {isSelectedFavorite && (
            <Star className="w-3.5 h-3.5 fill-brand-neon text-brand-neon shrink-0" />
          )}
          <span className="truncate">{selectedAccount ? selectedAccount.name : 'Selecionar Conta'}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-brand-neon' : ''}`} />
      </div>

      {/* Floating Searchable Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-[#121214] border border-brand-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Real-time Search Input */}
          <div className="p-2.5 border-b border-brand-border bg-brand-sidebar">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Digite para buscar conta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full bg-brand-bg border border-brand-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon font-medium"
              />
            </div>
          </div>

          {/* Accounts List (Prioritizing Favorites at the Top) */}
          <div className="max-h-64 overflow-y-auto py-1 divide-y divide-zinc-900/60">
            {/* Group 1: Favorited Accounts */}
            {favoriteAccounts.length > 0 && (
              <div>
                <div className="px-3.5 py-1 text-[10px] font-bold text-brand-neon uppercase tracking-wider bg-brand-neon/5 flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-brand-neon text-brand-neon" />
                  <span>Favoritas ({favoriteAccounts.length})</span>
                </div>

                {favoriteAccounts.map((acc) => (
                  <AccountRow
                    key={acc.id}
                    acc={acc}
                    isSelected={acc.id === selectedId}
                    isFavorite={true}
                    onSelect={() => handleSelectAccount(acc.id)}
                    onToggleFavorite={(e) => toggleFavorite(e, acc.id)}
                  />
                ))}
              </div>
            )}

            {/* Group 2: Other Accounts */}
            {otherAccounts.length > 0 && (
              <div>
                {favoriteAccounts.length > 0 && (
                  <div className="px-3.5 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-900/40">
                    Outras Contas ({otherAccounts.length})
                  </div>
                )}

                {otherAccounts.map((acc) => (
                  <AccountRow
                    key={acc.id}
                    acc={acc}
                    isSelected={acc.id === selectedId}
                    isFavorite={false}
                    onSelect={() => handleSelectAccount(acc.id)}
                    onToggleFavorite={(e) => toggleFavorite(e, acc.id)}
                  />
                ))}
              </div>
            )}

            {filteredAccounts.length === 0 && (
              <div className="p-4 text-center text-xs text-zinc-500 italic">
                Nenhuma conta encontrada para "{searchTerm}"
              </div>
            )}
          </div>

          {/* Footer Account Count */}
          <div className="px-3.5 py-1.5 bg-brand-sidebar border-t border-brand-border text-[10px] text-zinc-400 font-mono flex items-center justify-between">
            <span>{filteredAccounts.length} conta(s) • {favorites.length} favorita(s)</span>
            <span className="text-brand-neon font-semibold">Meta Business Manager</span>
          </div>
        </div>
      )}
    </div>
  );
};

interface AccountRowProps {
  acc: MetaAdAccount;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const AccountRow: React.FC<AccountRowProps> = ({
  acc,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
}) => (
  <div
    onClick={onSelect}
    className={`w-full px-3.5 py-2.5 text-xs flex items-center justify-between transition-all cursor-pointer group select-none ${
      isSelected
        ? 'bg-brand-neon/15 text-brand-neon font-bold border-l-2 border-brand-neon'
        : 'text-zinc-300 hover:bg-zinc-800/70 hover:text-white'
    }`}
  >
    <div className="flex items-center gap-2 truncate pr-2">
      {isSelected && <Check className="w-3.5 h-3.5 text-brand-neon shrink-0" />}
      <div className="flex flex-col truncate">
        <span className="truncate">{acc.name}</span>
        <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{acc.id} • {acc.currency}</span>
      </div>
    </div>

    {/* Star Button */}
    <button
      type="button"
      onClick={onToggleFavorite}
      className="p-1 rounded hover:bg-zinc-700/60 transition-colors shrink-0"
      title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <Star
        className={`w-4 h-4 transition-all ${
          isFavorite
            ? 'fill-brand-neon text-brand-neon scale-110'
            : 'text-zinc-600 group-hover:text-zinc-300'
        }`}
      />
    </button>
  </div>
);
