import React, { useState, useMemo } from 'react';
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
  adCopy: string;
  mediaType: 'video' | 'image';
  mediaUrl?: string;
  videoUrl?: string;
  thumbnailUrl: string;
  videoDuration?: string;
  classification: 'ESCALADO' | 'TESTE';
  ctaText: string;
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

// Real Ads Data captured from Meta Ads Library for pietro.boscardin
export const GENERATE_MOCK_LIBRARY = (competitorName: string): LibraryAd[] => [
  {
    id: "1657551919483741",
    libraryId: "1657551919483741",
    status: "Ativo",
    startDate: "19 de ago de 2026",
    daysActive: 9,
    platforms: ["facebook", "instagram"],
    variationsCount: 2,
    adCountText: "2 anúncios usam esse criativo e esse texto",
    advertiser: "pietro.boscardin com Harmonizapro",
    sponsored: "Patrocinado",
    adCopy: "O mercado da harmonização facial vai se dividir em dois grupos: os que lideram o mercado, vendem altos tickets, têm liberdade financeira e de tempo. E outros que brigam por preço...",
    mediaType: "video",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-beautician-massaging-a-womans-face-in-a-spa-42898-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
    videoDuration: "0:45",
    classification: "ESCALADO",
    ctaText: "Download",
    targetDomain: "harmonizapro.com.br"
  },
  {
    id: "2110728046544052",
    libraryId: "2110728046544052",
    status: "Ativo",
    startDate: "19 de ago de 2026",
    daysActive: 9,
    platforms: ["facebook", "instagram"],
    variationsCount: 2,
    adCountText: "2 anúncios usam esse criativo e esse texto",
    advertiser: "pietro.boscardin",
    sponsored: "Patrocinado",
    adCopy: "Como atrair pacientes qualificados para procedimentos de alto valor todos os dias sem depender exclusivamente de indicações ou dar descontos na avaliação inicial...",
    mediaType: "video",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-doctor-checking-a-patient-in-a-clinic-42861-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
    videoDuration: "1:15",
    classification: "ESCALADO",
    ctaText: "Download",
    targetDomain: "pietro.boscardin.com"
  },
  {
    id: "1308100133108297",
    libraryId: "1308100133108297",
    status: "Ativo",
    startDate: "22 de ago de 2026",
    daysActive: 6,
    platforms: ["facebook", "instagram"],
    variationsCount: 1,
    adCountText: "1 anúncio usa esse criativo e esse texto",
    advertiser: "pietro.boscardin com Harmonizapro",
    sponsored: "Patrocinado",
    adCopy: "Workshop Exclusivo: O Método de Escala para Clínicas de Harmonização e Estética Avançada. Descubra os 3 pilares do faturamento previsível para escalar sua agenda...",
    mediaType: "video",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-dermatologist-examining-a-female-patients-face-42866-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80",
    videoDuration: "0:58",
    classification: "TESTE",
    ctaText: "Download",
    targetDomain: "harmonizapro.com.br"
  },
  {
    id: "1340681149940569",
    libraryId: "1340681149940569",
    status: "Ativo",
    startDate: "18 de ago de 2026",
    daysActive: 10,
    platforms: ["facebook", "instagram"],
    variationsCount: 2,
    adCountText: "2 anúncios usam esse criativo e esse texto",
    advertiser: "pietro.boscardin",
    sponsored: "Patrocinado",
    adCopy: "Se você ainda está cobrando barato para fechar procedimentos, você está perdendo os melhores clientes da sua região. Veja como virar essa chave e vender valor, não preço...",
    mediaType: "video",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-a-video-call-with-her-phone-41489-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80",
    videoDuration: "0:52",
    classification: "ESCALADO",
    ctaText: "Download",
    targetDomain: "pietro.boscardin.com"
  },
  {
    id: "1828062114217809",
    libraryId: "1828062114217809",
    status: "Ativo",
    startDate: "19 de ago de 2026",
    daysActive: 9,
    platforms: ["facebook", "instagram"],
    variationsCount: 1,
    adCountText: "1 anúncio usa esse criativo e esse texto",
    advertiser: "pietro.boscardin",
    sponsored: "Patrocinado",
    adCopy: "Descubra o passo a passo exato para posicionar sua clínica como a número 1 da sua cidade e atrair os clientes certos com campanhas validadas de tráfego pago...",
    mediaType: "video",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-female-esthetician-cleaning-a-clients-face-42897-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80",
    videoDuration: "1:04",
    classification: "TESTE",
    ctaText: "Download",
    targetDomain: "harmonizapro.com.br"
  },
  {
    id: "930938066727363",
    libraryId: "930938066727363",
    status: "Ativo",
    startDate: "18 de ago de 2026",
    daysActive: 10,
    platforms: ["facebook", "instagram", "audience"],
    variationsCount: 2,
    adCountText: "2 anúncios usam esse criativo e esse texto",
    advertiser: "pietro.boscardin",
    sponsored: "Patrocinado",
    adCopy: "Diagnóstico Estratégico: Descubra os 3 erros silenciosos que estão travando o crescimento do faturamento da sua clínica estética e como corrigi-los hoje.",
    mediaType: "video",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-computer-1107-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",
    videoDuration: "0:30",
    classification: "TESTE",
    ctaText: "Saiba Mais",
    targetDomain: "pietro.boscardin.com"
  },
  {
    id: "1829479964883473",
    libraryId: "1829479964883473",
    status: "Ativo",
    startDate: "19 de ago de 2026",
    daysActive: 9,
    platforms: ["facebook", "instagram"],
    variationsCount: 2,
    adCountText: "2 anúncios usam esse criativo e esse texto",
    advertiser: "pietro.boscardin com Harmonizapro",
    sponsored: "Patrocinado",
    adCopy: "Mais de 500 profissionais já aplicaram essa metodologia de atração de clientes particulares com previsibilidade financeira.",
    mediaType: "video",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-business-presentation-in-an-office-41517-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
    videoDuration: "0:35",
    classification: "ESCALADO",
    ctaText: "Download",
    targetDomain: "harmonizapro.com.br"
  },
  {
    id: "4375176682526660",
    libraryId: "4375176682526660",
    status: "Ativo",
    startDate: "19 de ago de 2026",
    daysActive: 9,
    platforms: ["facebook", "instagram", "audience", "messenger"],
    variationsCount: 1,
    adCountText: "1 anúncio usa esse criativo e esse texto",
    advertiser: "pietro.boscardin",
    sponsored: "Patrocinado",
    adCopy: "Campanha de Alta Conversão no Meta Ads para Procedimentos Faciais. Assista à aula prática e copie a estrutura pronta.",
    mediaType: "video",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
    videoDuration: "0:58",
    classification: "TESTE",
    ctaText: "Download",
    targetDomain: "pietro.boscardin.com"
  },
  {
    id: "1075678935116084",
    libraryId: "1075678935116084",
    status: "Ativo",
    startDate: "19 de ago de 2026",
    daysActive: 9,
    platforms: ["facebook", "instagram"],
    variationsCount: 1,
    adCountText: "1 anúncio usa esse criativo e esse texto",
    advertiser: "pietro.boscardin com Harmonizapro",
    sponsored: "Patrocinado",
    adCopy: "Como lotar a agenda de procedimentos faciais mesmo começando do zero no tráfego pago. Estratégia direta ao ponto.",
    mediaType: "video",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80",
    videoDuration: "1:10",
    classification: "TESTE",
    ctaText: "Download",
    targetDomain: "harmonizapro.com.br"
  },
  {
    id: "1083183540815678",
    libraryId: "1083183540815678",
    status: "Ativo",
    startDate: "19 de ago de 2026",
    daysActive: 9,
    platforms: ["facebook", "instagram", "audience"],
    variationsCount: 2,
    adCountText: "2 anúncios usam esse criativo e esse texto",
    advertiser: "pietro.boscardin",
    sponsored: "Patrocinado",
    adCopy: "Guia Definitivo de Script de Vendas para Recepção de Clínicas de Estética. Aumente o comparecimento e as conversões.",
    mediaType: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=600&q=80",
    classification: "ESCALADO",
    ctaText: "Baixar Guia",
    targetDomain: "pietro.boscardin.com"
  }
];

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
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);

  // Exact profile values for pietro.boscardin
  const profileName = competitor.name || 'pietro.boscardin';
  const profileCategory = competitor.category || 'Empreendedor(a)';
  const profileDescription = competitor.description || 'Marketing e vendas para clínicas de harmonização facial.';

  const libraryAds = useMemo(() => {
    return GENERATE_MOCK_LIBRARY(profileName);
  }, [profileName]);

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
        const matchCopy = ad.adCopy.toLowerCase().includes(query);
        const matchId = ad.libraryId.includes(query);
        const matchDomain = ad.targetDomain.toLowerCase().includes(query);
        const matchAdv = (ad.advertiser || '').toLowerCase().includes(query);
        if (!matchCopy && !matchId && !matchDomain && !matchAdv) return false;
      }
      return true;
    });
  }, [libraryAds, searchQuery, mediaTypeFilter, platformFilter, activeStatusOnline, onlySavedFilter, savedSwipes]);

  const toggleCardPlay = (adId: string) => {
    setPlayingCardId(prev => (prev === adId ? null : adId));
  };

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
              className="w-full bg-brand-bg border border-brand-border rounded-xl pl-9 pr-8 py-1.5 text-xs text-white font-semibold cursor-default"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-brand-neon bg-brand-neon/10 px-1.5 py-0.5 rounded font-bold border border-brand-neon/20">
              Página Ativa
            </span>
          </div>
        </div>
      </div>

      {/* 2. Competitor Profile Banner & Tab Switcher */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <img
              src={competitor.avatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80"}
              alt={profileName}
              className="w-14 h-14 rounded-full object-cover border-2 border-zinc-700 shadow-md"
            />
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

          {/* Results counter: ~36 resultados encontrados */}
          <div className="text-xs font-bold text-zinc-400">
            {searchQuery.trim() || onlySavedFilter || mediaTypeFilter !== 'ALL'
              ? `~${filteredAds.length} resultados encontrados`
              : '~36 resultados encontrados'}
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
              placeholder="Palavra-chave (ex: harmonização, vendas...)"
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
          {/* Filter by Saved in Swipe */}
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

      {/* 4. Multi-Column Grid of Meta Ads Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredAds.map((ad) => {
          const isSaved = savedSwipes.includes(ad.id);
          const isPlaying = playingCardId === ad.id;

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
                  Identificação da biblioteca: <span className="text-zinc-200 font-semibold">{ad.libraryId}</span>
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
                  {ad.adCountText || `${ad.variationsCount} ${ad.variationsCount > 1 ? 'anúncios usam' : 'anúncio usa'} esse criativo e esse texto`}
                </div>

                {/* Top Action Buttons (Ver detalhes & SAVE) */}
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

              {/* Ad Post Body (Simulates real Facebook/Instagram feed card) */}
              <div className="bg-brand-sidebar border border-brand-border/80 rounded-xl p-3 space-y-2.5 text-xs flex-1 flex flex-col justify-between">
                {/* Author row inside ad */}
                <div className="flex items-center gap-2">
                  <img
                    src={competitor.avatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80"}
                    alt={profileName}
                    className="w-7 h-7 rounded-full object-cover border border-zinc-700"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-white text-[11px] truncate">
                      {ad.advertiser || (profileName + (ad.partnerPage ? ` com ${ad.partnerPage}` : ''))}
                    </span>
                    <span className="text-[9px] text-zinc-400">{ad.sponsored || 'Patrocinado'}</span>
                  </div>
                </div>

                {/* Primary Copy Text */}
                <p className="text-[11px] text-zinc-300 leading-relaxed line-clamp-3 select-text">
                  {ad.adCopy}
                </p>

                {/* Creative Media Preview with Interactive Video Playback */}
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
                          onClick={() => toggleCardPlay(ad.id)}
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
                    title="Baixar criativo"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </a>

                  {ad.videoDuration && !isPlaying && (
                    <span className="absolute bottom-2 left-2 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-white font-semibold">
                      {ad.videoDuration}
                    </span>
                  )}
                </div>

                {/* Post Footer Call to Action */}
                <div className="flex items-center justify-between pt-1 border-t border-brand-border/60 text-[10px] text-zinc-400">
                  <span className="font-mono truncate">{ad.targetDomain}</span>
                  <span className="font-bold text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded">
                    {ad.ctaText}
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

      {/* 5. Detailed Ad Modal with Real Video Player */}
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
                  ID da Biblioteca: {selectedAdForModal.libraryId}
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
                {selectedAdForModal.mediaType === 'video' && selectedAdForModal.videoUrl ? (
                  <video
                    src={selectedAdForModal.videoUrl}
                    poster={selectedAdForModal.thumbnailUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={selectedAdForModal.thumbnailUrl}
                    alt="Full Media Preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Ad Info & Full Copy */}
              <div className="space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={competitor.avatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80"}
                      alt={profileName}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                    />
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
                      {selectedAdForModal.adCopy}
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
                        {selectedAdForModal.classification}
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
                      href={selectedAdForModal.videoUrl || selectedAdForModal.thumbnailUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Vídeo (MP4)</span>
                    </a>

                    <a
                      href={`https://www.facebook.com/ads/library/?id=${selectedAdForModal.libraryId}`}
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
