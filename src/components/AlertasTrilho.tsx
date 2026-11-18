import React from 'react';
import { 
  AlertTriangle, 
  Flame, 
  TrendingDown, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink,
  Wallet,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { MetaAccountCarteiraItem } from '../types/meta';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface AlertasTrilhoProps {
  items: MetaAccountCarteiraItem[];
  onSelectAccount?: (id: string) => void;
}

export const AlertasTrilho: React.FC<AlertasTrilhoProps> = ({ items, onSelectAccount }) => {
  // 1. Contas em Risco de Saldo (Apenas pré-pagas com saldo durando < 5 dias)
  const contasEmRisco = React.useMemo(() => {
    return items
      .filter(item => {
        if (!item.is_prepay_account) return false;
        if (item.account_status !== 1) return false; // Apenas contas ativas
        if (item.remaining_days === null) return false;
        return item.remaining_days < 5;
      })
      .sort((a, b) => (a.remaining_days ?? 999) - (b.remaining_days ?? 999));
  }, [items]);

  // 2. Otimizar Primeiro: Top 3 contas com CPL mais acima da Meta de CPL
  const contasOtimizarPrimeiro = React.useMemo(() => {
    return items
      .filter(item => {
        return (
          item.account_status === 1 &&
          item.cpl !== null && 
          item.meta_cpl !== null && 
          item.meta_cpl > 0 && 
          item.cpl > item.meta_cpl
        );
      })
      .sort((a, b) => {
        // Ordena pelo maior valor excedente total pago (ou maior diferença unitária de CPL)
        const excessoA = a.excesso_pago ?? ((a.cpl! - a.meta_cpl!) * (a.conversas || 1));
        const excessoB = b.excesso_pago ?? ((b.cpl! - b.meta_cpl!) * (b.conversas || 1));
        return excessoB - excessoA;
      })
      .slice(0, 3);
  }, [items]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* CARD 1: CONTAS EM RISCO (SALDO) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div>
          {/* Header do Card */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Contas em Risco</span>
                  <span className="text-xs font-normal text-zinc-400">(Saldo Pré-pago)</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Duração calculada pelo orçamento diário ativo ou ritmo de gasto
                </p>
              </div>
            </div>

            {contasEmRisco.length > 0 ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                {contasEmRisco.length} {contasEmRisco.length === 1 ? 'conta' : 'contas'}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Seguro
              </span>
            )}
          </div>

          {/* Lista de Contas em Risco */}
          {contasEmRisco.length > 0 ? (
            <div className="space-y-2.5">
              {contasEmRisco.map(acc => {
                const isCritico = (acc.remaining_days ?? 99) < 1.5;
                return (
                  <div
                    key={acc.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isCritico
                        ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
                        : 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                        isCritico ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {isCritico ? <Flame className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectAccount && onSelectAccount(acc.id)}
                            className="text-xs font-bold text-white hover:text-brand-neon truncate text-left transition-colors"
                            title={acc.name}
                          >
                            {acc.name}
                          </button>
                          <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            isCritico ? 'bg-red-500/30 text-red-300' : 'bg-amber-500/30 text-amber-200'
                          }`}>
                            {isCritico ? 'Crítico < 1,5d' : 'Atenção < 5d'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400">
                          <span>
                            Saldo: <strong className="text-zinc-200">{formatCurrency(acc.balance)}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Ritmo: <strong className="text-zinc-200">{formatCurrency(acc.daily_budget)}/dia</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className={`block text-xs font-black ${
                          isCritico ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {acc.remaining_days !== null ? `${acc.remaining_days.toFixed(1)} dias` : '—'}
                        </span>
                        <span className="text-[10px] text-zinc-400">restantes</span>
                      </div>

                      <a
                        href={`https://adsmanager.facebook.com/ads/manager/billing/transactions?act=${acc.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                        title="Abrir Cobrança no Meta Ads"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center text-zinc-400 space-y-1.5">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mb-1" />
              <p className="text-xs font-semibold text-zinc-300">
                Todas as contas pré-pagas possuem saldo suficiente.
              </p>
              <p className="text-[11px] text-zinc-400">
                Nenhuma conta está com cobertura abaixo da régua de 5 dias.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-zinc-400" />
            Régua F.A.: Alerta Médio (&lt; 5d) · Crítico (&lt; 1,5d)
          </span>
          <span className="text-zinc-400">Leitura contínua Meta Ads</span>
        </div>
      </div>

      {/* CARD 2: OTIMIZAR PRIMEIRO (CPL VS META) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />

        <div>
          {/* Header do Card */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Otimizar Primeiro</span>
                  <span className="text-xs font-normal text-zinc-400">(Top 3 Estouro de CPL)</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Contas com custo por conversa mais acima da meta estabelecida
                </p>
              </div>
            </div>

            {contasOtimizarPrimeiro.length > 0 ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 border border-red-500/30 text-red-400">
                {contasOtimizarPrimeiro.length} prioritárias
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-neon" />
                No Alvo
              </span>
            )}
          </div>

          {/* Lista de Contas para Otimizar Primeiro */}
          {contasOtimizarPrimeiro.length > 0 ? (
            <div className="space-y-2.5">
              {contasOtimizarPrimeiro.map((acc, idx) => {
                const diffPercent = acc.status_meta_percent ?? 0;
                const excessoUnitario = (acc.cpl ?? 0) - (acc.meta_cpl ?? 0);
                const excessoTotal = acc.excesso_pago ?? (excessoUnitario * (acc.conversas || 1));

                return (
                  <div
                    key={acc.id}
                    className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectAccount && onSelectAccount(acc.id)}
                            className="text-xs font-bold text-white hover:text-brand-neon truncate text-left transition-colors"
                            title={acc.name}
                          >
                            {acc.name}
                          </button>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/25 text-red-300">
                            +{diffPercent.toFixed(1)}% acima
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400">
                          <span>
                            CPL Atual: <strong className="text-red-400">{formatCurrency(acc.cpl)}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Meta: <strong className="text-brand-neon font-semibold">{formatCurrency(acc.meta_cpl)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-red-400">
                        +{formatCurrency(excessoUnitario)}/conv.
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Excedente: <strong className="text-red-300">{formatCurrency(excessoTotal)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center text-zinc-400 space-y-1.5">
              <CheckCircle2 className="w-8 h-8 text-brand-neon mb-1" />
              <p className="text-xs font-semibold text-zinc-300">
                Todas as contas operando dentro ou abaixo da meta de CPL!
              </p>
              <p className="text-[11px] text-zinc-400">
                Nenhum estouro de custo identificado para as metas configuradas.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="text-zinc-400">
            Foco de ação prioritária: revisar criativos, públicos e saturação
          </span>
          <span className="text-brand-neon font-semibold text-[11px]">
            Meta CPL integrada ao Supabase
          </span>
        </div>
      </div>
    </div>
  );
};

