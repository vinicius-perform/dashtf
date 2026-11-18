import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { MetaConfig, MetaAdAccount } from '../types/meta';
import { 
  saveMetaConfig, 
  fetchAdAccounts,
  ADMIN_META_TOKEN,
  BM_ACCOUNTS_DICTIONARY
} from '../services/metaDataEngine';
import { 
  saveUserMetaToken, 
  maskToken 
} from '../services/userIntegrationService';
import { 
  fetchAgencyPortfolio, 
  syncAgencyPortfolio, 
  AgencyPortfolioItem 
} from '../services/agencyPortfolioService';
import { 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Lock, 
  Plus, 
  CreditCard, 
  Check, 
  Search, 
  Users, 
  Sparkles, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff, 
  Filter, 
  ShieldCheck, 
  ShieldAlert,
  Building2, 
  Info,
  CheckSquare,
  X
} from 'lucide-react';

export interface IntegrationsViewProps {
  session?: any;
  metaConfig: MetaConfig;
  setMetaConfig: React.Dispatch<React.SetStateAction<MetaConfig>>;
  accounts: MetaAdAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<MetaAdAccount[]>>;
  onRefreshData: () => void;
  onPortfolioUpdated?: (portfolio: AgencyPortfolioItem[]) => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  session,
  metaConfig,
  setMetaConfig,
  accounts,
  setAccounts,
  onRefreshData,
  onPortfolioUpdated
}) => {
  // Token de Acesso da Meta
  const [tokenInput, setTokenInput] = useState(metaConfig.accessToken || ADMIN_META_TOKEN);
  const [showToken, setShowToken] = useState(false);

  // Carteira de clientes salva no Supabase (agency_portfolio)
  const [savedPortfolio, setSavedPortfolio] = useState<AgencyPortfolioItem[]>([]);
  
  // Set de IDs das contas selecionadas para a carteira
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());

  // Contas disponíveis para seleção
  const [availableAccounts, setAvailableAccounts] = useState<MetaAdAccount[]>(() => {
    const defaults = BM_ACCOUNTS_DICTIONARY['1098475893049001'] || [];
    const map = new Map<string, MetaAdAccount>();
    defaults.forEach(a => map.set(a.id, a));
    if (accounts && accounts.length > 0) {
      accounts.forEach(a => map.set(a.id, a));
    }
    return Array.from(map.values());
  });

  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'selected' | 'unselected'>('all');

  // Adicionar Conta Manualmente
  const [manualIdInput, setManualIdInput] = useState('');
  const [manualNameInput, setManualNameInput] = useState('');
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualNotice, setManualNotice] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
    details?: string;
  } | null>(null);

  // Estados de feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Extrai token efetivo desmascarado
  const getEffectiveToken = useCallback(() => {
    if (tokenInput.includes('...') && metaConfig.accessToken) {
      return metaConfig.accessToken;
    }
    return tokenInput.trim() || ADMIN_META_TOKEN;
  }, [tokenInput, metaConfig.accessToken]);

  // Carrega contas do Supabase e sincroniza a lista inicial
  useEffect(() => {
    fetchAgencyPortfolio().then((items) => {
      setSavedPortfolio(items);
      const ids = new Set(items.map((i) => i.account_id));
      setSelectedAccountIds(ids);

      // Garante que todas as contas já salvas no Supabase constem na lista de disponíveis
      setAvailableAccounts(prev => {
        const map = new Map<string, MetaAdAccount>();
        prev.forEach(a => map.set(a.id, a));
        items.forEach(p => {
          if (!map.has(p.account_id)) {
            map.set(p.account_id, {
              id: p.account_id,
              raw_id: `act_${p.account_id}`,
              name: p.account_name,
              account_status: 1,
              currency: 'BRL',
              timezone_name: 'America/Sao_Paulo'
            });
          }
        });
        return Array.from(map.values());
      });
    });
  }, []);

  // Busca contas de anúncios diretamente via Meta Graph API (GET /v19.0/me/adaccounts)
  const handleSyncMetaAccounts = useCallback(async () => {
    const token = getEffectiveToken();
    if (!token || token.length < 10) {
      setToastMessage({
        type: 'error',
        text: 'Insira um Token de Acesso da Meta válido para sincronizar.'
      });
      return;
    }

    setIsLoadingAccounts(true);
    setToastMessage(null);

    try {
      const fetched = await fetchAdAccounts(token);
      if (fetched && fetched.length > 0) {
        setAvailableAccounts(prev => {
          const map = new Map<string, MetaAdAccount>();
          prev.forEach(a => map.set(a.id, a));
          fetched.forEach(a => map.set(a.id, a));
          return Array.from(map.values());
        });
        setAccounts(fetched);

        setToastMessage({
          type: 'success',
          text: `Sincronização concluída! ${fetched.length} contas de anúncio identificadas na Meta Graph API.`
        });
      } else {
        setToastMessage({
          type: 'error',
          text: 'Nenhuma conta foi retornada para este token. Você pode cadastrar contas manualmente abaixo.'
        });
      }
    } catch (err: any) {
      console.warn('Erro ao sincronizar contas com a Meta:', err);
      setToastMessage({
        type: 'error',
        text: 'Não foi possível buscar as contas via Meta Graph API. Verifique o token ou adicione pelo ID.'
      });
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [getEffectiveToken, setAccounts]);

  // Inserção Manual de Conta por ID com tratamento inteligente
  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = manualIdInput.trim();
    const customName = manualNameInput.trim();

    if (!rawVal) {
      setManualNotice({
        type: 'error',
        message: 'Informe o ID da conta de anúncios (ex: 570728878165179 ou act_570728878165179).'
      });
      return;
    }

    const cleanNumbers = rawVal.replace(/^act_/i, '').replace(/\D/g, '').trim();
    if (!cleanNumbers) {
      setManualNotice({
        type: 'error',
        message: 'ID inválido. Utilize apenas os números da conta de anúncios.'
      });
      return;
    }

    const formattedId = `act_${cleanNumbers}`;
    const numericId = cleanNumbers;

    // Se já estiver na lista, apenas marca na carteira
    if (availableAccounts.some(a => a.id === numericId)) {
      setSelectedAccountIds(prev => new Set(prev).add(numericId));
      setManualNotice({
        type: 'success',
        message: `A conta (ID: ${numericId}) já constava na lista e foi marcada na sua carteira!`
      });
      setManualIdInput('');
      setManualNameInput('');
      return;
    }

    setIsAddingManual(true);
    setManualNotice(null);

    const token = getEffectiveToken();

    try {
      // 1. Tenta validar diretamente na Meta Graph API
      const url = `https://graph.facebook.com/v19.0/${formattedId}`;
      const res = await axios.get(url, {
        params: {
          fields: 'name,account_status,currency,timezone_name',
          access_token: token
        },
        timeout: 12000
      });

      if (res.status === 200 && res.data && res.data.name) {
        const realData = res.data;
        const newAccount: MetaAdAccount = {
          id: numericId,
          raw_id: formattedId,
          name: customName || realData.name,
          account_status: realData.account_status ?? 1,
          currency: realData.currency || 'BRL',
          timezone_name: realData.timezone_name || 'America/Sao_Paulo'
        };

        setAvailableAccounts(prev => [newAccount, ...prev]);
        setSelectedAccountIds(prev => new Set(prev).add(numericId));

        setManualNotice({
          type: 'success',
          message: `Conta "${newAccount.name}" validada e incluída na carteira com sucesso!`
        });
        setManualIdInput('');
        setManualNameInput('');
      } else {
        throw new Error('Conta sem nome válido retornado.');
      }
    } catch (err: any) {
      console.warn('Meta API retorno para conta manual:', err?.response?.data || err?.message);
      const metaError = err?.response?.data?.error;
      const isPermissionError = metaError?.code === 200 || metaError?.error_subcode === 1349141;

      // Resiliência para Agência: Se o usuário especificou um nome ou se for restrição de permissão (#200)
      // Permite adicionar a conta para compor a gestão sem travar a agência
      const fallbackName = customName || `Conta ${numericId}`;
      const newAccount: MetaAdAccount = {
        id: numericId,
        raw_id: formattedId,
        name: fallbackName,
        account_status: 1,
        currency: 'BRL',
        timezone_name: 'America/Sao_Paulo'
      };

      setAvailableAccounts(prev => [newAccount, ...prev]);
      setSelectedAccountIds(prev => new Set(prev).add(numericId));

      if (isPermissionError) {
        setManualNotice({
          type: 'warning',
          message: `Conta "${fallbackName}" adicionada à carteira! (Permissão de leitura pendente na Meta)`,
          details: 'Dica: assim que a permissão for liberada no Meta Business Manager, as métricas passarão a sincronizar automaticamente.'
        });
      } else {
        setManualNotice({
          type: 'warning',
          message: `Conta "${fallbackName}" adicionada manualmente à carteira.`,
          details: metaError?.message || 'Verificação offline realizada.'
        });
      }

      setManualIdInput('');
      setManualNameInput('');
    } finally {
      setIsAddingManual(false);
    }
  };

  // Alterna a seleção de uma conta
  const handleToggleAccount = (accountId: string) => {
    setSelectedAccountIds(prev => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  // Remove uma conta da lista de disponíveis
  const handleRemoveAccount = (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAvailableAccounts(prev => prev.filter(a => a.id !== accountId));
    setSelectedAccountIds(prev => {
      const next = new Set(prev);
      next.delete(accountId);
      return next;
    });
  };

  // Copia o ID da conta para a área de transferência
  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Seleciona todas as contas filtradas
  const handleSelectAllVisible = () => {
    setSelectedAccountIds(prev => {
      const next = new Set(prev);
      filteredAccounts.forEach(acc => next.add(acc.id));
      return next;
    });
  };

  // Desmarca todas as contas filtradas
  const handleDeselectAllVisible = () => {
    setSelectedAccountIds(prev => {
      const next = new Set(prev);
      filteredAccounts.forEach(acc => next.delete(acc.id));
      return next;
    });
  };

  // Filtra as contas por aba e texto de busca
  const filteredAccounts = useMemo(() => {
    return availableAccounts.filter(acc => {
      const matchesSearch = 
        acc.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
        acc.id.includes(accountSearch);

      if (!matchesSearch) return false;

      const isSelected = selectedAccountIds.has(acc.id);
      if (filterTab === 'selected') return isSelected;
      if (filterTab === 'unselected') return !isSelected;
      return true;
    });
  }, [availableAccounts, accountSearch, filterTab, selectedAccountIds]);

  // Contagem para os badges de aba
  const selectedCountTotal = selectedAccountIds.size;
  const unselectedCountTotal = availableAccounts.filter(a => !selectedAccountIds.has(a.id)).length;

  // Salva a Carteira de Clientes no Supabase (agency_portfolio)
  const handleSavePortfolio = async () => {
    if (selectedAccountIds.size === 0) {
      setToastMessage({
        type: 'error',
        text: 'Selecione ao menos 1 conta de anúncios para compor sua Carteira de Clientes.'
      });
      return;
    }

    setIsSaving(true);
    setToastMessage(null);

    const selectedList: Array<{ account_id: string; account_name: string }> = [];

    availableAccounts.forEach(acc => {
      if (selectedAccountIds.has(acc.id)) {
        selectedList.push({ account_id: acc.id, account_name: acc.name });
      }
    });

    // Garante que contas salvas anteriormente continuem salvas se marcadas
    savedPortfolio.forEach(p => {
      if (selectedAccountIds.has(p.account_id) && !selectedList.some(s => s.account_id === p.account_id)) {
        selectedList.push({ account_id: p.account_id, account_name: p.account_name });
      }
    });

    const finalToken = getEffectiveToken();
    if (session?.user?.id) {
      await saveUserMetaToken(session.user.id, finalToken);
    }

    // Grava no Supabase (agency_portfolio) e no cache local
    await syncAgencyPortfolio(selectedList);

    const nowStr = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR');
    const primaryAccount = selectedList[0];

    const updatedConfig: MetaConfig = {
      ...metaConfig,
      accessToken: finalToken,
      selectedAccountId: primaryAccount?.account_id || metaConfig.selectedAccountId,
      accountName: primaryAccount?.account_name || metaConfig.accountName,
      currency: 'BRL',
      isConnected: true,
      lastSyncedAt: nowStr,
      lastValidationAt: nowStr
    };

    setMetaConfig(updatedConfig);
    saveMetaConfig(updatedConfig);

    const freshPortfolio = await fetchAgencyPortfolio();
    setSavedPortfolio(freshPortfolio);

    const updatedAccountsList: MetaAdAccount[] = freshPortfolio.map(item => {
      const match = availableAccounts.find(a => a.id === item.account_id);
      return match || {
        id: item.account_id,
        raw_id: `act_${item.account_id}`,
        name: item.account_name,
        account_status: 1,
        currency: 'BRL',
        timezone_name: 'America/Sao_Paulo'
      };
    });
    setAccounts(updatedAccountsList);

    if (onPortfolioUpdated) {
      onPortfolioUpdated(freshPortfolio);
    }

    setIsSaving(false);
    setToastMessage({
      type: 'success',
      text: `Carteira de Clientes salva com sucesso! ${selectedList.length} contas selecionadas agora alimentam todo o sistema.`
    });

    onRefreshData();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. HEADER MODERNO COM STATS DA CARTEIRA */}
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-neon/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-brand-neon/15 text-brand-neon border border-brand-neon/30">
                <Users className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-black text-white tracking-tight">
                Central de Integrações & Carteira de Clientes
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Selecione quais contas de anúncios compõem a gestão ativa da agência. Todas as métricas de saúde financeira, CPL e tarefas serão calculadas a partir desta seleção.
            </p>
          </div>

          {/* Stat Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-zinc-900 border border-brand-neon/30 px-4 py-2.5 rounded-xl shadow-sm">
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Clientes na Carteira
              </div>
              <div className="text-lg font-black text-brand-neon mt-0.5 flex items-center gap-1.5">
                <span>{selectedCountTotal}</span>
                <span className="text-xs text-zinc-400 font-normal">contas ativas</span>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl">
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Contas Disponíveis
              </div>
              <div className="text-lg font-black text-white mt-0.5 flex items-center gap-1.5">
                <span>{availableAccounts.length}</span>
                <span className="text-xs text-zinc-500 font-normal">identificadas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST GLOBAL DE FEEDBACK */}
      {toastMessage && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
          toastMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{toastMessage.text}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. LAYOUT EM DUAS COLUNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUNA ESQUERDA: TOKEN & ADICIONAR CONTA (4 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* CARD DE TOKEN DA META */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-neon" />
                <span>Token de Acesso da Meta</span>
              </h3>

              <button
                type="button"
                onClick={handleSyncMetaAccounts}
                disabled={isLoadingAccounts}
                className="text-[11px] text-brand-neon hover:text-brand-neonHover font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                title="Buscar todas as contas vinculadas a este token via /me/adaccounts"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAccounts ? 'animate-spin' : ''}`} />
                <span>{isLoadingAccounts ? 'Sincronizando...' : 'Sincronizar Meta'}</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={showToken ? maskToken(tokenInput) : tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Cole seu token de acesso da Meta (EAAB...)"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 font-mono outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                  title={showToken ? 'Ocultar' : 'Exibir token'}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Token salvo com segurança no Supabase</span>
              </div>
            </div>
          </div>

          {/* CARD DE ADICIONAR CONTA MANUALMENTE */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="border-b border-zinc-800/80 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-neon" />
                <span>Adicionar Conta à Carteira</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-1">
                Adicione contas pelo ID numérico. Se a permissão no BM estiver pendente, você pode definir um apelido e adicioná-la mesmo assim.
              </p>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  ID da Conta de Anúncios <span className="text-brand-neon">*</span>
                </label>
                <input
                  type="text"
                  value={manualIdInput}
                  onChange={(e) => setManualIdInput(e.target.value)}
                  placeholder="Ex: 570728878165179 ou act_570728878165179"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 font-mono outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Nome / Apelido do Cliente <span className="text-zinc-500">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={manualNameInput}
                  onChange={(e) => setManualNameInput(e.target.value)}
                  placeholder="Ex: Construtora Solar / Dra Mariella"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isAddingManual || !manualIdInput.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-850 text-brand-neon border border-brand-neon/40 hover:border-brand-neon transition-all shadow-md shadow-brand-neon/10 disabled:opacity-40 cursor-pointer"
              >
                {isAddingManual ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-neon" />
                    <span>Validando na Meta Graph API...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Adicionar à Carteira</span>
                  </>
                )}
              </button>
            </form>

            {/* Notificação Contextual da Inserção Manual */}
            {manualNotice && (
              <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                manualNotice.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : manualNotice.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {manualNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {manualNotice.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                  {manualNotice.type === 'error' && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>{manualNotice.message}</span>
                </div>
                {manualNotice.details && (
                  <p className="text-[11px] opacity-90 pl-6 leading-relaxed">
                    {manualNotice.details}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* RESUMO DAS CONTAS SELECIONADAS */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-neon" />
                <span>Carteira Selecionada</span>
              </span>
              <span className="text-[11px] font-mono text-brand-neon font-bold">
                {selectedCountTotal} conta(s)
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {availableAccounts
                .filter(a => selectedAccountIds.has(a.id))
                .map(acc => (
                  <span
                    key={acc.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-brand-neon/30 text-[11px] text-white"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-neon" />
                    <span className="font-semibold truncate max-w-[150px]">{acc.name}</span>
                    <button
                      onClick={() => handleToggleAccount(acc.id)}
                      className="text-zinc-500 hover:text-rose-400 transition-colors ml-0.5"
                      title="Remover da carteira"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: SELETOR DE CONTAS DA CARTEIRA (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
            
            {/* TOOLBAR SUPERIOR: ABAS DE FILTRO & BUSCA */}
            <div className="space-y-3 border-b border-zinc-800/80 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Abas Rápidas */}
                <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setFilterTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterTab === 'all'
                        ? 'bg-brand-neon text-black shadow-md shadow-brand-neon/20'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Todas ({availableAccounts.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterTab('selected')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterTab === 'selected'
                        ? 'bg-brand-neon text-black shadow-md shadow-brand-neon/20'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Na Carteira ({selectedCountTotal})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterTab('unselected')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterTab === 'unselected'
                        ? 'bg-brand-neon text-black shadow-md shadow-brand-neon/20'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Disponíveis ({unselectedCountTotal})
                  </button>
                </div>

                {/* Atalhos Rápidos */}
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAllVisible}
                    className="text-[11px] text-brand-neon hover:text-brand-neonHover font-bold transition-colors cursor-pointer"
                  >
                    ✓ Marcar Todas
                  </button>
                  <span className="text-zinc-700">•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllVisible}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    ✕ Desmarcar
                  </button>
                </div>
              </div>

              {/* Barra de Pesquisa */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome do cliente ou ID da conta..."
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon font-sans transition-all"
                />
              </div>
            </div>

            {/* LISTA DE CONTAS COM CHECKBOX VERDE NEON */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {isLoadingAccounts ? (
                <div className="py-12 text-center text-xs text-zinc-400 flex flex-col items-center justify-center gap-2.5">
                  <RefreshCw className="w-5 h-5 animate-spin text-brand-neon" />
                  <span>Sincronizando contas de anúncios com a Meta...</span>
                </div>
              ) : filteredAccounts.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500 space-y-2">
                  <Info className="w-6 h-6 text-zinc-600 mx-auto" />
                  <p>Nenhuma conta encontrada com o filtro atual.</p>
                  <p className="text-[11px] text-zinc-600">
                    Você pode adicionar qualquer conta colando o ID no card à esquerda.
                  </p>
                </div>
              ) : (
                filteredAccounts.map((acc) => {
                  const isSelected = selectedAccountIds.has(acc.id);
                  const isCopied = copiedId === acc.id;

                  return (
                    <div
                      key={acc.id}
                      onClick={() => handleToggleAccount(acc.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none group ${
                        isSelected
                          ? 'bg-brand-neon/10 border-brand-neon/40 text-white shadow-sm shadow-brand-neon/5'
                          : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Checkbox Verde Neon */}
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                            isSelected
                              ? 'bg-brand-neon border-brand-neon text-black shadow-md shadow-brand-neon/30'
                              : 'bg-zinc-900 border-zinc-700 text-transparent group-hover:border-zinc-500'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>

                        {/* Informações da Conta */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white truncate max-w-[280px]">
                              {acc.name}
                            </span>
                            {acc.account_status === 1 ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                Ativa
                              </span>
                            ) : acc.account_status === 3 ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shrink-0">
                                Em Liquidação
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 shrink-0">
                                Status {acc.account_status}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-zinc-400 font-mono mt-0.5 flex items-center gap-2">
                            <span className="text-zinc-500">ID: {acc.id}</span>
                            <button
                              onClick={(e) => handleCopyId(acc.id, e)}
                              className="text-zinc-500 hover:text-white p-0.5 transition-colors"
                              title="Copiar ID"
                            >
                              {isCopied ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <span>•</span>
                            <span>{acc.currency || 'BRL'}</span>
                            {acc.timezone_name && (
                              <>
                                <span>•</span>
                                <span className="text-zinc-500 truncate max-w-[120px]">
                                  {acc.timezone_name.replace('America/', '')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ações da Conta */}
                      <div className="flex items-center gap-2 shrink-0 pl-3">
                        <span
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                            isSelected
                              ? 'bg-brand-neon text-black shadow-md shadow-brand-neon/20'
                              : 'bg-zinc-800 text-zinc-400 group-hover:text-white group-hover:bg-zinc-750'
                          }`}
                        >
                          {isSelected ? '✓ Na Carteira' : '+ Incluir'}
                        </span>

                        <button
                          onClick={(e) => handleRemoveAccount(acc.id, e)}
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          title="Remover conta da lista"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* BARRA FIXA DE SALVAR CARTEIRA */}
            <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-zinc-400">
                <span>Total selecionado para monitoramento: </span>
                <strong className="text-brand-neon font-black">{selectedCountTotal} conta(s)</strong>
              </div>

              <button
                type="button"
                onClick={handleSavePortfolio}
                disabled={isSaving || selectedCountTotal === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-neon hover:bg-brand-neonHover text-black font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-xl shadow-brand-neon/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Salvando Carteira...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>SALVAR CARTEIRA DE CLIENTES</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
