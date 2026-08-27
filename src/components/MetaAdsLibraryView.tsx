import React, { useState, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Bookmark, 
  ExternalLink, 
  Play, 
  Download, 
  MoreHorizontal, 
  CheckCircle2, 
  X, 
  Info
} from 'lucide-react';
import { CompetitorDetails } from './MiningView';
import { generateDynamicAdsForPage } from '../services/metaDataEngine';

export interface LibraryAd {
  id: string;
  libraryId: string;
  status: 'Ativo' | 'Inativo';
  startDate: string;
  daysActive?: number;
  platforms: ('facebook' | 'instagram' | 'messenger' | 'audience')[];
  variationsCount: number;
  adCountText?: string;
  partnerPage?: string;
  advertiser?: string;
  sponsored?: string;
  copy?: string;
  adCopy: string;
  mediaType: 'video' | 'image';
  mediaUrl?: string;
  videoUrl: string;
  thumbnailUrl: string;
  videoDuration?: string;
  classification?: 'ESCALADO' | 'TESTE';
  cta?: string;
  ctaText: string;
  linkDisplay?: string;
  targetDomain: string;
  impressionsRange?: string;
}

interface MetaAdsLibraryViewProps {
  competitor: CompetitorDetails;
  savedSwipes: string[];
  onToggleSwipe: (id: string) => void;
  onBack: () => void;
  onOpenTransparency: () => void;
}

// Helper to generate dynamic initials for avatar fallback
export function getInitials(name: string): string {
  if (!name) return 'C';
  const clean = name.trim().replace(/^@/, '');
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

// Componente de Player de Vídeo HTML5 Real com Ref e Controles Nativos
const VideoPlayerCard: React.FC<{
  videoUrl: string;
  thumbnailUrl: string;
  videoDuration?: string;
}> = ({ videoUrl, thumbnailUrl, videoDuration }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div 
      className="relative rounded-xl overflow-hidden bg-black aspect-[4/5] border border-zinc-800 flex items-center justify-center group/media cursor-pointer"
      onClick={handlePlayClick}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        controls={isPlaying}
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        className="w-full h-full object-cover rounded-xl"
      />

      {/* Botão de Play Central */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-black/80 border border-white/40 flex items-center justify-center backdrop-blur-xs group-hover/media:scale-110 group-hover/media:border-brand-neon transition-all shadow-xl">
            <Play className="w-5 h-5 text-brand-neon fill-brand-neon ml-0.5" />
          </div>
        </div>
      )}

      {/* Botão Flutuante de Download */}
      <a
        href={videoUrl}
        target="_blank"
        rel="noreferrer"
        download="criativo.mp4"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg transition-colors cursor-pointer z-10"
        title="Baixar criativo MP4"
      >
        <Download className="w-3 h-3" />
        <span>Download</span>
      </a>

      {/* Badge de Duração */}
      {videoDuration && !isPlaying && (
        <span className="absolute bottom-2 left-2 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-white font-semibold pointer-events-none">
          {videoDuration}
        </span>
      )}
    </div>
  );
};

