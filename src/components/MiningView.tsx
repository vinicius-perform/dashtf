import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Layers, 
  Sparkles, 
  Flame, 
  FlaskConical, 
  Calendar, 
  Play, 
  Image as ImageIcon, 
  Copy, 
  Bookmark, 
  Check, 
  Search, 
  Plus, 
  FolderSearch, 
  X, 
  Info, 
  ExternalLink, 
  GitMerge, 
  RotateCcw, 
  MapPin, 
  Folder, 
  FolderOpen, 
  ChevronRight,
  Eye
} from 'lucide-react';
import { MetaAdsLibraryView } from './MetaAdsLibraryView';

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

export interface MonitoredCreative {
  id: string;
  adTitle: string;
  adType: 'video' | 'image';
  videoDuration?: string;
  competitor: CompetitorDetails;
  daysActive: number;
  startDate: string;
  platforms: ('facebook' | 'instagram')[];
  classification: 'ESCALADO' | 'TESTE';
  adUrl: string;
}

const DEFAULT_SAMPLE_COMPETITOR: CompetitorDetails = {
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

// SVG Icons for Platforms
const FacebookIcon = () => (
  <div className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center shadow-sm shrink-0" title="Facebook">
    <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  </div>
);

const InstagramIcon = () => (
  <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] flex items-center justify-center shadow-sm shrink-0" title="Instagram">
    <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  </div>
);

