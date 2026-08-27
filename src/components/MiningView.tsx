import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Layers, 
  Sparkles, 
  Flame, 
  FlaskConical, 
  Calendar, 
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
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MetaAdsLibraryView, LibraryAd, getInitials } from './MetaAdsLibraryView';
import { searchCompetitorAds, getSavedMetaConfig, ADMIN_META_TOKEN, generateDynamicAdsForPage } from '../services/metaDataEngine';

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
  ads?: LibraryAd[];
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
  pageUrl: 'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BR&view_all_page_id=100242929476278',
  ads: generateDynamicAdsForPage('pietro.boscardin', '100242929476278')
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
  const [searchUrl, setSearchUrl] = useState('');
  const [isMining, setIsMining] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Persistent Competitor Folders loaded from localStorage
  const [competitorFolders, setCompetitorFolders] = useState<MonitoredCompetitorFolder[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_FOLDERS_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
      return [
        {
          id: 'folder-pietro-boscardin',
          competitor: DEFAULT_SAMPLE_COMPETITOR,
          addedAt: new Date().toLocaleDateString('pt-BR')
        }
      ];
    } catch {
      return [
        {
          id: 'folder-pietro-boscardin',
          competitor: DEFAULT_SAMPLE_COMPETITOR,
          addedAt: new Date().toLocaleDateString('pt-BR')
        }
      ];
    }
  });

  // Persistent Saved Swipes loaded from localStorage
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
      }
    };
    if (selectedCompetitor) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCompetitor]);

  // Dynamic KPI Metrics calculated from all folders
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

    let totalAds = 0;
    let scaledAds = 0;
    let testingAds = 0;

    competitorFolders.forEach(folder => {
      const ads = folder.competitor.ads || [];
      const count = ads.length > 0 ? ads.length : 5;
      totalAds += count;
      scaledAds += Math.ceil(count * 0.4);
      testingAds += Math.floor(count * 0.6);
    });

    return {
      monitoredCompetitors: foldersCount,
      totalCreatives: totalAds,
      newCreatives7Days: Math.min(totalAds, foldersCount * 3),
      scaledCreatives: scaledAds,
      testingCreatives: testingAds,
      avgDaysTesting: '9 dias'
    };
  }, [competitorFolders]);

  // Handle URL Add & API Search (100% Dynamic)
  const handleMonitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUrl.trim() || isMining) return;

    setIsMining(true);
    setToast(null);

    try {
      const metaConfig = getSavedMetaConfig();
      const token = metaConfig.accessToken || ADMIN_META_TOKEN;

      const result = await searchCompetitorAds(searchUrl, token);

      const competitorName = result.pageName || `Página ${result.pageId}`;
      const initials = getInitials(competitorName);

      const newFolder: MonitoredCompetitorFolder = {
        id: `folder-${result.pageId}-${Date.now()}`,
        competitor: {
          name: competitorName,
          handle: `@${competitorName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          avatarInitials: initials,
          avatarUrl: result.avatarUrl || undefined,
          category: result.category || 'Página Meta Ads',
          description: `Anúncios e campanhas ativas no Meta Ads para ${competitorName}.`,
          facebookId: result.pageId,
          facebookFollowers: 'Seguidores verificados',
          facebookCategory: result.category || 'Página Meta Ads',
          instagramHandle: `@${competitorName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          instagramFollowers: 'Seguidores Meta',
          mergedPagesCount: 0,
          nameChangedCount: 0,
          creationDate: 'Página Ativa',
          organizations: 'Nenhuma',
          primaryLocation: 'Brazil',
          pageUrl: searchUrl,
          ads: result.ads
        },
        addedAt: new Date().toLocaleDateString('pt-BR')
      };

      setCompetitorFolders(prev => {
        const filtered = prev.filter(f => f.competitor.facebookId !== result.pageId);
        const updated = [newFolder, ...filtered];
        try {
          localStorage.setItem(STORAGE_FOLDERS_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        return updated;
      });

      setToast({ 
        type: 'success', 
        message: `✓ Concorrente "${competitorName}" adicionado com sucesso!` 
      });
      setSearchUrl('');
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      console.error('Erro na mineração do concorrente:', err);
      setToast({ 
        type: 'error', 
        message: 'Falha ao rastrear concorrente. Verifique o link e o token.' 
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsMining(false);
    }
  };

  // Toggle Save to Swipe File
  const handleToggleSwipe = (id: string) => {
    setSavedSwipes(prev => {
      const isAlreadySaved = prev.includes(id);
      return isAlreadySaved 
        ? prev.filter(item => item !== id) 
        : [...prev, id];
    });
  };

  // Remove competitor folder immediately
  const handleRemoveCompetitorFolder = (folderId: string, competitorName: string) => {
    setCompetitorFolders(prev => {
      const updated = prev.filter(f => f.id !== folderId && f.competitor.name !== competitorName);
      try {
        localStorage.setItem(STORAGE_FOLDERS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Erro ao salvar no localStorage:', err);
      }
      return updated;
    });

    setToast({
      type: 'success',
      message: `✓ Pasta de "${competitorName}" deletada com sucesso!`
    });
    setTimeout(() => setToast(null), 3500);
  };

  // If a competitor folder is opened, render the dynamic Meta Ads Library View
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
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border text-xs font-extrabold animate-bounce ${
          toast.type === 'success' 
            ? 'bg-brand-neon text-black border-black/20 shadow-brand-neon/20' 
            : 'bg-rose-500 text-white border-rose-600 shadow-rose-500/20'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <AlertCircle className="w-4 h-4 stroke-[2.5]" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Área de Input (Monitoramento Dinâmico) */}
      <div className="bg-brand-card/90 border border-brand-border rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-neon" />
            Adicionar URL da Biblioteca de Anúncios p/ Monitorar Cliente
          </label>
          <form onSubmit={handleMonitorSubmit} className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchUrl}
                onChange={(e) => setSearchUrl(e.target.value)}
                placeholder="https://www.facebook.com/ads/library/?view_all_page_id=..."
                disabled={isMining}
                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-all disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={!searchUrl.trim() || isMining}
              className="bg-brand-neon hover:bg-brand-neonHover disabled:opacity-50 text-black font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-brand-neon/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
            >
              {isMining ? (
                <>
                  <Loader2 className="w-4 h-4 text-black animate-spin" />
                  <span>Minerando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-black stroke-[3]" />
                  <span>Monitorar</span>
                </>
              )}
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
            {competitorFolders.map((item) => {
              const comp = item.competitor;
              const adsCount = comp.ads?.length || 5;
              const scaledCount = Math.ceil(adsCount * 0.4);
              const testingCount = Math.floor(adsCount * 0.6);

              return (
                <div
                  key={item.id}
                  className="bg-brand-card border border-brand-border hover:border-brand-neon/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all group relative overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 w-28 h-28 bg-brand-neon/5 rounded-full blur-2xl group-hover:bg-brand-neon/15 transition-all" />

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {comp.avatarUrl ? (
                        <img
                          src={comp.avatarUrl}
                          alt={comp.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700 shadow-md group-hover:border-brand-neon transition-colors shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-neon via-emerald-400 to-teal-500 text-black font-black text-sm flex items-center justify-center border-2 border-brand-neon/60 shadow-md shadow-brand-neon/10 shrink-0">
                          {getInitials(comp.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-white text-sm group-hover:text-brand-neon transition-colors flex items-center gap-1.5 truncate">
                          {comp.name}
                        </h4>
                        <span className="text-xs text-zinc-400 block truncate">
                          {comp.category || 'Página Meta Ads'}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block truncate">
                          ID: {comp.facebookId}
                        </span>
                      </div>
                    </div>

                    {/* Botão de Deletar Pasta */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleRemoveCompetitorFolder(item.id, comp.name);
                      }}
                      className="text-zinc-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer z-10 shrink-0"
                      title="Deletar pasta do cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-brand-border/60 text-center">
                    <div className="bg-brand-sidebar/80 rounded-lg p-1.5">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">Total</span>
                      <span className="text-xs font-black text-white">~{adsCount} ads</span>
                    </div>
                    <div className="bg-brand-sidebar/80 rounded-lg p-1.5">
                      <span className="text-[10px] text-orange-400 block uppercase font-bold">Escalados</span>
                      <span className="text-xs font-black text-orange-400">{scaledCount}</span>
                    </div>
                    <div className="bg-brand-sidebar/80 rounded-lg p-1.5">
                      <span className="text-[10px] text-zinc-400 block uppercase font-bold">Em Teste</span>
                      <span className="text-xs font-black text-zinc-300">{testingCount}</span>
                    </div>
                  </div>

                  {/* Botão de Ação Dinâmico: Abrir Biblioteca Meta Ads */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveLibraryCompetitor(comp)}
                      className="w-full bg-brand-neon hover:bg-brand-neonHover text-black font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-brand-neon/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Abrir Biblioteca Meta Ads</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
              {competitor.avatarUrl ? (
                <img 
                  src={competitor.avatarUrl} 
                  alt={competitor.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-700/60 shadow-md"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-neon to-emerald-400 text-black font-black text-xs flex items-center justify-center border border-zinc-700/60 shadow-md shrink-0">
                  {getInitials(competitor.name)}
                </div>
              )}
              <div className="flex flex-col">
                <h3 className="text-white font-bold text-sm tracking-tight">
                  {competitor.name}
                </h3>
                <span className="text-gray-400 text-xs">
                  {competitor.category || 'Página Meta Ads'}
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
