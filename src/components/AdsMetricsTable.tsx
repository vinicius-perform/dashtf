import React, { useState, useMemo } from 'react';
import { 
  MetaAd, 
  MetaAdSet 
} from '../types/meta';
import { 
  formatCurrency, 
  formatNumber, 
  formatPercent 
} from '../utils/formatters';
import { 
  getAdSuggestion, 
  extractAdConversasAndCpl,
  AdSuggestionInfo
} from '../utils/adDiagnostics';
import { ScaleBudgetModal } from './ScaleBudgetModal';
import { 
  Pause, 
  Play, 
  TrendingUp, 
  Sparkles, 
  Flame, 
  AlertTriangle, 
  Check, 
  Eye, 
  Copy, 
  CheckCheck, 
  ExternalLink,
  MessageSquare,
  Image as ImageIcon,
  Video,
  X,
  Layers,
  Search,
  ArrowUpDown,
  Filter
} from 'lucide-react';

interface AdsMetricsTableProps {
  ads: MetaAd[];
  adsets?: MetaAdSet[];
  metaCpl?: number | null;
  accountName?: string;
  onToggleAdStatus?: (adId: string) => void;
  isLoading?: boolean;
}

export const AdsMetricsTable: React.FC<AdsMetricsTableProps> = ({
  ads = [],
  adsets = [],
  metaCpl,
  accountName,
  onToggleAdStatus,
  isLoading = false
}) => {
  // Estado para busca e filtro por sugestão
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestionFilter, setSuggestionFilter] = useState<string>('ALL');

  // Estado para o Modal de Escala de Orçamento
  const [selectedAdForScale, setSelectedAdForScale] = useState<MetaAd | null>(null);
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);

  // Estado para Lightbox de Prévia do Criativo
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);

  // Estado para confirmação de cópia do ID
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Filtra e Ordena estritamente os 25 anúncios que mais gastaram no período
  const top25Ads = useMemo(() => {
    return [...ads]
      .sort((a, b) => Number(b.spend || 0) - Number(a.spend || 0))
      .slice(0, 25);
  }, [ads]);

  // 2. Aplica filtros secundários de busca e status se desejado
  const filteredAds = useMemo(() => {
    return top25Ads.filter(ad => {
      const matchesSearch = 
        (ad.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ad.campaign_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ad.adset_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.id.includes(searchTerm);

      if (!matchesSearch) return false;

      if (suggestionFilter !== 'ALL') {
        const diag = getAdSuggestion(ad, metaCpl);
        if (diag.type !== suggestionFilter) return false;
      }

      return true;
    });
  }, [top25Ads, searchTerm, suggestionFilter, metaCpl]);

  // Contadores rápidos para o topo da tabela
  const counters = useMemo(() => {
    let pausar = 0;
    let replicar = 0;
    let fadiga = 0;
    let totalSpend = 0;
    let totalConversas = 0;

    top25Ads.forEach(ad => {
      totalSpend += Number(ad.spend || 0);
      const { conversas } = extractAdConversasAndCpl(ad);
      totalConversas += conversas;
      const diag = getAdSuggestion(ad, metaCpl);
      if (diag.type === 'PAUSAR') pausar++;
      if (diag.type === 'REPLICAR') replicar++;
      if (diag.type === 'FADIGA') fadiga++;
    });

    return { pausar, replicar, fadiga, totalSpend, totalConversas };
  }, [top25Ads, metaCpl]);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleOpenScale = (ad: MetaAd) => {
    setSelectedAdForScale(ad);
    setIsScaleModalOpen(true);
  };

  const handleConfirmScale = async (adsetId: string, newBudget: number) => {
    console.log(`[ESCALA DE ORÇAMENTO] Conjunto ${adsetId} escalado para R$ ${newBudget.toFixed(2)}/dia`);
    // Futura integração com Graph API POST /{adset_id}
  };

  // Renderizador do Ícone de Sugestão
  const renderSuggestionIcon = (iconName: AdSuggestionInfo['iconName']) => {
    switch (iconName) {
      case 'pause':
        return <Pause className="w-3 h-3 text-red-400" />;
      case 'flame':
        return <Flame className="w-3 h-3 text-orange-400" />;
      case 'sparkles':
        return <Sparkles className="w-3 h-3 text-black" />;
      case 'check':
        return <Check className="w-3 h-3 text-zinc-300" />;
      case 'alert':
        return <AlertTriangle className="w-3 h-3 text-amber-400" />;
      case 'eye':
        return <Eye className="w-3 h-3 text-zinc-400" />;
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl space-y-0 select-none">
      
      {/* Banner Superior com Métricas Rápidas do Top 25 */}
      <div className="p-5 bg-zinc-900/80 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>Top 25 Anúncios com Maior Gasto</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-neon text-black">
                Microgerenciamento
              </span>
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Inspeção tática dos criativos com sugestões automáticas baseadas na meta de CPL{' '}
            {metaCpl ? (
              <strong className="text-brand-neon">({formatCurrency(metaCpl)})</strong>
            ) : (
              <span className="text-zinc-500">(Meta padrão: R$ 25,00)</span>
            )}
          </p>
        </div>

        {/* Badges de Contadores do Diagnóstico */}
        <div className="flex flex-wrap items-center gap-2">
          {counters.replicar > 0 && (
            <button
              onClick={() => setSuggestionFilter(prev => prev === 'REPLICAR' ? 'ALL' : 'REPLICAR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                suggestionFilter === 'REPLICAR'
                  ? 'bg-brand-neon text-black border-brand-neon shadow-md shadow-brand-neon/20 ring-1 ring-brand-neon'
                  : 'bg-brand-neon/15 text-brand-neon border-brand-neon/30 hover:bg-brand-neon/25'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{counters.replicar} Replicar</span>
            </button>
          )}

          {counters.pausar > 0 && (
            <button
              onClick={() => setSuggestionFilter(prev => prev === 'PAUSAR' ? 'ALL' : 'PAUSAR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                suggestionFilter === 'PAUSAR'
                  ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20 ring-1 ring-red-500'
                  : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
              }`}
            >
              <Pause className="w-3.5 h-3.5" />
              <span>{counters.pausar} Pausar</span>
            </button>
          )}

          {counters.fadiga > 0 && (
            <button
              onClick={() => setSuggestionFilter(prev => prev === 'FADIGA' ? 'ALL' : 'FADIGA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                suggestionFilter === 'FADIGA'
                  ? 'bg-orange-500 text-white border-orange-500 ring-1 ring-orange-500'
                  : 'bg-orange-500/15 text-orange-400 border-orange-500/30 hover:bg-orange-500/25'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{counters.fadiga} Fadiga</span>
            </button>
          )}

          <div className="pl-3 border-l border-zinc-800 text-xs text-zinc-400 flex items-center gap-3">
            <div>
              <span className="text-[10px] text-zinc-500 block">Total Gasto Top 25</span>
              <strong className="text-white text-xs">{formatCurrency(counters.totalSpend)}</strong>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">Conversas</span>
              <strong className="text-white text-xs">{formatNumber(counters.totalConversas)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Busca e Filtros */}
      <div className="p-3.5 bg-zinc-900/50 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por anúncio, conjunto ou ID..."
            className="w-full pl-9 pr-4 py-1.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {suggestionFilter !== 'ALL' && (
            <button
              onClick={() => setSuggestionFilter('ALL')}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Limpar Filtro ({suggestionFilter})</span>
              <X className="w-3 h-3" />
            </button>
          )}

          <span className="text-xs text-zinc-400">
            Exibindo <strong className="text-white">{filteredAds.length}</strong> de <strong className="text-white">{top25Ads.length}</strong> anúncios
          </span>
        </div>
      </div>

      {/* TABELA DE MÉTRICAS E MICROGERENCIAMENTO DE ANÚNCIOS */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider text-[11px] font-semibold">
              {/* Coluna 1: Prévia */}
              <th className="py-3 px-3 w-[72px] text-center">Prévia</th>

              {/* Coluna 2: Anúncio */}
              <th className="py-3 px-4 min-w-[220px]">Anúncio (Conjunto & Campanha)</th>

              {/* Coluna 3: Sugestão do Sistema */}
              <th className="py-3 px-4 min-w-[140px]">Sugestão do Sistema</th>

              {/* Coluna 4: Gasto */}
              <th className="py-3 px-3 text-right min-w-[100px]">Gasto</th>

              {/* Coluna 5: Conversas */}
              <th className="py-3 px-3 text-right min-w-[90px]">Conversas</th>

              {/* Coluna 6: CPL */}
              <th className="py-3 px-3 text-right min-w-[95px]">CPL</th>

              {/* Coluna 7: CTR */}
              <th className="py-3 px-3 text-right min-w-[80px]">CTR</th>

              {/* Coluna 8: Frequência */}
              <th className="py-3 px-3 text-right min-w-[85px]">Frequência</th>

              {/* Coluna 9: CPM */}
              <th className="py-3 px-3 text-right min-w-[85px]">CPM</th>

              {/* Coluna 10: Ações (Botões Reais) */}
              <th className="py-3 px-4 text-center min-w-[170px]">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/60 font-medium">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-zinc-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-brand-neon border-t-transparent rounded-full animate-spin" />
                    <span>Carregando os 25 anúncios que mais gastaram...</span>
                  </div>
                </td>
              </tr>
            ) : filteredAds.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-zinc-400">
                  Nenhum anúncio encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredAds.map((ad, idx) => {
                const { conversas, cpl } = extractAdConversasAndCpl(ad);
                const suggestion = getAdSuggestion(ad, metaCpl);
                const isPaused = ad.status === 'PAUSED';

                return (
                  <tr
                    key={ad.id}
                    className={`transition-colors group hover:bg-zinc-900/60 ${
                      isPaused ? 'opacity-65 bg-zinc-950/40' : ''
                    }`}
                  >
                    {/* COLUNA 1: PRÉVIA (MINIATURA) */}
                    <td className="py-3 px-3 text-center">
                      <div 
                        onClick={() => ad.thumbnail_url && setPreviewMediaUrl(ad.thumbnail_url)}
                        className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-brand-neon hover:scale-105 transition-all mx-auto shrink-0 flex items-center justify-center group/thumb"
                        title="Clique para ampliar miniatura"
                      >
                        {ad.thumbnail_url ? (
                          <img
                            src={ad.thumbnail_url}
                            alt={ad.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-zinc-600">
                            {ad.format === 'VIDEO' ? <Video className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                          </div>
                        )}

                        {/* Badge de formato discreto */}
                        <span className="absolute bottom-0 right-0 bg-black/80 text-[8px] font-black text-white px-1 rounded-tl">
                          {ad.format === 'VIDEO' ? 'VÍD' : 'IMG'}
                        </span>
                      </div>
                    </td>

                    {/* COLUNA 2: ANÚNCIO (NOME, CAMPANHA E CONJUNTO) */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-zinc-500">#{idx + 1}</span>
                          <span 
                            className="font-bold text-white text-xs truncate max-w-[260px] group-hover:text-brand-neon transition-colors block"
                            title={ad.name}
                          >
                            {ad.name}
                          </span>
                        </div>

                        {/* Campanha e Conjunto */}
                        <div className="text-[11px] text-zinc-400 truncate max-w-[280px]">
                          <span className="text-zinc-300 font-medium">{ad.adset_name || 'Conjunto'}</span>
                          <span className="mx-1 text-zinc-600">·</span>
                          <span className="text-zinc-500">{ad.campaign_name || 'Campanha'}</span>
                        </div>

                        {/* ID com Botão de Cópia Rápida */}
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                          <span className="font-mono">ID: {ad.id}</span>
                          <button
                            onClick={(e) => handleCopyId(ad.id, e)}
                            className="text-zinc-500 hover:text-white transition-colors"
                            title="Copiar ID do Anúncio"
                          >
                            {copiedId === ad.id ? (
                              <CheckCheck className="w-3 h-3 text-brand-neon" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* COLUNA 3: SUGESTÃO DO SISTEMA (BADGE COLORIDA COM LÓGICA ESTRITA) */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${suggestion.badgeBg} ${suggestion.badgeText} ${suggestion.badgeBorder}`}
                          title={suggestion.reason}
                        >
                          {renderSuggestionIcon(suggestion.iconName)}
                          <span>{suggestion.label}</span>
                        </span>

                        <span className="block text-[10px] text-zinc-400 leading-tight max-w-[200px]">
                          {suggestion.reason}
                        </span>
                      </div>
                    </td>

                    {/* COLUNA 4: GASTO */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-extrabold text-white text-xs">
                        {formatCurrency(ad.spend)}
                      </span>
                    </td>

                    {/* COLUNA 5: CONVERSAS */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 font-bold text-zinc-200">
                        <MessageSquare className="w-3 h-3 text-brand-neon" />
                        <span>{formatNumber(conversas)}</span>
                      </div>
                    </td>

                    {/* COLUNA 6: CPL (CUSTO POR CONVERSA) */}
                    <td className="py-3 px-3 text-right">
                      {cpl !== null && cpl > 0 ? (
                        <span className={`font-black text-xs ${
                          metaCpl && cpl > metaCpl ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {formatCurrency(cpl)}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>

                    {/* COLUNA 7: CTR */}
                    <td className="py-3 px-3 text-right">
                      <span className={`font-bold text-xs ${
                        (ad.ctr ?? 0) >= 1.5 ? 'text-emerald-400' : (ad.ctr ?? 0) < 0.8 ? 'text-amber-400' : 'text-zinc-300'
                      }`}>
                        {formatPercent(ad.ctr)}
                      </span>
                    </td>

                    {/* COLUNA 8: FREQUÊNCIA */}
                    <td className="py-3 px-3 text-right">
                      <span className={`font-bold text-xs ${
                        (ad.frequency ?? 1) > 3.0 ? 'text-orange-400' : 'text-zinc-300'
                      }`}>
                        {ad.frequency ? `${Number(ad.frequency).toFixed(2)}x` : '—'}
                      </span>
                    </td>

                    {/* COLUNA 9: CPM */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-medium text-zinc-400 text-xs">
                        {formatCurrency(ad.cpm)}
                      </span>
                    </td>

                    {/* COLUNA 10: AÇÕES (BOTÕES REAIS: PAUSAR/ATIVAR E ESCALAR) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Botão de Pausar / Ativar */}
                        <button
                          type="button"
                          onClick={() => onToggleAdStatus && onToggleAdStatus(ad.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            isPaused
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                          }`}
                          title={isPaused ? 'Ativar anúncio' : 'Pausar anúncio'}
                        >
                          {isPaused ? (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Ativar</span>
                            </>
                          ) : (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pausar</span>
                            </>
                          )}
                        </button>

                        {/* Botão de Escalar (Verde Neon #CCFF00) */}
                        <button
                          type="button"
                          onClick={() => handleOpenScale(ad)}
                          className="px-3 py-1.5 rounded-lg text-xs font-black bg-brand-neon hover:bg-brand-neonHover text-black shadow-md shadow-brand-neon/20 transition-all flex items-center gap-1.5 active:scale-95"
                          title="Escalar orçamento diário do conjunto deste anúncio"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Escalar</span>
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

      {/* Footer com Regras de Leitura */}
      <div className="p-3.5 bg-zinc-900/70 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00]" />
            <span>Replicar: CPL 20% abaixo e 3+ conversas</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Pausar: Gasto 2× sem conversa ou 3× com CPL +50%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>Fadiga: Freq &gt; 3 e CTR &lt; 0,8%</span>
          </span>
        </div>

        <span className="text-zinc-500 font-mono text-[10px]">
          F.A. Rules Engine v2.0
        </span>
      </div>

      {/* MODAL DE ESCALA DE ORÇAMENTO */}
      {selectedAdForScale && (
        <ScaleBudgetModal
          isOpen={isScaleModalOpen}
          onClose={() => {
            setIsScaleModalOpen(false);
            setSelectedAdForScale(null);
          }}
          ad={selectedAdForScale}
          adset={adsets.find(as => as.id === selectedAdForScale.adset_id)}
          onConfirmScale={handleConfirmScale}
        />
      )}

      {/* LIGHTBOX DE PRÉVIA DA MINIATURA */}
      {previewMediaUrl && (
        <div 
          onClick={() => setPreviewMediaUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-2xl max-h-[85vh] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden p-2 shadow-2xl"
          >
            <button
              onClick={() => setPreviewMediaUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 hover:bg-black text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewMediaUrl}
              alt="Prévia do Criativo"
              className="w-full h-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