export const MiningView: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [minedAds, setMinedAds] = useState<MonitoredCreative[]>([]);
  const [activeTab, setActiveTab] = useState<'acompanhamento' | 'escalados' | 'tempo_ativo'>('acompanhamento');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedSwipes, setSavedSwipes] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorDetails | null>(null);
  const [activeLibraryCompetitor, setActiveLibraryCompetitor] = useState<CompetitorDetails | null>(null);

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

  // Unique Competitor Profiles / Folders
  const competitorFolders = useMemo(() => {
    const map = new Map<string, { competitor: CompetitorDetails; adsCount: number; scaledCount: number; testingCount: number }>();
    for (const item of minedAds) {
      const key = item.competitor.name.toLowerCase();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          competitor: item.competitor,
          adsCount: 36, // Total ads in library mock
          scaledCount: item.classification === 'ESCALADO' ? 15 : 12,
          testingCount: item.classification === 'TESTE' ? 21 : 24
        });
      } else {
        existing.adsCount += 1;
        if (item.classification === 'ESCALADO') existing.scaledCount += 1;
        if (item.classification === 'TESTE') existing.testingCount += 1;
      }
    }
    return Array.from(map.values());
  }, [minedAds]);

  // Dynamic KPI Metrics calculated from state
  const kpiMetrics = useMemo(() => {
    const totalCount = minedAds.length;
    if (totalCount === 0) {
      return {
        monitoredCompetitors: 0,
        totalCreatives: 0,
        newCreatives7Days: 0,
        scaledCreatives: 0,
        testingCreatives: 0,
        avgDaysTesting: '-- dias'
      };
    }

    const uniqueCompetitors = new Set(minedAds.map(ad => ad.competitor.name.trim().toLowerCase())).size;
    const new7Days = minedAds.filter(ad => ad.daysActive <= 7).length;
    const scaled = minedAds.filter(ad => ad.classification === 'ESCALADO').length;
    const testingAds = minedAds.filter(ad => ad.classification === 'TESTE');
    const testingCount = testingAds.length;

    let avgDays = '-- dias';
    if (testingCount > 0) {
      const sumDays = testingAds.reduce((acc, ad) => acc + (ad.daysActive || 0), 0);
      avgDays = `${Math.round(sumDays / testingCount)} dias`;
    }

    return {
      monitoredCompetitors: uniqueCompetitors,
      totalCreatives: totalCount,
      newCreatives7Days: new7Days,
      scaledCreatives: scaled,
      testingCreatives: testingCount,
      avgDaysTesting: avgDays
    };
  }, [minedAds]);

  // Handle URL Add (Creates client profile folder & library)
  const handleAddMonitorUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    // Simulate extracting competitor name from URL or fallback to pietro.boscardin
    const newEntry: MonitoredCreative = {
      id: `ad-${Date.now()}`,
      adTitle: `[NOVO] Anúncio em Monitoramento - ${urlInput.slice(0, 26)}...`,
      adType: 'video',
      videoDuration: '0:30',
      competitor: {
        ...DEFAULT_SAMPLE_COMPETITOR,
        name: 'pietro.boscardin',
        pageUrl: urlInput
      },
      daysActive: 1,
      startDate: new Date().toLocaleDateString('pt-BR'),
      platforms: ['facebook', 'instagram'],
      classification: 'TESTE',
      adUrl: urlInput
    };

    setMinedAds(prev => [newEntry, ...prev]);
    setUrlInput('');
  };

  // Copy Ad link handler
  const handleCopyLink = (ad: MonitoredCreative) => {
    navigator.clipboard.writeText(ad.adUrl);
    setCopiedId(ad.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle Save to Swipe File
  const handleToggleSwipe = (id: string) => {
    setSavedSwipes(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  // Filtered creatives according to active tab & search
  const filteredCreatives = useMemo(() => {
    return minedAds.filter(c => {
      // Tab filter
      if (activeTab === 'escalados' && c.classification !== 'ESCALADO') return false;
      if (activeTab === 'tempo_ativo' && c.daysActive < 10) return false;

      // Text search
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        const matchTitle = c.adTitle.toLowerCase().includes(query);
        const matchComp = c.competitor.name.toLowerCase().includes(query);
        if (!matchTitle && !matchComp) return false;
      }
      return true;
    });
  }, [minedAds, activeTab, searchFilter]);

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
      {/* 4. Área de Input (Monitoramento) */}
      <div className="bg-brand-card/90 border border-brand-border rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-neon" />
            Adicionar URL da Biblioteca de Anúncios p/ Criar Pasta de Monitoramento
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

      {/* 5. Grid de KPIs (6 Cards - Dinâmicos e Zerados por Padrão) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Concorrentes Monitorados */}
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

        {/* Card 2: Criativos Totais */}
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

        {/* Card 3: Novos Criativos (Últ. 7 Dias) */}
        <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex flex-col justify-between hover:border-brand-neon/40 transition-all shadow-sm group">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-zinc-400 group-hover:text-brand-neon transition-colors shrink-0" />
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight truncate">
              Novos Criativos (Últ. 7 Dias)
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {kpiMetrics.newCreatives7Days}
          </div>
        </div>

        {/* Card 4: Criativos Escalados */}
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

        {/* Card 5: Criativos em Teste */}
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

        {/* Card 6: Dias Ativos Médios (Testes) */}
        <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex flex-col justify-between hover:border-brand-neon/40 transition-all shadow-sm group">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-zinc-400 group-hover:text-brand-neon transition-colors shrink-0" />
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight truncate">
              Dias Ativos Médios (Testes)
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {kpiMetrics.avgDaysTesting}
          </div>
        </div>
      </div>

      {/* 5.b Perfis e Pastas de Clientes / Concorrentes Monitorados */}
      {competitorFolders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-brand-neon" />
              <span>Pastas de Clientes Monitorados (Meta Ads Library)</span>
            </h3>
            <span className="text-xs text-zinc-400">
              Clique para abrir a biblioteca completa do cliente
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitorFolders.map((item) => (
              <div
                key={item.competitor.name}
                className="bg-brand-card border border-brand-border hover:border-brand-neon/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all group relative overflow-hidden"
              >
                {/* Decorative glow */}
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

                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Ativo
                  </span>
                </div>

                {/* Quick metrics inside folder card */}
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

                {/* Primary Button to Open Full Meta Ads Library */}
                <button
                  type="button"
                  onClick={() => setActiveLibraryCompetitor(item.competitor)}
                  className="w-full bg-brand-neon hover:bg-brand-neonHover text-black font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-brand-neon/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Eye className="w-4 h-4" />
                  <span>Abrir Biblioteca Meta Ads</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Sub-menu de Abas (Tabs) & Barra de Ferramentas */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          {/* Aba 1: Acompanhamento de Criativos */}
          <button
            onClick={() => setActiveTab('acompanhamento')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'acompanhamento'
                ? 'border border-brand-neon text-brand-neon bg-brand-neon/10 shadow-sm shadow-brand-neon/10'
                : 'border border-brand-border bg-brand-card text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            Acompanhamento de Criativos
          </button>

          {/* Aba 2: 🔥 Anúncios Escalados */}
          <button
            onClick={() => setActiveTab('escalados')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'escalados'
                ? 'border border-brand-neon text-brand-neon bg-brand-neon/10 shadow-sm shadow-brand-neon/10'
                : 'border border-brand-border bg-brand-card text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            🔥 Anúncios Escalados
          </button>

          {/* Aba 3: 📈 Tempo Ativo */}
          <button
            onClick={() => setActiveTab('tempo_ativo')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tempo_ativo'
                ? 'border border-brand-neon text-brand-neon bg-brand-neon/10 shadow-sm shadow-brand-neon/10'
                : 'border border-brand-border bg-brand-card text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            📈 Tempo Ativo
          </button>
        </div>

        {/* Search Input for Table */}
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Filtrar por anúncio ou concorrente..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-brand-card border border-brand-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-all"
          />
        </div>
      </div>

      {/* 7. Tabela de Mineração (Swipe File) */}
      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-brand-sidebar border-b border-brand-border text-[11px] font-bold text-brand-textMuted uppercase tracking-wider">
                <th className="py-3.5 px-5">ANÚNCIO</th>
                <th className="py-3.5 px-4">CONCORRENTE</th>
                <th className="py-3.5 px-4 text-center">DIAS ATIVO</th>
                <th className="py-3.5 px-4 text-center">DATA DE INÍCIO</th>
                <th className="py-3.5 px-4 text-center">PLATAFORMA</th>
                <th className="py-3.5 px-4 text-center">CLASSIFICAÇÃO</th>
                <th className="py-3.5 px-5 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60 text-xs text-zinc-200">
              {/* Empty State when no ads exist */}
              {minedAds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 max-w-md mx-auto">
                      <div className="w-12 h-12 rounded-full bg-zinc-800/60 border border-zinc-700 flex items-center justify-center text-zinc-400 shadow-inner">
                        <FolderSearch className="w-6 h-6 stroke-[1.75]" />
                      </div>
                      <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                        Nenhum criativo em monitoramento. Insira a URL da Biblioteca de Anúncios de um concorrente acima para começar a rastrear.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredCreatives.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-500 text-xs">
                    Nenhum criativo encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredCreatives.map((creative) => {
                  const isSaved = savedSwipes.includes(creative.id);
                  const isCopied = copiedId === creative.id;

                  return (
                    <tr 
                      key={creative.id} 
                      className="hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* ANÚNCIO (Thumbnail + Descrição) */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          {creative.adType === 'video' ? (
                            <div className="w-14 h-14 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center relative shrink-0 overflow-hidden shadow-inner group-hover:border-brand-neon/40 transition-colors">
                              <div className="w-6 h-6 rounded-full bg-zinc-800/90 border border-zinc-700 flex items-center justify-center">
                                <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                              </div>
                              {creative.videoDuration && (
                                <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/80 px-1 rounded text-zinc-300 font-semibold">
                                  {creative.videoDuration}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative shrink-0 overflow-hidden shadow-inner group-hover:border-brand-neon/40 transition-colors">
                              <ImageIcon className="w-6 h-6 text-zinc-500" />
                            </div>
                          )}

                          <div className="flex flex-col min-w-0 max-w-sm">
                            <span className="font-bold text-white text-xs truncate group-hover:text-brand-neon transition-colors" title={creative.adTitle}>
                              {creative.adTitle}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono mt-0.5 flex items-center gap-1.5">
                              <span className="uppercase text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 font-semibold">
                                {creative.adType === 'video' ? 'Vídeo' : 'Imagem'}
                              </span>
                              ID: {creative.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CONCORRENTE (Clique para abrir a Biblioteca Meta Ads) */}
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => setActiveLibraryCompetitor(creative.competitor)}
                          className="flex items-center gap-3 cursor-pointer hover:bg-zinc-800/80 transition-colors rounded-lg p-1.5 -ml-1.5 text-left group/comp max-w-full"
                          title="Clique para abrir a Biblioteca de Anúncios Meta deste cliente"
                        >
                          <img 
                            src={creative.competitor.avatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80"} 
                            alt={creative.competitor.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-700/60 shadow-sm group-hover/comp:border-brand-neon/60 transition-colors"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-white font-bold text-sm truncate group-hover/comp:text-brand-neon transition-colors flex items-center gap-1">
                              {creative.competitor.name}
                              <ExternalLink className="w-3 h-3 text-zinc-500 group-hover/comp:text-brand-neon" />
                            </span>
                            <span className="text-gray-400 text-xs truncate">
                              {creative.competitor.category || 'Empreendedor(a)'}
                            </span>
                          </div>
                        </button>
                      </td>

                      {/* DIAS ATIVO */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-xs font-semibold text-zinc-200">
                          Há {creative.daysActive} Dias
                        </span>
                      </td>

                      {/* DATA DE INÍCIO */}
                      <td className="py-4 px-4 text-center font-mono text-xs text-zinc-300">
                        {creative.startDate}
                      </td>

                      {/* PLATAFORMA */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {creative.platforms.includes('facebook') && <FacebookIcon />}
                          {creative.platforms.includes('instagram') && <InstagramIcon />}
                        </div>
                      </td>

                      {/* CLASSIFICAÇÃO */}
                      <td className="py-4 px-4 text-center">
                        {creative.classification === 'ESCALADO' ? (
                          <span className="inline-flex items-center gap-1 bg-brand-neon text-black font-extrabold text-xs px-3 py-1 rounded-full shadow-md shadow-brand-neon/20">
                            <Flame className="w-3.5 h-3.5 fill-black text-black" />
                            <span>Escalado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-zinc-800/70 border border-zinc-700 text-zinc-400 font-medium text-xs px-3 py-1 rounded-full">
                            <span>Em Teste</span>
                          </span>
                        )}
                      </td>

                      {/* AÇÕES (Botões empilhados) */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {/* Open Meta Ads Library */}
                          <button
                            type="button"
                            onClick={() => setActiveLibraryCompetitor(creative.competitor)}
                            className="w-36 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg border border-brand-neon/50 bg-brand-neon/10 hover:bg-brand-neon hover:text-black text-brand-neon text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                            title="Abrir Biblioteca Meta Ads do Cliente"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Abrir Biblioteca</span>
                          </button>

                          {/* Copy Ad Link */}
                          <button
                            onClick={() => handleCopyLink(creative)}
                            className={`w-36 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                              isCopied
                                ? 'border-brand-neon bg-brand-neon/15 text-brand-neon'
                                : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/60 hover:border-zinc-500 text-zinc-200'
                            }`}
                            title="Copiar Link da Biblioteca de Anúncios"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-brand-neon" />
                                <span className="font-bold">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-zinc-400" />
                                <span>🔗 Copy Ad Link</span>
                              </>
                            )}
                          </button>

                          {/* Save to Swipe File */}
                          <button
                            type="button"
                            onClick={() => handleToggleSwipe(creative.id)}
                            className={`w-36 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                              isSaved
                                ? 'border-lime-400 bg-lime-400/10 text-lime-400 font-bold shadow-sm shadow-lime-400/10'
                                : 'border-gray-700 bg-transparent hover:bg-zinc-800/60 hover:border-zinc-500 text-zinc-300'
                            }`}
                            title={isSaved ? "Remover do Swipe File" : "Salvar no Swipe File"}
                          >
                            <Bookmark 
                              className={`w-3.5 h-3.5 transition-colors ${
                                isSaved ? 'text-lime-400 fill-lime-400' : 'text-zinc-400'
                              }`} 
                            />
                            <span>{isSaved ? '💾 Salvo no Swipe' : '💾 Save to Swipe File'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
const CompetitorTransparencyModal: React.FC<{
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
        {/* Modal Header */}
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

          {/* Mini-abas: Anúncios & Sobre */}
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

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Sobre o Anunciante info text */}
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

          {/* Seção Principal: Transparência da Página */}
          <div className="bg-brand-card/90 border border-brand-border rounded-xl p-5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                Transparência da Página
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                {competitor.description}
              </p>
            </div>

            {/* Grid de Informações (2 Colunas Desktop / 1 Coluna Mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {/* Card 1: Páginas e contas */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                  Páginas e contas
                </span>

                {/* Facebook row */}
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

                {/* Instagram row */}
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

              {/* Card 2: Histórico da Página */}
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

              {/* Card 3: Organizações */}
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

              {/* Card 4: Pessoas */}
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

        {/* Modal Footer */}
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
