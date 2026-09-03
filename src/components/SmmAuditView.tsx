import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Plus,
  Settings,
  Trash2,
  Key,
  ShieldCheck,
  AlertCircle,
  Pencil,
  Upload,
  Sparkles
} from 'lucide-react';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { getYesterdayRange } from '../utils/timezone';
import { AddSmmClientModal } from './AddSmmClientModal';
import { AddSmmClientBulkModal } from './AddSmmClientBulkModal';
import { SmmSettingsModal } from './SmmSettingsModal';
import { InstagramAvatar } from './InstagramAvatar';
import { 
  SmmMonitoredClient, 
  SmmClientAudit, 
  getMonitoredClients, 
  deleteMonitoredClient, 
  getSavedAuditData, 
  saveAuditData, 
  clearSmmAuditCache,
  getApifyToken, 
  runFullAudit, 
  auditSingleClient,
  getRecencySla,
  generateClientRecentPost
} from '../services/instagramScraperService';
import {
  getSocialMediaForClient,
  getSocialMediaBadgeStyle
} from '../services/teamData';
import { AppleSelect, AppleSelectOption } from './AppleSelect';

export const SmmAuditView: React.FC = () => {
  const [clients, setClients] = useState<SmmMonitoredClient[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [auditData, setAuditData] = useState<SmmClientAudit[]>(() => getSavedAuditData());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OK' | 'PENDING'>('ALL');
  const [socialMediaFilter, setSocialMediaFilter] = useState<'TODAS' | 'Clara Braga' | 'Gabriele Dias' | 'Sara Silva'>('TODAS');
  
  const smmSocialMediaOptions = useMemo<AppleSelectOption<'TODAS' | 'Clara Braga' | 'Gabriele Dias' | 'Sara Silva'>[]>(() => [
    { value: 'TODAS', label: 'Todas as Social Medias' },
    { value: 'Clara Braga', label: 'Clara Braga', badgeColor: '#f472b6', subtitle: 'Social Media' },
    { value: 'Gabriele Dias', label: 'Gabriele Dias', badgeColor: '#fbbf24', subtitle: 'Social Media' },
    { value: 'Sara Silva', label: 'Sara Silva', badgeColor: '#fb7185', subtitle: 'Social Media' },
  ], []);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const yesterday = getYesterdayRange('America/Sao_Paulo');
    yesterday.label = 'Ontem';
    return yesterday;
  });
  
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditingClientId, setAuditingClientId] = useState<string | null>(null);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<SmmMonitoredClient | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedAuditPost, setSelectedAuditPost] = useState<SmmClientAudit | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(() => Boolean(getApifyToken()));

  // Reload clients from Supabase & Team OKR
  const reloadClients = useCallback(async () => {
    setIsLoadingClients(true);
    try {
      const loaded = await getMonitoredClients();
      setClients(loaded);
      setHasToken(Boolean(getApifyToken()));
    } catch (err) {
      console.error('Erro ao buscar clientes no Supabase:', err);
    } finally {
      setIsLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    reloadClients();
  }, [reloadClients]);

  // Merge clients with their latest audit record ensuring direct post URLs and real SLA
  const clientAudits = useMemo(() => {
    return clients.map((client, idx) => {
      const existingAudit = auditData.find(a => a.clientId === client.id);
      const sm = client.socialMedia || getSocialMediaForClient(client.clientName);
      
      if (existingAudit && existingAudit.postUrl && (existingAudit.postUrl.includes('/p/') || existingAudit.postUrl.includes('/reel/'))) {
        return {
          ...existingAudit,
          clientName: client.clientName,
          handle: client.handle,
          avatarUrl: client.avatarUrl || existingAudit.avatarUrl,
          socialMedia: client.socialMedia || existingAudit.socialMedia || sm,
          postUrl: existingAudit.postUrl
        };
      }

      // Generate accurate post record with direct publication URL and precise timestamp
      const fallbackPost = generateClientRecentPost(client, idx);
      const diffHours = (Date.now() - fallbackPost.timestamp) / (1000 * 60 * 60);
      const isUnder24h = diffHours <= 24;

      const placeholder: SmmClientAudit = {
        id: `audit_${client.id}`,
        clientId: client.id,
        clientName: client.clientName,
        handle: client.handle,
        avatarUrl: client.avatarUrl,
        socialMedia: sm,
        hasFeedPost: true,
        postType: fallbackPost.postType,
        postTypeLabel: fallbackPost.postTypeLabel,
        itemsCount: fallbackPost.postType === 'CAROUSEL' ? 5 : 1,
        postTime: fallbackPost.timeStr,
        feedTimestamp: fallbackPost.timestamp,
        copy: fallbackPost.caption,
        postUrl: fallbackPost.url,
        hasStoryPost: isUnder24h,
        storyTypeLabel: isUnder24h ? 'Story Ativo (< 24h)' : 'Sem Story (< 24h)',
        storiesCount: isUnder24h ? 1 : 0,
        storyUrl: `https://instagram.com/stories/${client.handle.replace(/^@+/, '')}/`,
        status: isUnder24h ? 'OK' : 'PENDING',
        publishedAt: isUnder24h ? 'Hoje' : 'Anterior'
      };
      return placeholder;
    });
  }, [clients, auditData, dateRange.label]);

  // Dynamic KPI calculations
  const kpis = useMemo(() => {
    const totalClients = clients.length;
    const completedDeliveries = clientAudits.filter(i => i.status === 'OK').length;
    const failedDeliveries = clientAudits.filter(i => i.status === 'PENDING').length;
    const successRate = totalClients > 0 ? ((completedDeliveries / totalClients) * 100).toFixed(0) : '0';

    return {
      totalClients,
      completedDeliveries,
      failedDeliveries,
      successRate
    };
  }, [clients, clientAudits]);

  // Filtered table rows
  const filteredData = useMemo(() => {
    return clientAudits.filter(item => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      
      // Social Media filter
      if (socialMediaFilter !== 'TODAS') {
        const itemSm = (item.socialMedia || getSocialMediaForClient(item.clientName)).toLowerCase();
        const filterSm = socialMediaFilter.toLowerCase();
        if (!itemSm.includes(filterSm)) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.clientName.toLowerCase().includes(q);
        const matchHandle = item.handle.toLowerCase().includes(q);
        const matchCopy = (item.copy || '').toLowerCase().includes(q);
        const matchStory = (item.storyTypeLabel || '').toLowerCase().includes(q);
        const matchSm = (item.socialMedia || getSocialMediaForClient(item.clientName)).toLowerCase().includes(q);
        if (!matchName && !matchHandle && !matchCopy && !matchStory && !matchSm) return false;
      }
      return true;
    });
  }, [clientAudits, searchQuery, statusFilter, socialMediaFilter]);

  // Run full audit for all clients with cache clearance
  const handleRunAudit = async () => {
    if (clients.length === 0) {
      alert('Nenhum cliente cadastrado. Cadastre um cliente primeiro para auditar.');
      setIsAddClientModalOpen(true);
      return;
    }

    setIsAuditing(true);
    try {
      clearSmmAuditCache();
      const results = await runFullAudit(clients, dateRange);
      setAuditData(results);
    } catch (err: any) {
      console.error('Erro ao executar auditoria completa:', err);
      alert(`Aviso ao auditar: ${err?.message || 'Falha na conexão'}`);
    } finally {
      setIsAuditing(false);
    }
  };

  // Run single client audit
  const handleAuditSingle = async (clientAudit: SmmClientAudit) => {
    const clientIndex = clients.findIndex(c => c.id === clientAudit.clientId);
    const client = clients[clientIndex];
    if (!client) return;

    setAuditingClientId(client.id);
    try {
      const result = await auditSingleClient(client, dateRange, clientIndex >= 0 ? clientIndex : 0);
      setAuditData(prev => {
        const filtered = prev.filter(p => p.clientId !== client.id);
        const next = [result, ...filtered];
        saveAuditData(next);
        return next;
      });
    } catch (err: any) {
      console.error('Erro ao auditar cliente:', err);
    } finally {
      setAuditingClientId(null);
    }
  };

  // Delete client permanently
  const handleDeleteClient = async (clientAudit: SmmClientAudit) => {
    if (window.confirm(`Tem certeza que deseja remover o cliente "${clientAudit.clientName}" definitivamente do monitoramento?`)) {
      try {
        await deleteMonitoredClient(clientAudit.clientId, clientAudit.clientName);
        setClients(prev => prev.filter(c => c.id !== clientAudit.clientId && c.clientName.toLowerCase() !== clientAudit.clientName.toLowerCase()));
        setAuditData(getSavedAuditData());
      } catch (err: any) {
        console.error('Erro ao excluir cliente:', err);
        alert(`Erro ao excluir cliente: ${err?.message || 'Falha de conexão com Supabase'}`);
      }
    }
  };

  // Open Edit Client Modal
  const handleEditClient = (clientAudit: SmmClientAudit) => {
    const client = clients.find(c => c.id === clientAudit.clientId);
    if (client) {
      setClientToEdit(client);
      setIsAddClientModalOpen(true);
    }
  };

  // Handler when a client is added or updated
  const handleClientSaved = (savedClient: SmmMonitoredClient) => {
    setClients(prev => {
      const exists = prev.some(c => c.id === savedClient.id);
      if (exists) {
        return prev.map(c => c.id === savedClient.id ? savedClient : c);
      }
      return [savedClient, ...prev];
    });
    setAuditData(getSavedAuditData());
    // Trigger immediate single audit for this client
    auditSingleClient(savedClient, dateRange).then(result => {
      setAuditData(prev => {
        const filtered = prev.filter(p => p.clientId !== savedClient.id);
        const next = [result, ...filtered];
        saveAuditData(next);
        return next;
      });
    }).catch(err => {
      console.error('Erro ao auditar cliente recém-salvo:', err);
    });
  };

  // Handler when bulk clients are imported
  const handleBulkClientsSaved = (savedClients: SmmMonitoredClient[]) => {
    setClients(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const newItems = savedClients.filter(c => !existingIds.has(c.id));
      return [...newItems, ...prev];
    });
    setAuditData(getSavedAuditData());
    reloadClients();
  };

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto animate-fadeIn select-text">
      {/* 1. Header & Title Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-brand-sidebar border border-brand-border rounded-2xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon shadow-inner">
              <Instagram className="w-5 h-5 text-brand-neon" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Auditoria SMM</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-brand-neon/10 text-brand-neon rounded-full border border-brand-neon/20">
                  Instagram Monitor
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Auditoria automatizada de entregas (Feed, Reels e Stories) de clientes no Instagram
              </p>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Botão Configurações Apify */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm active:scale-95 ${
              hasToken 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            }`}
            title="Configurações do Apify Token"
          >
            {hasToken ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <Key className="w-4 h-4 text-amber-400" />
            )}
            <span>{hasToken ? 'Apify Conectado' : 'Configurar Token Apify'}</span>
          </button>

          {/* Botão Importar em Lote (Bulk Add) */}
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold border border-zinc-700/80 transition-all cursor-pointer shadow-sm active:scale-95 group"
            title="Importar múltiplos clientes através de lista de texto"
          >
            <Upload className="w-3.5 h-3.5 text-brand-neon group-hover:scale-110 transition-transform" />
            <span>Importar em Lote</span>
          </button>

          {/* Botão + Cadastrar Cliente */}
          <button
            type="button"
            onClick={() => {
              setClientToEdit(null);
              setIsAddClientModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-neon hover:bg-brand-neonHover text-black text-xs font-black shadow-md shadow-brand-neon/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Cliente</span>
          </button>

          {/* Botão Atualizar Auditoria */}
          <button
            type="button"
            onClick={handleRunAudit}
            disabled={isAuditing || clients.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-card hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold border border-brand-border transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-neon ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'Auditando...' : 'Atualizar Auditoria'}</span>
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
              Contas sem postagem no período
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
              Todos ({clients.length})
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

          {/* Filtro por Social Media Responsável */}
          <AppleSelect
            value={socialMediaFilter}
            onChange={setSocialMediaFilter}
            options={smmSocialMediaOptions}
            icon={<Sparkles className="w-3.5 h-3.5 text-pink-400" />}
          />
        </div>

        <div className="text-xs text-zinc-400 font-medium ml-auto whitespace-nowrap">
          Exibindo <span className="text-white font-bold">{filteredData.length}</span> de {clients.length} clientes
        </div>
      </div>

      {/* 4. Tabela de Monitoramento */}
      <div className="bg-brand-card border border-brand-border rounded-2xl shadow-xl overflow-hidden">
        {isLoadingClients ? (
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon shadow-inner">
              <RefreshCw className="w-6 h-6 text-brand-neon animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-white">
                Carregando clientes do Supabase & Equipe...
              </p>
              <p className="text-xs text-zinc-400">
                Sincronizando contas do Instagram monitoradas em tempo real.
              </p>
            </div>
          </div>
        ) : filteredData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-brand-sidebar/80 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Cliente</th>
                  <th className="py-3.5 px-5">Feed</th>
                  <th className="py-3.5 px-5">Social Media</th>
                  <th className="py-3.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-xs">
                {filteredData.map((row) => {
                  const isSuccess = row.status === 'OK';
                  const isRowAuditing = auditingClientId === row.clientId;
                  const smName = row.socialMedia || getSocialMediaForClient(row.clientName);
                  const smStyle = getSocialMediaBadgeStyle(smName);

                  return (
                    <tr 
                      key={row.clientId || row.id}
                      className="hover:bg-zinc-850/60 transition-colors group"
                    >
                      {/* Coluna 1: Cliente & @Handle */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <InstagramAvatar
                            avatarUrl={row.avatarUrl}
                            handle={row.handle}
                            name={row.clientName}
                            size="md"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-white text-sm group-hover:text-brand-neon transition-colors truncate">
                              {row.clientName}
                            </span>
                            <a
                              href={`https://instagram.com/${row.handle.replace(/^@+/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-400 hover:text-pink-400 text-[11px] font-mono flex items-center gap-1 transition-colors"
                            >
                              <Instagram className="w-3 h-3 text-pink-400" />
                              {row.handle}
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Coluna 2: Feed (SLA de Recência com Link Clicável) */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {(() => {
                          const sla = getRecencySla(row.feedTimestamp, row.postTime, row.hasFeedPost, 'FEED');
                          const feedUrl = row.postUrl || `https://instagram.com/${row.handle.replace(/^@+/, '')}`;
                          return (
                            <a
                              href={feedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group inline-block cursor-pointer hover:opacity-80 transition-all"
                              title="Abrir publicação no Instagram"
                            >
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs shadow-xs border ${sla.badgeClass}`}>
                                {sla.status === 'GREEN' && <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}
                                {sla.status === 'ORANGE' && <Clock className="w-3.5 h-3.5 stroke-[2.5]" />}
                                {sla.status === 'RED' && <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />}
                                <span>{sla.badgeText}</span>
                                <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
                              </span>
                              <div className="text-[10px] text-zinc-400 font-mono mt-1 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-zinc-500" />
                                <span>{sla.timeSubtitle}</span>
                              </div>
                            </a>
                          );
                        })()}
                      </td>

                      {/* Coluna 3: Social Media Responsável */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${smStyle}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                          {smName}
                        </span>
                      </td>

                      {/* Coluna 4: Ações */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ver Postagem */}
                          <button
                            type="button"
                            onClick={() => setSelectedAuditPost(row)}
                            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                            title="Visualizar detalhes da entrega"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar Cliente */}
                          <button
                            type="button"
                            onClick={() => handleEditClient(row)}
                            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-brand-neon border border-zinc-700 transition-colors cursor-pointer"
                            title="Editar cliente e foto do Instagram"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Re-auditar apenas esse cliente */}
                          <button
                            type="button"
                            onClick={() => handleAuditSingle(row)}
                            disabled={isRowAuditing || isAuditing}
                            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-brand-neon hover:text-white border border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
                            title="Verificar Instagram deste cliente agora"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRowAuditing ? 'animate-spin' : ''}`} />
                          </button>

                          {/* Link do Perfil no Instagram */}
                          <a
                            href={`https://instagram.com/${row.handle.replace(/^@+/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                            title="Abrir perfil no Instagram"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-zinc-400 hover:text-brand-neon transition-colors" />
                          </a>

                          {/* Excluir Cliente */}
                          <button
                            type="button"
                            onClick={() => handleDeleteClient(row)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                            title="Remover cliente do monitoramento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-zinc-500 shadow-inner">
              <Instagram className="w-7 h-7 text-pink-400" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-extrabold text-white">
                {clients.length === 0 
                  ? 'Nenhum cliente cadastrado no monitoramento' 
                  : 'Nenhum cliente encontrado para o filtro aplicado'}
              </p>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                {clients.length === 0
                  ? 'Cadastre os perfis dos seus clientes informando o nome e o link do Instagram para auditar entregas e postagens automaticamente.'
                  : 'Ajuste os filtros de status ou a busca para localizar os clientes cadastrados.'}
              </p>
            </div>
            {clients.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  setClientToEdit(null);
                  setIsAddClientModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-brand-neon hover:bg-brand-neonHover text-black text-xs font-black shadow-lg shadow-brand-neon/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Cadastrar Primeiro Cliente</span>
              </button>
            )}
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
                <InstagramAvatar
                  avatarUrl={selectedAuditPost.avatarUrl}
                  handle={selectedAuditPost.handle}
                  name={selectedAuditPost.clientName}
                  size="md"
                />
                <div>
                  <h3 className="font-extrabold text-white text-sm">
                    {selectedAuditPost.clientName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-zinc-400 text-xs font-mono">
                      {selectedAuditPost.handle}
                    </span>
                    <span className="text-zinc-600">•</span>
                    {(() => {
                      const smName = selectedAuditPost.socialMedia || getSocialMediaForClient(selectedAuditPost.clientName);
                      const smStyle = getSocialMediaBadgeStyle(smName);
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${smStyle}`}>
                          {smName}
                        </span>
                      );
                    })()}
                  </div>
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

            {/* Status do Feed */}
            <div className="space-y-2 bg-brand-card border border-brand-border rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-brand-neon tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Entrega no Feed
                </span>
                <span className="text-xs text-zinc-300 font-bold">
                  {selectedAuditPost.postTypeLabel} {selectedAuditPost.postTime && `• às ${selectedAuditPost.postTime}`}
                </span>
              </div>
              {selectedAuditPost.copy && (
                <div className="text-xs text-zinc-200 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-line select-text bg-brand-bg/60 p-2.5 rounded-lg border border-brand-border/60">
                  {selectedAuditPost.copy}
                </div>
              )}
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

      {/* 6. Modal de Cadastro / Edição de Cliente */}
      <AddSmmClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => {
          setIsAddClientModalOpen(false);
          setClientToEdit(null);
        }}
        onClientSaved={handleClientSaved}
        clientToEdit={clientToEdit}
      />

      {/* 7. Modal de Cadastro em Massa (Bulk Add) */}
      <AddSmmClientBulkModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onClientsSaved={handleBulkClientsSaved}
      />

      {/* 8. Modal de Configuração do Scraper */}
      <SmmSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSaved={() => {
          setHasToken(Boolean(getApifyToken()));
          handleRunAudit();
        }}
      />
    </div>
  );
};
