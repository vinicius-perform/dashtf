import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Layers, 
  Sparkles, 
  Flame, 
  FlaskConical, 
  Calendar, 
  Play, 
  Bookmark, 
  Search, 
  Plus, 
  FolderSearch, 
  X, 
  Info, 
  ExternalLink, 
  GitMerge, 
  RotateCcw, 
  MapPin, 
  FolderOpen, 
  ChevronRight, 
  Eye, 
  Trash2, 
  Download, 
  CheckCircle2, 
  FolderHeart,
  SlidersHorizontal,
  Film,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { MetaAdsLibraryView, GENERATE_MOCK_LIBRARY, LibraryAd } from './MetaAdsLibraryView';

export interface CompetitorDetails {
  name: string;
  handle?: string;
  avatarUrl?: string;
  avatarInitials: string;
  category: string;
  description: string;
  facebookId: string;
  facebookFollowers: string;
  facebookCategory: string;
  instagramHandle: string;
  instagramFollowers: string;
  mergedPagesCount: number;
  nameChangedCount: number;
  creationDate: string;
  organizations: string;
  primaryLocation: string;
  pageUrl: string;
}

export interface MonitoredCompetitorFolder {
  id: string;
  competitor: CompetitorDetails;
  addedAt: string;
}

export const STORAGE_SAVED_SWIPES_KEY = 'dashtf_mining_saved_swipes';
export const STORAGE_FOLDERS_KEY = 'dashtf_mining_competitor_folders';

export const DEFAULT_SAMPLE_COMPETITOR: CompetitorDetails = {
  name: 'pietro.boscardin',
  handle: '@pietro.boscardin',
  avatarInitials: 'PB',
  avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
  category: 'Empreendedor(a)',
  description: 'Marketing e vendas para clínicas de harmonização facial.',
  facebookId: '100242929476278',
  facebookFollowers: '166 seguidores',
  facebookCategory: 'Empreendedor(a)',
  instagramHandle: '@pietro.boscardin',
  instagramFollowers: '32,8 mil seguidores',
  mergedPagesCount: 0,
  nameChangedCount: 0,
  creationDate: '11 de ago de 2022',
  organizations: 'Nenhuma',
  primaryLocation: 'Brazil (8)',
  pageUrl: 'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BR&view_all_page_id=100242929476278'
};

export const FacebookIcon = () => (
  <div className="w-4 h-4 rounded-full bg-[#1877F2] flex items-center justify-center shadow-xs shrink-0" title="Facebook">
    <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  </div>
);

export const InstagramIcon = () => (
  <div className="w-4 h-4 rounded-lg bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] flex items-center justify-center shadow-xs shrink-0" title="Instagram">
    <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  </div>
);