export const MetaAdsLibraryView: React.FC<MetaAdsLibraryViewProps> = ({
  competitor,
  savedSwipes,
  onToggleSwipe,
  onBack,
  onOpenTransparency
}) => {
  const [activeTab, setActiveTab] = useState<'anuncios' | 'sobre'>('anuncios');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'ALL' | 'facebook' | 'instagram'>('ALL');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'ALL' | 'video' | 'image'>('ALL');
  const [selectedAdForModal, setSelectedAdForModal] = useState<LibraryAd | null>(null);
  const [activeStatusOnline, setActiveStatusOnline] = useState(true);
  const [onlySavedFilter, setOnlySavedFilter] = useState(false);

  // 100% Dynamic profile variables extracted from competitor prop
  const profileName = competitor.name || 'Cliente Monitorado';
  const profileCategory = competitor.category || 'Página Meta Ads';
  const profileDescription = competitor.description || `Anúncios e campanhas ativas no Meta Ads para ${profileName}.`;

  // Read ads dynamically from competitor object
  const libraryAds = useMemo<LibraryAd[]>(() => {
    if (competitor.ads && competitor.ads.length > 0) {
      return competitor.ads;
    }
    return generateDynamicAdsForPage(profileName, competitor.facebookId || 'page');
  }, [competitor, profileName]);

  // Count how many ads from this library are saved
  const savedCountInLibrary = useMemo(() => {
    return libraryAds.filter(a => savedSwipes.includes(a.id)).length;
  }, [libraryAds, savedSwipes]);

  // Filtered Ads
  const filteredAds = useMemo(() => {
    return libraryAds.filter(ad => {
      if (activeStatusOnline && ad.status !== 'Ativo') return false;
      if (onlySavedFilter && !savedSwipes.includes(ad.id)) return false;
      if (mediaTypeFilter !== 'ALL' && ad.mediaType !== mediaTypeFilter) return false;
      if (platformFilter !== 'ALL' && !ad.platforms.includes(platformFilter)) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const copyText = (ad.copy || ad.adCopy || '').toLowerCase();
        const matchCopy = copyText.includes(query);
        const matchId = (ad.libraryId || ad.id).includes(query);
        const matchDomain = (ad.targetDomain || ad.linkDisplay || '').toLowerCase().includes(query);
        const matchAdv = (ad.advertiser || '').toLowerCase().includes(query);
        if (!matchCopy && !matchId && !matchDomain && !matchAdv) return false;
      }
      return true;
    });
  }, [libraryAds, searchQuery, mediaTypeFilter, platformFilter, activeStatusOnline, onlySavedFilter, savedSwipes]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Top Meta Ads Navigation Bar */}
      <div className="bg-brand-sidebar border border-brand-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-card hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold border border-brand-border transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-brand-neon" />
            <span>Voltar para Mineração</span>
          </button>

          {/* Meta Brand Badge */}
          <div className="flex items-center gap-2 pl-3 border-l border-brand-border text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <svg className="w-4 h-4 fill-blue-500" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Biblioteca de Anúncios Meta
            </span>
            <span className="text-zinc-600">•</span>
            <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] text-zinc-300 font-medium">
              Brasil 🇧🇷
            </span>
          </div>
        </div>

        {/* Global Meta Search Bar */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={profileName}
              readOnly
              className="w-full bg-brand-bg border border-brand-border rounded-xl pl-9 pr-8 py-1.5 text-xs text-white font-semibold cursor-default truncate"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-brand-neon bg-brand-neon/10 px-1.5 py-0.5 rounded font-bold border border-brand-neon/20">
              Página Ativa
            </span>
          </div>
        </div>
      </div>

      {/* 2. Competitor Profile Banner & Tab Switcher (Dynamic) */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            {competitor.avatarUrl ? (
              <img
                src={competitor.avatarUrl}
                alt={profileName}
                className="w-14 h-14 rounded-full object-cover border-2 border-zinc-700 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-neon via-emerald-400 to-teal-500 text-black font-black text-lg flex items-center justify-center border-2 border-brand-neon/60 shadow-md shadow-brand-neon/10 shrink-0">
                {getInitials(profileName)}
              </div>
            )}
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                {profileName}
                <span className="text-[11px] bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                  {profileCategory}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {profileDescription}
              </p>
            </div>
          </div>

          {/* Action to open Meta Page Transparency Modal */}
          <button
            type="button"
            onClick={onOpenTransparency}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold border border-zinc-700 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Info className="w-3.5 h-3.5 text-brand-neon" />
            <span>Ver Transparência da Página</span>
          </button>
        </div>

        {/* Tabs: Anúncios & Sobre */}
        <div className="flex items-center justify-between border-t border-brand-border/70 pt-4">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => setActiveTab('anuncios')}
              className={`text-sm font-bold pb-2 relative transition-all cursor-pointer ${
                activeTab === 'anuncios'
                  ? 'text-white after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-[17px] after:h-[3px] after:bg-brand-neon'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Anúncios
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('sobre');
                onOpenTransparency();
              }}
              className={`text-sm font-semibold pb-2 relative transition-all cursor-pointer ${
                activeTab === 'sobre'
                  ? 'text-white font-bold after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-[17px] after:h-[3px] after:bg-brand-neon'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sobre
            </button>
          </div>

          {/* Results counter */}
          <div className="text-xs font-bold text-zinc-400">
            ~{filteredAds.length} resultados encontrados
          </div>
        </div>
      </div>

      {/* 3. Filter and Search Toolbar */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Keyword Search Input */}
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Palavra-chave (ex: ofertas, escala...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-all"
            />
          </div>

          {/* Media Type Filter */}
          <div className="flex items-center gap-1 bg-brand-bg border border-brand-border rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setMediaTypeFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                mediaTypeFilter === 'ALL'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setMediaTypeFilter('video')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                mediaTypeFilter === 'video'
                  ? 'bg-zinc-800 text-brand-neon shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Vídeos
            </button>
            <button
              type="button"
              onClick={() => setMediaTypeFilter('image')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                mediaTypeFilter === 'image'
                  ? 'bg-zinc-800 text-brand-neon shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Imagens
            </button>
          </div>
        </div>

        {/* Active Filter Pill & Saved Swipe Filter */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlySavedFilter(!onlySavedFilter)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
              onlySavedFilter
                ? 'bg-lime-400/15 border-lime-400 text-lime-400 shadow-sm shadow-lime-400/10'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${onlySavedFilter ? 'fill-lime-400 text-lime-400' : 'text-zinc-400'}`} />
            <span>Salvos no Swipe ({savedCountInLibrary})</span>
          </button>

          {activeStatusOnline && (
            <button
              type="button"
              onClick={() => setActiveStatusOnline(false)}
              className="inline-flex items-center gap-1.5 bg-zinc-800/90 border border-zinc-700 text-zinc-300 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-zinc-700 transition-all cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Status online: Anúncios ativos</span>
              <X className="w-3.5 h-3.5 text-zinc-400 hover:text-white ml-0.5" />
            </button>
          )}
          {!activeStatusOnline && (
            <button
              type="button"
              onClick={() => setActiveStatusOnline(true)}
              className="inline-flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs px-3 py-1.5 rounded-full hover:text-white cursor-pointer"
            >
              <span>+ Filtrar por ativos</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Multi-Column Grid of Dynamic Meta Ads Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredAds.map((ad) => {
          const isSaved = savedSwipes.includes(ad.id);
          const copyText = ad.copy || ad.adCopy;
          const displayAdvertiser = ad.advertiser || profileName;

          return (
            <div
              key={ad.id}
              className="bg-brand-card border border-brand-border hover:border-zinc-600 rounded-2xl p-4 flex flex-col justify-between space-y-3.5 shadow-xl transition-all group"
            >
              {/* Card Meta Header */}
              <div className="space-y-2 border-b border-brand-border/70 pb-3">
                {/* Status and Action Dots */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500/20 text-emerald-400" />
                    <span>{ad.status}</span>
                  </div>
                  <button 
                    type="button" 
                    className="text-zinc-500 hover:text-white transition-colors p-1 rounded hover:bg-zinc-800 cursor-pointer"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Library ID */}
                <div className="text-[11px] text-zinc-400 font-mono">
                  Identificação da biblioteca: <span className="text-zinc-200 font-semibold">{ad.libraryId || ad.id}</span>
                </div>

                {/* Start Date */}
                <div className="text-[11px] text-zinc-400">
                  Veiculação iniciada em {ad.startDate}
                </div>

                {/* Platforms Icons */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase mr-1">Plataformas</span>
                  {ad.platforms.includes('facebook') && (
                    <div className="w-4 h-4 rounded-full bg-[#1877F2] flex items-center justify-center shadow-xs">
                      <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                  )}
                  {ad.platforms.includes('instagram') && (
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] flex items-center justify-center shadow-xs">
                      <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Variations count text */}
                <div className="text-[11px] text-zinc-400 font-medium pt-1">
                  {ad.adCountText || `${ad.variationsCount || 1} ${ad.variationsCount > 1 ? 'anúncios usam' : 'anúncio usa'} esse criativo e esse texto`}
                </div>

                {/* Top Action Buttons */}
                <div className="pt-2 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedAdForModal(ad)}
                    className="w-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold py-1.5 rounded-xl border border-zinc-700 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Ver detalhes do anúncio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleSwipe(ad.id)}
                    className={`w-full py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSaved
                        ? 'bg-lime-400/15 border border-lime-400 text-lime-400 shadow-md shadow-lime-400/10'
                        : 'bg-indigo-600/90 hover:bg-indigo-600 border border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'text-lime-400 fill-lime-400' : 'text-white fill-white'}`} />
                    <span>{isSaved ? 'SALVO NO SWIPE' : 'SAVE'}</span>
                  </button>
                </div>
              </div>

              {/* Ad Post Body */}
              <div className="bg-brand-sidebar border border-brand-border/80 rounded-xl p-3 space-y-2.5 text-xs flex-1 flex flex-col justify-between">
                {/* Author row */}
                <div className="flex items-center gap-2">
                  {competitor.avatarUrl ? (
                    <img
                      src={competitor.avatarUrl}
                      alt={displayAdvertiser}
                      className="w-7 h-7 rounded-full object-cover border border-zinc-700"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-neon to-emerald-400 text-black font-black text-[10px] flex items-center justify-center border border-zinc-700 shrink-0">
                      {getInitials(displayAdvertiser)}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-white text-[11px] truncate">
                      {displayAdvertiser}
                    </span>
                    <span className="text-[9px] text-zinc-400">{ad.sponsored || 'Patrocinado'}</span>
                  </div>
                </div>

                {/* Primary Copy Text */}
                <p className="text-[11px] text-zinc-300 leading-relaxed line-clamp-3 select-text">
                  {copyText}
                </p>

                {/* Creative Media Preview with Real HTML5 Video Player */}
                <VideoPlayerCard
                  videoUrl={ad.videoUrl}
                  thumbnailUrl={ad.thumbnailUrl}
                  videoDuration={ad.videoDuration}
                />

                {/* Post Footer Call to Action */}
                <div className="flex items-center justify-between pt-1 border-t border-brand-border/60 text-[10px] text-zinc-400">
                  <span className="font-mono truncate">{ad.linkDisplay || ad.targetDomain}</span>
                  <span className="font-bold text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded">
                    {ad.cta || ad.ctaText}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAds.length === 0 && (
        <div className="py-16 text-center text-zinc-500 text-xs bg-brand-card border border-brand-border rounded-2xl">
          Nenhum anúncio encontrado para os filtros selecionados.
        </div>
      )}

      {/* 5. Detailed Ad Modal */}
      {selectedAdForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedAdForModal(null)}
        >
          <div
            className="bg-brand-sidebar border border-brand-border rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl text-white p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Anúncio Ativo</span>
                </div>
                <span className="text-xs text-zinc-400 font-mono">
                  ID da Biblioteca: {selectedAdForModal.libraryId || selectedAdForModal.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAdForModal(null)}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body with Real Video Player */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Real Video Player Box */}
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/5] border border-zinc-800 flex items-center justify-center shadow-xl">
                <video
                  src={selectedAdForModal.videoUrl}
                  poster={selectedAdForModal.thumbnailUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>

              {/* Ad Info & Full Copy */}
              <div className="space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {competitor.avatarUrl ? (
                      <img
                        src={competitor.avatarUrl}
                        alt={profileName}
                        className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-neon to-emerald-400 text-black font-black text-xs flex items-center justify-center border border-zinc-700 shrink-0">
                        {getInitials(profileName)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {selectedAdForModal.advertiser || profileName}
                      </h4>
                      <span className="text-[11px] text-zinc-400">Veiculação iniciada em {selectedAdForModal.startDate}</span>
                    </div>
                  </div>

                  <div className="bg-brand-card border border-brand-border rounded-xl p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-brand-neon">Texto do Anúncio (Copy)</span>
                    <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line select-text">
                      {selectedAdForModal.copy || selectedAdForModal.adCopy}
                    </p>
                  </div>

                  {/* Ad Meta Specs */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-brand-card/70 border border-brand-border rounded-xl p-3">
                      <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Formato</span>
                      <span className="font-bold text-white uppercase">{selectedAdForModal.mediaType}</span>
                    </div>
                    <div className="bg-brand-card/70 border border-brand-border rounded-xl p-3">
                      <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Classificação</span>
                      <span className={`font-bold ${selectedAdForModal.classification === 'ESCALADO' ? 'text-orange-400' : 'text-zinc-300'}`}>
                        {selectedAdForModal.classification || 'ESCALADO'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="space-y-2 pt-4 border-t border-brand-border">
                  <button
                    type="button"
                    onClick={() => onToggleSwipe(selectedAdForModal.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      savedSwipes.includes(selectedAdForModal.id)
                        ? 'bg-lime-400/15 border border-lime-400 text-lime-400 shadow-md'
                        : 'bg-brand-neon hover:bg-brand-neonHover text-black font-extrabold shadow-md shadow-brand-neon/20'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${savedSwipes.includes(selectedAdForModal.id) ? 'fill-lime-400' : 'fill-black'}`} />
                    <span>{savedSwipes.includes(selectedAdForModal.id) ? 'SALVO NO SWIPE FILE' : 'SALVAR NO SWIPE FILE'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={selectedAdForModal.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      download="criativo.mp4"
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Vídeo (MP4)</span>
                    </a>

                    <a
                      href={`https://www.facebook.com/ads/library/?id=${selectedAdForModal.libraryId || selectedAdForModal.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold py-2.5 rounded-xl border border-zinc-700 text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <span>Biblioteca Meta</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
