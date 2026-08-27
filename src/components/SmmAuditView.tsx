import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  ExternalLink, 
  Instagram, 
  RefreshCw, 
  Film, 
  Layers, 
  Image as ImageIcon, 
  Eye,
  Clock,
  Sparkles,
  Filter
} from 'lucide-react';

export interface SmmClientAudit {
  id: string;
  clientName: string;
  handle: string;
  avatarUrl?: string;
  postType: 'CAROUSEL' | 'REELS' | 'STATIC' | 'NONE';
  postTypeLabel: string;
  itemsCount?: number;
  postTime?: string;
  copy: string;
  postUrl?: string;
  status: 'OK' | 'PENDING';
  publishedAt: string;
}

export const mockAuditData: SmmClientAudit[] = [
  {
    id: 'smm-1',
    clientName: 'Dra. Samara',
    handle: '@dra.samara',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813682-14022a107386?auto=format&fit=crop&w=120&q=80',
    postType: 'CAROUSEL',
    postTypeLabel: 'Carrossel (7 fotos)',
    itemsCount: 7,
    postTime: '18:42',
    copy: 'Os 5 maiores erros no pós-procedimento facial que você precisa evitar para garantir resultados perfeitos e duradouros na harmonização.',
    postUrl: 'https://instagram.com/dra.samara',
    status: 'OK',
    publishedAt: 'Ontem'
  },
  {
    id: 'smm-2',
    clientName: 'Clínica Harmonize',
    handle: '@harmonizapro',
    avatarUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=120&q=80',
    postType: 'REELS',
    postTypeLabel: 'Vídeo/Reels',
    postTime: '12:15',
    copy: 'Transformação real em menos de 30 dias com o protocolo HarmonizaPro. Assista até o final e veja o relato emocionante da paciente.',
    postUrl: 'https://instagram.com/harmonizapro',
    status: 'OK',
    publishedAt: 'Ontem'
  },
  {
    id: 'smm-3',
    clientName: 'Instituto Facial',
    handle: '@institutofacial',
    avatarUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=120&q=80',
    postType: 'NONE',
    postTypeLabel: 'Sem Postagem',
    copy: 'Nenhuma postagem ou entrega detectada no feed nas últimas 24 horas.',
    status: 'PENDING',
    publishedAt: 'Ontem'
  },
  {
    id: 'smm-4',
    clientName: 'Pietro Boscardin',
    handle: '@pietro.boscardin',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&q=80',
    postType: 'REELS',
    postTypeLabel: 'Vídeo/Reels',
    postTime: '19:30',
    copy: 'Como estruturar processos de vendas de alto ticket na sua clínica estética sem depender de descontos na primeira consulta.',
    postUrl: 'https://instagram.com/pietro.boscardin',
    status: 'OK',
    publishedAt: 'Ontem'
  },
  {
    id: 'smm-5',
    clientName: 'Bella Estética Avançada',
    handle: '@bella.estetica',
    avatarUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=120&q=80',
    postType: 'STATIC',
    postTypeLabel: 'Estático',
    postTime: '09:10',
    copy: 'Novidade exclusiva: agendamentos abertos para a nova temporada de bioestimuladores de colágeno com condições especiais.',
    postUrl: 'https://instagram.com/bella.estetica',
    status: 'OK',
    publishedAt: 'Ontem'
  }
];

