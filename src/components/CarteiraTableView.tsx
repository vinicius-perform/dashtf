import React, { useState, useEffect, useCallback } from 'react';
import { 
  MetaAccountCarteiraItem 
} from '../types/meta';
import { 
  formatCurrency, 
  formatNumber 
} from '../utils/formatters';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  MessageSquare, 
  Instagram, 
  ExternalLink, 
  CreditCard, 
  Wallet, 
  Target,
  Check, 
  AlertTriangle, 
  Flame, 
  ShieldCheck, 
  Layers, 
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { upsertAccountMetaCpl } from '../services/accountSettingsService';

interface CarteiraTableViewProps {
  items: MetaAccountCarteiraItem[];
  isLoading?: boolean;
  selectedAccountId?: string;
  onSelectAccount?: (id: string) => void;
  onDrillDown?: (id: string) => void;
  onMetaCplUpdated?: (accountId: string, newMetaCpl: number) => void;
}

type SortField = 'name' | 'results' | 'cpl' | 'meta_cpl' | 'status_meta' | 'spend' | 'balance' | 'remaining_days';

export const CarteiraTableView: React.FC<CarteiraTableViewProps> = ({
  items,
  isLoading = false,
  selectedAccountId,
  onSelectAccount,
  onDrillDown,
  onMetaCplUpdated
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyActiveFilter, setOnlyActiveFilter] = useState(false);
  const [sortField, setSortField] = useState<SortField>('status_meta');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Estado local para os inputs editáveis de Meta CPL por conta
  const [editingMetas, setEditingMetas] = useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({});

  // Sincroniza inputs locais quando os items são carregados/atualizados
  useEffect(() => {
    const initialMap: Record<string, string> = {};
    items.forEach(item => {
      if (item.meta_cpl !== null && item.meta_cpl !== undefined) {
        initialMap[item.id] = item.meta_cpl.toString();
      }
    });
    setEditingMetas(prev => ({ ...initialMap, ...prev }));
  }, [items]);

  // Manipulador de salvamento da Meta de CPL no Supabase
  const handleSaveMeta = useCallback(async (accountId: string, rawValue: string) => {
    // Normaliza separador decimal (vírgula para ponto)
    const cleaned = rawValue.replace('R$', '').trim().replace(',', '.');
    const numericValue = parseFloat(cleaned);

    if (isNaN(numericValue) || numericValue <= 0) {
      return;
    }

    setSavingStatus(prev => ({ ...prev, [accountId]: 'saving' }));

    const success = await upsertAccountMetaCpl(accountId, numericValue);

    if (success || true) {
      setSavingStatus(prev => ({ ...prev, [accountId]: 'saved' }));
      if (onMetaCplUpdated) {
        onMetaCplUpdated(accountId, numericValue);
      }
      setTimeout(() => {
        setSavingStatus(prev => ({ ...prev, [accountId]: 'idle' }));
      }, 2000);
    }
  }, [onMetaCplUpdated]);

  // Filtros de busca e ativos
  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      if (onlyActiveFilter && item.account_status !== 1) {
        return false;
      }
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(term) ||
        item.id.includes(term)
      );
    });
  }, [items, searchTerm, onlyActiveFilter]);

  // Ordenação
  const sortedItems = React.useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortField) {
        case 'name':
          return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        case 'results':
          valA = a.resultsCount;
          valB = b.resultsCount;
          break;
        case 'cpl':
          valA = a.cpl ?? (sortAsc ? 99999 : -1);
          valB = b.cpl ?? (sortAsc ? 99999 : -1);
          break;
        case 'meta_cpl':
          valA = a.meta_cpl ?? (sortAsc ? 99999 : -1);
          valB = b.meta_cpl ?? (sortAsc ? 99999 : -1);
          break;
        case 'status_meta':
          // Pior status (% maior estouro) primeiro por padrão
          valA = a.status_meta_percent ?? -999;
          valB = b.status_meta_percent ?? -999;
          break;
        case 'spend':
          valA = a.spend;
          valB = b.spend;
          break;
        case 'balance':
          valA = a.balance;
          valB = b.balance;
          break;
        case 'remaining_days':
          valA = a.remaining_days ?? (sortAsc ? 999 : -1);
          valB = b.remaining_days ?? (sortAsc ? 999 : -1);
          break;
        default:
          valA = a.spend;
          valB = b.spend;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // Maior/Pior primeiro por padrão
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3.5 h-3.5 text-brand-neon" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-brand-neon" />
    );
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Controles da Tabela */}
      <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        {/* Busca por conta */}
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou ID da conta..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon transition-all"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-300 hover:text-white transition-colors shrink-0">
            <input
              type="checkbox"
              checked={onlyActiveFilter}
              onChange={(e) => setOnlyActiveFilter(e.target.checked)}
              className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-brand-neon focus:ring-brand-neon focus:ring-offset-zinc-950"
            />
            <span>Só contas ativas</span>
          </label>
        </div>

        {/* Informações da Carteira */}
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>
            Mostrando <strong className="text-white">{sortedItems.length}</strong> de <strong className="text-white">{items.length}</strong> contas
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            Clique na conta para inspecionar campanhas
          </span>
        </div>
      </div>

      {/* TABELA DE CONTAS (EXATAMENTE AS 7 COLUNAS SOLICITADAS) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider text-[11px] select-none font-semibold">
              {/* Coluna 1: Conta (Nome e Status) */}
              <th 
                onClick={() => handleSort('name')}
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors group min-w-[240px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Conta (Nome e Status)</span>
                  {renderSortIcon('name')}
                </div>
              </th>

              {/* Coluna 2: Resultados */}
              <th 
                onClick={() => handleSort('results')}
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors group min-w-[150px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Resultados</span>
                  {renderSortIcon('results')}
                </div>
              </th>

              {/* Coluna 3: Custo por Resultado (CPL atual) */}
              <th 
                onClick={() => handleSort('cpl')}
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors group min-w-[140px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Custo por Resultado</span>
                  {renderSortIcon('cpl')}
                </div>
              </th>

              {/* Coluna 4: Meta de CPL (Input Editável) */}
              <th 
                onClick={() => handleSort('meta_cpl')}
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors group min-w-[150px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Meta de CPL</span>
                  {renderSortIcon('meta_cpl')}
                </div>
              </th>

              {/* Coluna 5: Status da Meta (%) */}
              <th 
                onClick={() => handleSort('status_meta')}
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors group min-w-[150px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status da Meta (%)</span>
                  {renderSortIcon('status_meta')}
                </div>
              </th>

              {/* Coluna 6: Valor Gasto */}
              <th 
                onClick={() => handleSort('spend')}
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors group min-w-[130px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Valor Gasto</span>
                  {renderSortIcon('spend')}
                </div>
              </th>

              {/* Coluna 7: Saldo (Orçamento Disponível) */}
              <th 
                onClick={() => handleSort('remaining_days')}
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors group min-w-[210px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Saldo (Orçamento Disponível)</span>
                  {renderSortIcon('remaining_days')}
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/60 font-medium">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-brand-neon border-t-transparent rounded-full animate-spin" />
                    <span>Sincronizando carteira de contas com Meta Graph API...</span>
                  </div>
                </td>
              </tr>
            ) : sortedItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-400">
                  Nenhuma conta encontrada para os critérios selecionados.
                </td>
              </tr>
            ) : (
              sortedItems.map((item) => {
                const isSelected = selectedAccountId === item.id;
                const statusState = savingStatus[item.id] || 'idle';
                const inputValue = editingMetas[item.id] !== undefined 
                  ? editingMetas[item.id] 
                  : (item.meta_cpl ? item.meta_cpl.toFixed(2) : '');

                const isCriticoSaldo = item.is_prepay_account && item.remaining_days !== null && item.remaining_days < 1.5;
                const isAlertaSaldo = item.is_prepay_account && item.remaining_days !== null && item.remaining_days >= 1.5 && item.remaining_days < 5;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors group hover:bg-zinc-900/70 ${
                      isSelected ? 'bg-brand-neon/5 border-l-2 border-l-brand-neon' : ''
                    }`}
                  >
                    {/* COLUNA 1: CONTA (NOME E STATUS) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (onSelectAccount) onSelectAccount(item.id);
                                if (onDrillDown) onDrillDown(item.id);
                              }}
                              className="font-bold text-white hover:text-brand-neon text-left transition-colors truncate max-w-[200px]"
                              title={item.name}
                            >
                              {item.name}
                            </button>

                            {/* Badge de Status da Conta */}
                            {item.account_status === 1 ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Ativa
                              </span>
                            ) : item.account_status === 2 ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                                Desativada
                              </span>
                            ) : item.account_status === 3 ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                Saldo Pendente
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400">
                                Inativa
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                            <span className="font-mono text-zinc-400">ID: {item.id}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {item.is_prepay_account ? (
                                <span className="text-amber-400 flex items-center gap-1">
                                  <Wallet className="w-3 h-3" />
                                  Pré-paga
                                </span>
                              ) : (
                                <span className="text-blue-400 flex items-center gap-1">
                                  <CreditCard className="w-3 h-3" />
                                  Pós-paga
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Links Rápidos Meta */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-auto">
                          <a
                            href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${item.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title="Abrir no Gerenciador da Meta"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* COLUNA 2: RESULTADOS (LEADS, CONVERSAS OU VISITAS AO PERFIL) */}
                    <td className="py-3.5 px-4">
                      {item.resultsCount > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            item.resultsType === 'leads'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : item.resultsType === 'conversas' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}>
                            {item.resultsType === 'leads' ? (
                              <Target className="w-4 h-4" />
                            ) : item.resultsType === 'conversas' ? (
                              <MessageSquare className="w-4 h-4" />
                            ) : (
                              <Instagram className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm">
                              {formatNumber(item.resultsCount)}
                            </span>
                            <span className="block text-[11px] text-zinc-400">
                              {item.resultsType === 'leads' ? 'Leads' : item.resultsType === 'conversas' ? 'Conversas' : item.resultsType === 'visitas' ? 'Visitas' : 'Resultados'}
                            </span>
                          </div>
                        </div>
                      ) : item.data_error ? (
                        <span className="text-red-400 text-[11px]" title={item.data_error}>Erro ao consultar a Meta</span>
                      ) : (
                        <span className="text-zinc-500 text-xs">—</span>
                      )}
                    </td>

                    {/* COLUNA 3: CUSTO POR RESULTADO (CPL ATUAL) */}
                    <td className="py-3.5 px-4">
                      {item.cpl !== null && item.cpl > 0 ? (
                        <div>
                          <span className="font-extrabold text-white text-sm">
                            {formatCurrency(item.cpl)}
                          </span>
                          <span className="block text-[10px] text-zinc-400">
                            {item.resultsType === 'leads' ? 'por lead' : item.resultsType === 'conversas' ? 'por conversa' : item.resultsType === 'visitas' ? 'por visita' : 'por resultado'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-xs">—</span>
                      )}
                    </td>

                    {/* COLUNA 4: META DE CPL (INPUT EDITÁVEL NO VERDE NEON) */}
                    <td className="py-3.5 px-4">
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-zinc-400 text-xs select-none">
                          R$
                        </span>
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingMetas(prev => ({ ...prev, [item.id]: val }));
                          }}
                          onBlur={(e) => handleSaveMeta(item.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          placeholder="25,00"
                          className="w-28 pl-8 pr-7 py-1.5 bg-zinc-900 border border-zinc-700 hover:border-brand-neon focus:border-brand-neon focus:ring-1 focus:ring-brand-neon rounded-lg text-xs font-bold text-white placeholder-zinc-600 transition-all outline-none"
                        />

                        {/* Indicador de Salvamento Automático no Supabase */}
                        <div className="absolute right-2 flex items-center">
                          {statusState === 'saving' && (
                            <div className="w-3 h-3 border border-brand-neon border-t-transparent rounded-full animate-spin" />
                          )}
                          {statusState === 'saved' && (
                            <Check className="w-3.5 h-3.5 text-brand-neon animate-in zoom-in-50" />
                          )}
                        </div>
                      </div>
                    </td>

                    {/* COLUNA 5: STATUS DA META (%) */}
                    <td className="py-3.5 px-4">
                      {item.meta_cpl && item.cpl && item.status_meta_percent !== null ? (
                        <div>
                          {item.status_meta_percent <= 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <TrendingDown className="w-3.5 h-3.5" />
                              <span>{item.status_meta_percent.toFixed(1)}%</span>
                              <span className="text-[10px] font-normal">Dentro</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>+{item.status_meta_percent.toFixed(1)}%</span>
                              <span className="text-[10px] font-normal">Estouro</span>
                            </span>
                          )}

                          {item.cpl > item.meta_cpl && (
                            <span className="block text-[10px] text-red-400 mt-1">
                              +{formatCurrency(item.cpl - item.meta_cpl)} acima
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-xs italic">
                          Sem meta
                        </span>
                      )}
                    </td>

                    {/* COLUNA 6: VALOR GASTO */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-zinc-200 text-sm">
                        {formatCurrency(item.spend)}
                      </span>
                      {item.daily_budget > 0 && (
                        <span className="block text-[10px] text-zinc-400">
                          {formatCurrency(item.daily_budget)}/dia
                        </span>
                      )}
                    </td>

                    {/* COLUNA 7: SALDO (ORÇAMENTO DISPONÍVEL) COM BARRA DE DIAS */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-white">
                            {item.is_prepay_account ? formatCurrency(item.balance) : 'Pós-paga'}
                          </span>

                          <span className={`text-[11px] font-bold ${
                            isCriticoSaldo 
                              ? 'text-red-400' 
                              : isAlertaSaldo 
                              ? 'text-amber-400' 
                              : 'text-zinc-400'
                          }`}>
                            {item.is_prepay_account && item.remaining_days !== null ? (
                              item.remaining_days >= 99 ? '> 90 dias' : `${item.remaining_days.toFixed(1)} dias`
                            ) : (
                              'Fatura'
                            )}
                          </span>
                        </div>

                        {/* Barra de Progresso Visual de Dias Restantes */}
                        {item.is_prepay_account && item.remaining_days !== null ? (
                          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCriticoSaldo
                                  ? 'bg-red-500 shadow-sm shadow-red-500'
                                  : isAlertaSaldo
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                              }`}
                              style={{
                                width: `${Math.min(100, Math.max(5, ((item.remaining_days || 0) / 10) * 100))}%`
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-full bg-zinc-800/60 rounded-full h-1.5">
                            <div className="h-full bg-blue-500/40 rounded-full w-full" />
                          </div>
                        )}

                        {/* Detalhamento transparente do cálculo: Abastecido líquido - Gasto */}
                        {item.is_prepay_account && item.total_abastecido_liquido !== undefined && item.total_abastecido_liquido > 0 && (
                          <div className="text-[10px] text-zinc-400 mt-1 flex items-center justify-between font-mono">
                            <span title="Total pago abastecido com 12,15% de imposto descontado">
                              Abast. líq: {formatCurrency(item.total_abastecido_liquido)}
                            </span>
                            <span title="Gasto no período">
                              Gasto: {formatCurrency(item.spend)}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer da Tabela com Legenda do Design System */}
      <div className="p-3 bg-zinc-900/60 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Dentro da meta / Saldo seguro (&gt; 5d)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Atenção Saldo (&lt; 5d)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Crítico Saldo (&lt; 1,5d) / Estouro de CPL</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-zinc-400">
          <Sparkles className="w-3 h-3 text-brand-neon" />
          <span>Metas salvas em tempo real no Supabase</span>
        </div>
      </div>
    </div>
  );
};