export const MiningView: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [viewMode, setViewMode] = useState<'radar' | 'biblioteca_particular'>('radar');
  
  // Persistent Competitor Folders loaded from localStorage
  const [competitorFolders, setCompetitorFolders] = useState<MonitoredCompetitorFolder[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_FOLDERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Persistent Saved Swipes (Minha Biblioteca Particular) loaded from localStorage
  const [savedSwipes, setSavedSwipes] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SAVED_SWIPES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorDetails | null>(null);
  const [activeLibraryCompetitor, setActiveLibraryCompetitor] = useState<CompetitorDetails | null>(null);
  const [playingVideoAd, setPlayingVideoAd] = useState<LibraryAd | null>(null);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);

  // Filters inside "Minha Biblioteca Particular"
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryMediaType, setLibraryMediaType] = useState<'ALL' | 'video' | 'image'>('ALL');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Sync state to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SAVED_SWIPES_KEY, JSON.stringify(savedSwipes));
    } catch (e) {
      console.error('Error saving swipes to localStorage', e);
    }
  }, [savedSwipes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FOLDERS_KEY, JSON.stringify(competitorFolders));
    } catch (e) {
      console.error('Error saving competitor folders to localStorage', e);
    }
  }, [competitorFolders]);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCompetitor(null);
        setPlayingVideoAd(null);
      }
    };
    if (selectedCompetitor || playingVideoAd) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCompetitor, playingVideoAd]);

  // All mock ads from current competitors
  const allKnownAds = useMemo(() => {
    return GENERATE_MOCK_LIBRARY('pietro.boscardin');
  }, []);

  // Saved Ads in "Minha Biblioteca Particular"
  const savedAdsList = useMemo(() => {
    return allKnownAds.filter(ad => {
      if (!savedSwipes.includes(ad.id)) return false;
      if (libraryMediaType !== 'ALL' && ad.mediaType !== libraryMediaType) return false;
      if (librarySearch.trim()) {
        const query = librarySearch.toLowerCase();
        const matchCopy = ad.adCopy.toLowerCase().includes(query);
        const matchId = ad.libraryId.includes(query);
        if (!matchCopy && !matchId) return false;
      }
      return true;
    });
  }, [allKnownAds, savedSwipes, libraryMediaType, librarySearch]);

  // Dynamic KPI Metrics
  const kpiMetrics = useMemo(() => {
    const foldersCount = competitorFolders.length;
    if (foldersCount === 0) {
      return {
        monitoredCompetitors: 0,
        totalCreatives: 0,
        newCreatives7Days: 0,
        scaledCreatives: 0,
        testingCreatives: 0,
        avgDaysTesting: '-- dias'
      };
    }

    const totalAds = foldersCount * 36;
    const scaledAds = foldersCount * 15;
    const testingAds = foldersCount * 21;
    const new7Days = foldersCount * 12;

    return {
      monitoredCompetitors: foldersCount,
      totalCreatives: totalAds,
      newCreatives7Days: new7Days,
      scaledCreatives: scaledAds,
      testingCreatives: testingAds,
      avgDaysTesting: '9 dias'
    };
  }, [competitorFolders]);

  // Handle URL Add (Creates client folder)
  const handleAddMonitorUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const exists = competitorFolders.some(f => f.competitor.name.toLowerCase() === 'pietro.boscardin');
    if (!exists) {
      const newFolder: MonitoredCompetitorFolder = {
        id: `folder-${Date.now()}`,
        competitor: {
          ...DEFAULT_SAMPLE_COMPETITOR,
          name: 'pietro.boscardin',
          pageUrl: urlInput
        },
        addedAt: new Date().toLocaleDateString('pt-BR')
      };
      setCompetitorFolders(prev => [newFolder, ...prev]);
    }

    setUrlInput('');
  };

  // Toggle Save to Swipe File (Minha Biblioteca Particular)
  const handleToggleSwipe = (id: string) => {
    setSavedSwipes(prev => {
      const isAlreadySaved = prev.includes(id);
      return isAlreadySaved 
        ? prev.filter(item => item !== id) 
        : [...prev, id];
    });
  };

  // Save all ads from a competitor directly to Minha Biblioteca Particular
  const handleSaveAllCompetitorAdsToSwipe = (competitorName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const mockAds = GENERATE_MOCK_LIBRARY(competitorName);
    const adIds = mockAds.map(a => a.id);
    
    setSavedSwipes(prev => {
      const allSaved = adIds.every(id => prev.includes(id));
      if (allSaved) {
        // If all are already saved, remove them
        setFeedbackToast(`Removidos da sua Biblioteca Particular.`);
        setTimeout(() => setFeedbackToast(null), 3000);
        return prev.filter(id => !adIds.includes(id));
      } else {
        // Add all to private library
        setFeedbackToast(`✓ Todos os criativos foram salvos na sua Biblioteca Particular!`);
        setTimeout(() => setFeedbackToast(null), 3000);
        const newSet = new Set([...prev, ...adIds]);
        return Array.from(newSet);
      }
    });
  };

  // Remove competitor folder manually
  const handleRemoveCompetitorFolder = (folderId: string, competitorName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Deseja remover a pasta do cliente ${competitorName}?`)) {
      setCompetitorFolders(prev => prev.filter(f => f.id !== folderId));
    }
  };

  // If a competitor folder is opened, render the full Meta Ads Library View
  if (activeLibraryCompetitor) {
    return (
      <div className="p-6 max-w-[1700px] mx-auto">
        <MetaAdsLibraryView
          competitor={activeLibraryCompetitor}
          savedSwipes={savedSwipes}
          onToggleSwipe={handleToggleSwipe}
          onBack={() => setActiveLibraryCompetitor(null)}
          onOpenTransparency={() => setSelectedCompetitor(activeLibraryCompetitor)}
        />

        {/* Modal de Transparência da Página */}
        {selectedCompetitor && (
          <CompetitorTransparencyModal
            competitor={selectedCompetitor}
            onClose={() => setSelectedCompetitor(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto animate-fadeIn relative">
      {/* Toast de Feedback */}
      {feedbackToast && (
        <div className="fixed top-5 right-5 z-50 bg-brand-neon text-black font-extrabold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-black/20 animate-bounce">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Top View Selector: Radar de Mineração vs Minha Biblioteca Particular */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-brand-sidebar border border-brand-border rounded-2xl p-2 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('radar')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'radar'
                ? 'bg-brand-neon text-black shadow-md shadow-brand-neon/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Radar de Clientes & Concorrentes</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('biblioteca_particular')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'biblioteca_particular'
                ? 'bg-brand-neon text-black shadow-md shadow-brand-neon/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <FolderHeart className="w-4 h-4 text-lime-400" />
            <span>📁 Minha Biblioteca Particular</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
              viewMode === 'biblioteca_particular' ? 'bg-black text-brand-neon' : 'bg-lime-400/20 text-lime-400 border border-lime-400/30'
            }`}>
              {savedSwipes.length}
            </span>
          </button>
        </div>

        <span className="text-xs text-zinc-400 px-3 hidden sm:block">
          {viewMode === 'radar' 
            ? 'Monitore concorrentes e envie criativos para sua biblioteca particular' 
            : 'Seu acervo privado de criativos minerados e salvos permanentemente'}
        </span>
      </div>

      {/* VIEW 1: RADAR DE MINERAÇÃO */}
      {viewMode === 'radar' && (
        <div className="space-y-6 animate-fadeIn">
          {/* 1. Área de Input (Monitoramento) */}
          <div className="bg-brand-card/90 border border-brand-border rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-neon" />
                Adicionar URL da Biblioteca de Anúncios p/ Monitorar Cliente
              </label>
              <form onSubmit={handleAddMonitorUrl} className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://www.facebook.com/ads/library/?..."
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-brand-neon hover:bg-brand-neonHover text-black font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-brand-neon/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 text-black stroke-[3]" />
                  <span>Monitorar Cliente</span>
                </button>
              </form>
            </div>
          </div>

          {/* 2. Grid de KPIs (6 Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex flex-col justify-between hover:border-brand-neon/40 transition-all shadow-sm group">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-zinc-400 group-hover:text-brand-neon transition-colors shrink-0" />
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight truncate">
                  Concorrentes Monitorados
                </span>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                {kpiMetrics.monitoredCompetitors}
              </div>
            </div>

            <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex flex-col justify-between hover:border-brand-neon/40 transition-all shadow-sm group">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-zinc-400 group-hover:text-brand-neon transition-colors shrink-0" />
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight truncate">
                  Criativos Totais
                </span>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                {kpiMetrics.totalCreatives}
              </div>
            </div>

            <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex flex-col justify-between hover:border-brand-neon/40 transition-all shadow-sm group">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-zinc-400 group-hover:text-brand-neon transition-colors shrink-0" />
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight truncate">
                  Novos (Últ. 7 Dias)
                </span>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                {kpiMetrics.newCreatives7Days}
              </div>
            </div>

            <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex flex-col justify-between hover:border-brand-neon/40 transition-all shadow-sm group">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-400 fill-orange-400/20 shrink-0" />
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight truncate">
                  Criativos Escalados
                </span>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                {kpiMetrics.scaledCreatives}
              </div>
            </div>

            <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex flex-col justify-between hover:border-brand-neon/40 transition-all shadow-sm group">
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className="w-4 h-4 text-zinc-400 group-hover:text-brand-neon transition-colors shrink-0" />
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight truncate">
                  Criativos em Teste
                </span>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                {kpiMetrics.testingCreatives}
              </div>
            </div>

            <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex flex-col justify-between hover:border-brand-neon/40 transition-all shadow-sm group">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-zinc-400 group-hover:text-brand-neon transition-colors shrink-0" />
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight truncate">
                  Dias Ativos Médios
                </span>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                {kpiMetrics.avgDaysTesting}
              </div>
            </div>
          </div>

          {/* 3. Pastas de Clientes Monitorados (Meta Ads Library) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-brand-neon" />
                <span>Pastas de Clientes Monitorados (Meta Ads Library)</span>
              </h3>
              <span className="text-xs text-zinc-400">
                {competitorFolders.length} {competitorFolders.length === 1 ? 'cliente monitorado' : 'clientes monitorados'}
              </span>
            </div>

            {competitorFolders.length === 0 ? (
              <div className="bg-brand-card border border-brand-border rounded-2xl p-12 text-center shadow-lg">
                <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 max-w-md mx-auto">
                  <div className="w-14 h-14 rounded-full bg-zinc-800/60 border border-zinc-700 flex items-center justify-center text-zinc-400 shadow-inner">
                    <FolderSearch className="w-7 h-7 stroke-[1.75]" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Nenhum cliente em monitoramento</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Insira a URL da Biblioteca de Anúncios do Meta Ads no campo acima para criar a pasta do cliente com todos os anúncios reais e vídeos reproduzíveis.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {competitorFolders.map((item) => (
                  <div
                    key={item.id}
                    className="bg-brand-card border border-brand-border hover:border-brand-neon/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute -top-10 -right-10 w-28 h-28 bg-brand-neon/5 rounded-full blur-2xl group-hover:bg-brand-neon/15 transition-all" />

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.competitor.avatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80"}
                          alt={item.competitor.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700 shadow-md group-hover:border-brand-neon transition-colors shrink-0"
                        />
                        <div>
                          <h4 className="font-extrabold text-white text-sm group-hover:text-brand-neon transition-colors flex items-center gap-1.5">
                            {item.competitor.name}
                          </h4>
                          <span className="text-xs text-zinc-400 block">
                            {item.competitor.category || 'Empreendedor(a)'}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                            ID: {item.competitor.facebookId}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleRemoveCompetitorFolder(item.id, item.competitor.name, e)}
                        className="text-zinc-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Remover pasta de cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-brand-border/60 text-center">
                      <div className="bg-brand-sidebar/80 rounded-lg p-1.5">
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">Total</span>
                        <span className="text-xs font-black text-white">~36 ads</span>
                      </div>
                      <div className="bg-brand-sidebar/80 rounded-lg p-1.5">
                        <span className="text-[10px] text-orange-400 block uppercase font-bold">Escalados</span>
                        <span className="text-xs font-black text-orange-400">15</span>
                      </div>
                      <div className="bg-brand-sidebar/80 rounded-lg p-1.5">
                        <span className="text-[10px] text-zinc-400 block uppercase font-bold">Em Teste</span>
                        <span className="text-xs font-black text-zinc-300">21</span>
                      </div>
                    </div>

                    {/* Botões do Card */}
                    <div className="space-y-2 pt-1">
                      {/* Botão 1: Abrir Biblioteca Meta Ads */}
                      <button
                        type="button"
                        onClick={() => setActiveLibraryCompetitor(item.competitor)}
                        className="w-full bg-brand-neon hover:bg-brand-neonHover text-black font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-brand-neon/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Abrir Biblioteca Meta Ads</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Botão 2: Enviar para Minha Biblioteca Particular (Swipe) */}
                      {(() => {
                        const competitorAds = allKnownAds;
                        const savedInThisCompetitor = competitorAds.filter(a => savedSwipes.includes(a.id)).length;
                        const isAllSaved = savedInThisCompetitor === competitorAds.length && competitorAds.length > 0;

                        return (
                          <button
                            type="button"
                            onClick={(e) => handleSaveAllCompetitorAdsToSwipe(item.competitor.name, e)}
                            className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                              isAllSaved
                                ? 'bg-lime-400/15 border border-lime-400 text-lime-400 shadow-md shadow-lime-400/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                                : savedInThisCompetitor > 0
                                ? 'bg-zinc-800 border border-lime-400/50 text-lime-300 hover:bg-lime-400 hover:text-black'
                                : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 shadow-sm'
                            }`}
                            title="Salvar todos os anúncios deste cliente na sua Biblioteca Particular"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${savedInThisCompetitor > 0 ? 'fill-lime-400 text-lime-400' : 'text-zinc-400'}`} />
                            <span>
                              {isAllSaved 
                                ? `📁 Salvo na Biblioteca Particular (${savedInThisCompetitor} ads - Remover)` 
                                : savedInThisCompetitor > 0
                                ? `📁 Salvar na Biblioteca (${savedInThisCompetitor}/${competitorAds.length} salvos)`
                                : '📁 Enviar para Minha Biblioteca Particular'}
                            </span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: MINHA BIBLIOTECA PARTICULAR (SWIPE FILE COMPLETO) */}
      {(viewMode === 'biblioteca_particular' || viewMode === 'radar') && (
        <div className="space-y-5 pt-6 border-t border-brand-border/80">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 shadow-sm">
                <Bookmark className="w-5 h-5 fill-lime-400 text-lime-400" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Minha Biblioteca Particular (Swipe File)</span>
                  <span className="text-xs bg-lime-400 text-black font-black px-2 py-0.5 rounded-full">
                    {savedSwipes.length} salvos
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Seu repositório particular permanente de criativos minerados, modelos de alta conversão, copies e vídeos prontos para download.
                </p>
              </div>
            </div>

            {/* Toolbar: Search and Filter inside Private Library */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar na minha biblioteca..."
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="w-full bg-brand-card border border-brand-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon"
                />
              </div>

              <div className="flex items-center gap-1 bg-brand-card border border-brand-border rounded-xl p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setLibraryMediaType('ALL')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    libraryMediaType === 'ALL' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryMediaType('video')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    libraryMediaType === 'video' ? 'bg-zinc-800 text-brand-neon' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Vídeos
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryMediaType('image')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    libraryMediaType === 'image' ? 'bg-zinc-800 text-brand-neon' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Imagens
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Criativos da Minha Biblioteca Particular */}
          {savedAdsList.length === 0 ? (
            <div className="bg-brand-card border border-brand-border rounded-2xl p-12 text-center shadow-lg">
              <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-zinc-800/60 border border-zinc-700 flex items-center justify-center text-zinc-400">
                  <Bookmark className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Nenhum criativo salvo na sua biblioteca</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Clique no botão <strong>"📁 Enviar para Minha Biblioteca Particular"</strong> em qualquer cliente acima ou em <strong>SAVE</strong> na visualização da Meta Ads Library para salvar criativos aqui.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {savedAdsList.map((ad) => {
                const isPlaying = playingCardId === ad.id;

                return (
                  <div
                    key={ad.id}
                    className="bg-brand-card border border-brand-border hover:border-zinc-600 rounded-2xl p-4 flex flex-col justify-between space-y-3.5 shadow-xl transition-all group"
                  >
                    {/* Card Meta Header */}
                    <div className="space-y-2 border-b border-brand-border/70 pb-3">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500/20 text-emerald-400" />
                          <span>{ad.status}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">ID: {ad.libraryId}</span>
                      </div>

                      <div className="text-[11px] text-zinc-400">
                        Início: {ad.startDate}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setPlayingVideoAd(ad)}
                          className="w-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold py-1.5 rounded-xl border border-zinc-700 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Ver detalhes & Vídeo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleSwipe(ad.id)}
                          className="w-full py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer bg-lime-400/15 border border-lime-400 text-lime-400 shadow-md shadow-lime-400/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                          title="Remover da Minha Biblioteca Particular"
                        >
                          <Bookmark className="w-3.5 h-3.5 fill-lime-400 text-lime-400" />
                          <span>SALVO (Remover ✕)</span>
                        </button>
                      </div>
                    </div>

                    {/* Ad Post Body */}
                    <div className="bg-brand-sidebar border border-brand-border/80 rounded-xl p-3 space-y-2 text-xs flex-1 flex flex-col justify-between">
                      <p className="text-[11px] text-zinc-300 leading-relaxed line-clamp-2 select-text">
                        {ad.adCopy}
                      </p>

                      {/* Video / Image Box with Real Streaming */}
                      <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/5] border border-zinc-800 flex items-center justify-center group/media">
                        {ad.mediaType === 'video' && ad.videoUrl && isPlaying ? (
                          <video
                            src={ad.videoUrl}
                            poster={ad.thumbnailUrl}
                            controls
                            autoPlay
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            <img
                              src={ad.thumbnailUrl}
                              alt="Creative Preview"
                              className="w-full h-full object-cover opacity-90 group-hover/media:opacity-100 transition-opacity"
                            />

                            {ad.mediaType === 'video' && (
                              <button
                                type="button"
                                onClick={() => setPlayingCardId(prev => (prev === ad.id ? null : ad.id))}
                                className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer"
                                title="Reproduzir vídeo"
                              >
                                <div className="w-11 h-11 rounded-full bg-black/80 border border-white/40 flex items-center justify-center backdrop-blur-xs group-hover/media:scale-110 group-hover/media:border-brand-neon transition-all shadow-xl">
                                  <Play className="w-5 h-5 text-brand-neon fill-brand-neon ml-0.5" />
                                </div>
                              </button>
                            )}
                          </>
                        )}

                        {/* Download Floating Overlay Button */}
                        <a
                          href={ad.videoUrl || ad.thumbnailUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg transition-colors cursor-pointer z-10"
                          title="Baixar criativo original em MP4"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download MP4</span>
                        </a>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-400">
                        <span className="font-mono truncate">{ad.targetDomain}</span>
                        <span className="font-bold text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded">
                          {ad.ctaText}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalhes e Player de Vídeo em Alta Resolução */}
      {playingVideoAd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPlayingVideoAd(null)}
        >
          <div
            className="bg-brand-sidebar border border-brand-border rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl text-white p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Anúncio Ativo</span>
                </div>
                <span className="text-xs text-zinc-400 font-mono">
                  ID da Biblioteca: {playingVideoAd.libraryId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPlayingVideoAd(null)}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/5] border border-zinc-800 flex items-center justify-center shadow-xl">
                {playingVideoAd.mediaType === 'video' && playingVideoAd.videoUrl ? (
                  <video
                    src={playingVideoAd.videoUrl}
                    poster={playingVideoAd.thumbnailUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={playingVideoAd.thumbnailUrl}
                    alt="Full Media Preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="bg-brand-card border border-brand-border rounded-xl p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-brand-neon">Texto do Anúncio (Copy)</span>
                    <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line select-text">
                      {playingVideoAd.adCopy}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-brand-card/70 border border-brand-border rounded-xl p-3">
                      <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Formato</span>
                      <span className="font-bold text-white uppercase">{playingVideoAd.mediaType}</span>
                    </div>
                    <div className="bg-brand-card/70 border border-brand-border rounded-xl p-3">
                      <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Classificação</span>
                      <span className={`font-bold ${playingVideoAd.classification === 'ESCALADO' ? 'text-orange-400' : 'text-zinc-300'}`}>
                        {playingVideoAd.classification}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-brand-border">
                  <button
                    type="button"
                    onClick={() => handleToggleSwipe(playingVideoAd.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      savedSwipes.includes(playingVideoAd.id)
                        ? 'bg-lime-400/15 border border-lime-400 text-lime-400 shadow-md'
                        : 'bg-brand-neon hover:bg-brand-neonHover text-black font-extrabold shadow-md shadow-brand-neon/20'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${savedSwipes.includes(playingVideoAd.id) ? 'fill-lime-400' : 'fill-black'}`} />
                    <span>{savedSwipes.includes(playingVideoAd.id) ? 'SALVO NA MINHA BIBLIOTECA' : 'SALVAR NA MINHA BIBLIOTECA'}</span>
                  </button>

                  <a
                    href={playingVideoAd.videoUrl || playingVideoAd.thumbnailUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Vídeo (MP4)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transparência da Página */}
      {selectedCompetitor && (
        <CompetitorTransparencyModal
          competitor={selectedCompetitor}
          onClose={() => setSelectedCompetitor(null)}
        />
      )}
    </div>
  );
};

// Sub-component: Competitor Transparency Modal
export const CompetitorTransparencyModal: React.FC<{
  competitor: CompetitorDetails;
  onClose: () => void;
}> = ({ competitor, onClose }) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-brand-sidebar border border-brand-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleUp text-white flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-brand-border/80 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={competitor.avatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80"} 
                alt={competitor.name}
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-700/60 shadow-md"
              />
              <div className="flex flex-col">
                <h3 className="text-white font-bold text-sm tracking-tight">
                  {competitor.name}
                </h3>
                <span className="text-gray-400 text-xs">
                  {competitor.category || 'Empreendedor(a)'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-6 border-b border-zinc-800 -mb-5 pt-1">
            <button 
              type="button" 
              className="text-xs font-semibold text-zinc-400 hover:text-white pb-3 transition-colors cursor-pointer"
            >
              Anúncios
            </button>
            <button 
              type="button" 
              className="text-xs font-bold text-brand-neon pb-3 border-b-2 border-brand-neon flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Sobre</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-zinc-300">
              Sobre o anunciante
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Com o objetivo de aumentar a responsabilidade e a transparência, a Meta está compartilhando mais informações sobre as Páginas e as pessoas que as administram.{' '}
              <a 
                href="https://www.facebook.com/ads/about/" 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-400 hover:underline inline-flex items-center gap-0.5 font-medium"
              >
                Saiba mais sobre transparência.
              </a>
            </p>
          </div>

          <div className="bg-brand-card/90 border border-brand-border rounded-xl p-5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                Transparência da Página
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                {competitor.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                  Páginas e contas
                </span>

                <div className="flex items-start gap-2.5">
                  <FacebookIcon />
                  <div className="flex flex-col text-xs">
                    <span className="text-zinc-200 font-medium">
                      Identificação: <span className="font-mono text-zinc-300">{competitor.facebookId}</span>
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {competitor.facebookFollowers} • {competitor.facebookCategory}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <InstagramIcon />
                  <div className="flex flex-col text-xs">
                    <span className="text-zinc-200 font-medium font-mono">
                      {competitor.instagramHandle}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {competitor.instagramFollowers}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                    Histórico da Página
                  </span>
                  <Info className="w-3.5 h-3.5 text-zinc-500" />
                </div>

                <div className="space-y-2 text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <GitMerge className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Mesclada com outras {competitor.mergedPagesCount} Páginas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Nome da Página alterado {competitor.nameChangedCount} vezes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Página criada em {competitor.creationDate}</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                    Organizações que gerenciam esta Página
                  </span>
                  <Info className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <p className="text-xs text-zinc-400">
                  {competitor.organizations}
                </p>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                    Pessoas que gerenciam esta Página
                  </span>
                  <Info className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-300">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <span>
                    País de localização principal das pessoas que gerenciam essa Página:{' '}
                    <strong className="text-white font-semibold">{competitor.primaryLocation}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-brand-border/80 bg-brand-sidebar/50">
          <a
            href={competitor.pageUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold py-2.5 rounded-xl border border-zinc-700 transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer shadow-sm"
          >
            <span>Ir para a Página Oficial</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default MiningView;