export const SmmAuditView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OK' | 'PENDING'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAuditPost, setSelectedAuditPost] = useState<SmmClientAudit | null>(null);

  // Dynamic KPI calculations
  const kpis = useMemo(() => {
    const totalClients = mockAuditData.length;
    const completedDeliveries = mockAuditData.filter(i => i.status === 'OK').length;
    const failedDeliveries = mockAuditData.filter(i => i.status === 'PENDING').length;
    const successRate = totalClients > 0 ? ((completedDeliveries / totalClients) * 100).toFixed(0) : '0';

    return {
      totalClients,
      completedDeliveries,
      failedDeliveries,
      successRate
    };
  }, []);

  // Filtered table rows
  const filteredData = useMemo(() => {
    return mockAuditData.filter(item => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.clientName.toLowerCase().includes(q);
        const matchHandle = item.handle.toLowerCase().includes(q);
        const matchCopy = item.copy.toLowerCase().includes(q);
        if (!matchName && !matchHandle && !matchCopy) return false;
      }
      return true;
    });
  }, [searchQuery, statusFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto animate-fadeIn select-text">
      {/* 1. Header & Title Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-brand-sidebar border border-brand-border rounded-2xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon shadow-inner">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Auditoria SMM (Entregas de Ontem)
                <span className="text-xs bg-zinc-800 text-zinc-300 font-bold px-2.5 py-0.5 rounded-full border border-zinc-700">
                  Apify Engine
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Monitoramento automatizado de postagens no feed e stories dos clientes gerenciados.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-card hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold border border-brand-border transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-neon ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Atualizando...' : 'Atualizar Auditoria'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Clientes Monitorados */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 shadow-lg flex items-center justify-between hover:border-brand-neon/40 transition-all group">
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              Clientes Monitorados
            </span>
            <div className="text-3xl font-black text-white tracking-tight">
              {kpis.totalClients}
            </div>
            <span className="text-[11px] text-zinc-500 font-medium">
              Contas de Instagram ativas
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-zinc-400 group-hover:text-brand-neon transition-colors shadow-inner">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Entregas Concluídas */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 shadow-lg flex items-center justify-between hover:border-emerald-500/40 transition-all group">
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Entregas Concluídas
            </span>
            <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
              {kpis.completedDeliveries}
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {kpis.successRate}% taxa de entrega
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 font-medium">
              Postagens identificadas no feed
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Falhas de Postagem */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 shadow-lg flex items-center justify-between hover:border-rose-500/40 transition-all group">
          <div className="space-y-1">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Falhas de Postagem
            </span>
            <div className="text-3xl font-black text-white tracking-tight">
              {kpis.failedDeliveries}
            </div>
            <span className="text-[11px] text-zinc-500 font-medium">
              Contas sem postagem nas últimas 24h
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Filter and Search Toolbar */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Keyword Search */}
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar cliente, @handle ou texto da copy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-all"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-brand-bg border border-brand-border rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Todos ({mockAuditData.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('OK')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'OK'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Entregues ({kpis.completedDeliveries})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'PENDING'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Falhas ({kpis.failedDeliveries})
            </button>
          </div>
        </div>

        <div className="text-xs text-zinc-400 font-medium">
          Exibindo <span className="text-white font-bold">{filteredData.length}</span> de {mockAuditData.length} clientes
        </div>
      </div>

      {/* 4. Tabela de Monitoramento Moderna */}
      <div className="bg-brand-card border border-brand-border rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-border bg-brand-sidebar/80 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Cliente</th>
                <th className="py-3.5 px-5">Feed (Ontem)</th>
                <th className="py-3.5 px-5">Legenda / Copy</th>
                <th className="py-3.5 px-5 text-center">Status Geral</th>
                <th className="py-3.5 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60 text-xs">
              {filteredData.map((row) => {
                const isSuccess = row.status === 'OK';

                return (
                  <tr 
                    key={row.id}
                    className="hover:bg-zinc-850/60 transition-colors group"
                  >
                    {/* Coluna 1: Cliente & @Handle */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {row.avatarUrl ? (
                          <img
                            src={row.avatarUrl}
                            alt={row.clientName}
                            className="w-10 h-10 rounded-full object-cover border border-zinc-700 shadow-md group-hover:border-brand-neon transition-colors shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-neon to-emerald-400 text-black font-black text-xs flex items-center justify-center border border-zinc-700 shrink-0">
                            {row.clientName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-extrabold text-white text-sm group-hover:text-brand-neon transition-colors truncate">
                            {row.clientName}
                          </span>
                          <span className="text-zinc-400 text-[11px] font-mono flex items-center gap-1">
                            <Instagram className="w-3 h-3 text-pink-400" />
                            {row.handle}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Coluna 2: Feed (Ontem) */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      {row.postType === 'CAROUSEL' && (
                        <span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-lg font-bold text-xs shadow-xs">
                          <Layers className="w-3.5 h-3.5" />
                          {row.postTypeLabel}
                        </span>
                      )}

                      {row.postType === 'REELS' && (
                        <span className="inline-flex items-center gap-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-lg font-bold text-xs shadow-xs">
                          <Film className="w-3.5 h-3.5" />
                          {row.postTypeLabel}
                        </span>
                      )}

                      {row.postType === 'STATIC' && (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-lg font-bold text-xs shadow-xs">
                          <ImageIcon className="w-3.5 h-3.5" />
                          {row.postTypeLabel}
                        </span>
                      )}

                      {row.postType === 'NONE' && (
                        <span className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-lg font-bold text-xs shadow-xs">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Sem Postagem
                        </span>
                      )}

                      {row.postTime && (
                        <div className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          Publicado às {row.postTime}
                        </div>
                      )}
                    </td>

                    {/* Coluna 3: Legenda/Copy (Truncada 1 Linha) */}
                    <td className="py-4 px-5 max-w-md">
                      <p 
                        onClick={() => setSelectedAuditPost(row)}
                        className={`truncate text-xs leading-relaxed cursor-pointer hover:underline ${
                          isSuccess ? 'text-zinc-300 hover:text-white' : 'text-zinc-500 italic'
                        }`}
                        title={row.copy}
                      >
                        {row.copy}
                      </p>
                    </td>

                    {/* Coluna 4: Status Geral (Semáforo) */}
                    <td className="py-4 px-5 text-center whitespace-nowrap">
                      {isSuccess ? (
                        <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold text-xs shadow-xs">
                          <CheckCircle2 className="w-4 h-4 fill-emerald-500/20 text-emerald-400 stroke-[2.5]" />
                          <span>OK</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full font-bold text-xs shadow-xs">
                          <XCircle className="w-4 h-4 fill-rose-500/20 text-rose-400 stroke-[2.5]" />
                          <span>Falhou</span>
                        </div>
                      )}
                    </td>

                    {/* Coluna 5: Ações */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedAuditPost(row)}
                          className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                          title="Visualizar detalhes da entrega"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {row.postUrl && (
                          <a
                            href={row.postUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                            title="Abrir Instagram oficial"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-brand-neon transition-colors" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="p-12 text-center text-zinc-500 text-xs">
            Nenhum registro de auditoria encontrado para o filtro aplicado.
          </div>
        )}
      </div>

      {/* 5. Modal de Detalhes da Postagem / Copy */}
      {selectedAuditPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedAuditPost(null)}
        >
          <div
            className="bg-brand-sidebar border border-brand-border rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4 text-white animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon font-black text-xs">
                  {selectedAuditPost.clientName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">
                    {selectedAuditPost.clientName}
                  </h3>
                  <span className="text-zinc-400 text-xs font-mono">
                    {selectedAuditPost.handle}
                  </span>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                selectedAuditPost.status === 'OK'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {selectedAuditPost.status === 'OK' ? 'Postado com Sucesso' : 'Sem Postagem'}
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-brand-neon tracking-wider">
                Tipo de Postagem
              </span>
              <div className="text-xs text-zinc-200 font-semibold">
                {selectedAuditPost.postTypeLabel} {selectedAuditPost.postTime && `• às ${selectedAuditPost.postTime}`}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-brand-neon tracking-wider">
                Legenda / Copy Completa
              </span>
              <div className="bg-brand-card border border-brand-border rounded-xl p-4 text-xs text-zinc-200 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-line select-text">
                {selectedAuditPost.copy}
              </div>
            </div>

            <div className="pt-2 border-t border-brand-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedAuditPost(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
              >
                Fechar
              </button>
              {selectedAuditPost.postUrl && (
                <a
                  href={selectedAuditPost.postUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-brand-neon hover:bg-brand-neonHover text-black text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Ver no Instagram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
