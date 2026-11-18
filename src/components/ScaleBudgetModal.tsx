import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  X, 
  AlertTriangle, 
  Layers, 
  Megaphone, 
  Check, 
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { MetaAd, MetaAdSet } from '../types/meta';
import { formatCurrency } from '../utils/formatters';

interface ScaleBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: MetaAd | null;
  adset?: MetaAdSet | null;
  onConfirmScale: (adsetId: string, newBudget: number) => Promise<void> | void;
}

export const ScaleBudgetModal: React.FC<ScaleBudgetModalProps> = ({
  isOpen,
  onClose,
  ad,
  adset,
  onConfirmScale
}) => {
  // Orçamento diário atual do conjunto (em Reais)
  const currentDailyBudget = React.useMemo(() => {
    if (adset?.daily_budget && adset.daily_budget > 0) {
      return adset.daily_budget;
    }
    // Fallback: estimativa com base no gasto diário do anúncio ou padrão
    const adSpend = Number(ad?.spend || 0);
    return adSpend > 0 ? parseFloat((adSpend / 7).toFixed(2)) || 50 : 50;
  }, [adset, ad]);

  // Novo orçamento proposto
  const [newBudget, setNewBudget] = useState<number>(currentDailyBudget);
  const [inputValue, setInputValue] = useState<string>(currentDailyBudget.toFixed(2));
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Inicializa o valor ao abrir o modal com sugestão recomendada de +20%
  useEffect(() => {
    if (isOpen) {
      const suggested = parseFloat((currentDailyBudget * 1.20).toFixed(2));
      setNewBudget(suggested);
      setInputValue(suggested.toFixed(2));
      setIsSaving(false);
      setIsSuccess(false);
    }
  }, [isOpen, currentDailyBudget]);

  if (!isOpen || !ad) return null;

  // Cálculo da variação percentual e nominal
  const diffNominal = newBudget - currentDailyBudget;
  const percentageIncrease = currentDailyBudget > 0 
    ? ((newBudget - currentDailyBudget) / currentDailyBudget) * 100 
    : 0;

  const isOverSafeLimit = percentageIncrease > 20.05; // Regra de segurança: alerta para aumentos > 20%

  // Atalhos rápidos
  const handleShortcut = (pct: number) => {
    const calculated = parseFloat((currentDailyBudget * (1 + pct / 100)).toFixed(2));
    setNewBudget(calculated);
    setInputValue(calculated.toFixed(2));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace('R$', '').trim().replace(',', '.');
    setInputValue(e.target.value);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) {
      setNewBudget(parsed);
    }
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      await onConfirmScale(ad.adset_id, newBudget);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Falha ao confirmar escala:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative select-none">
        
        {/* Header do Modal */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-neon/15 text-brand-neon border border-brand-neon/30 shadow-lg shadow-brand-neon/10">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>Escalar Orçamento Diário</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-neon text-black">
                  Conjunto
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Ajuste gradual de orçamento para não resetar o aprendizado da Meta
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informações de Contexto do Conjunto e Campanha */}
        <div className="p-5 space-y-5">
          <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <Layers className="w-4 h-4 text-brand-neon shrink-0" />
              <span className="font-semibold text-zinc-400">Conjunto:</span>
              <strong className="text-white truncate">{ad.adset_name || 'Conjunto de Anúncios'}</strong>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
              <Megaphone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>Campanha:</span>
              <span className="text-zinc-300 truncate">{ad.campaign_name || 'Campanha'}</span>
            </div>
            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">Anúncio de referência:</span>
              <span className="text-zinc-300 font-medium truncate max-w-[240px]">{ad.name}</span>
            </div>
          </div>

          {/* Comparativo de Orçamento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl">
              <span className="block text-[11px] text-zinc-400 font-medium">Orçamento Diário Atual</span>
              <span className="text-lg font-black text-white mt-0.5 block">
                {formatCurrency(currentDailyBudget)}
                <span className="text-xs font-normal text-zinc-400">/dia</span>
              </span>
            </div>

            <div className="p-3.5 bg-brand-neon/5 border border-brand-neon/30 rounded-xl">
              <span className="block text-[11px] text-brand-neon font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Novo Orçamento Proposto
              </span>
              <span className="text-lg font-black text-brand-neon mt-0.5 block">
                {formatCurrency(newBudget)}
                <span className="text-xs font-normal text-brand-neon/80">/dia</span>
              </span>
            </div>
          </div>

          {/* Atalhos Rápidos de Aumento */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">
              Atalhos Rápidos de Escala:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleShortcut(15)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  Math.abs(percentageIncrease - 15) < 0.5
                    ? 'bg-zinc-800 text-white border-brand-neon'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-700/80 hover:border-zinc-500'
                }`}
              >
                +15%
                <span className="block text-[10px] font-normal text-zinc-400">
                  +{formatCurrency(currentDailyBudget * 0.15)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleShortcut(20)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all relative ${
                  Math.abs(percentageIncrease - 20) < 0.5
                    ? 'bg-brand-neon/15 text-brand-neon border-brand-neon shadow-md shadow-brand-neon/10'
                    : 'bg-zinc-900 text-brand-neon border-brand-neon/40 hover:border-brand-neon'
                }`}
              >
                <span className="flex items-center justify-center gap-1">
                  +20%
                  <span className="text-[9px] bg-brand-neon text-black px-1 rounded uppercase font-black">
                    Meta
                  </span>
                </span>
                <span className="block text-[10px] font-normal text-zinc-400">
                  +{formatCurrency(currentDailyBudget * 0.20)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleShortcut(30)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  Math.abs(percentageIncrease - 30) < 0.5
                    ? 'bg-zinc-800 text-white border-amber-500'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-700/80 hover:border-zinc-500'
                }`}
              >
                +30%
                <span className="block text-[10px] font-normal text-amber-400">
                  +{formatCurrency(currentDailyBudget * 0.30)}
                </span>
              </button>
            </div>
          </div>

          {/* Campo de Valor Livre */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Ou digite um valor livre (R$/dia):
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs select-none">
                R$
              </span>
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="60.00"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon rounded-xl text-sm font-black text-white outline-none transition-all"
              />
            </div>
          </div>

          {/* Resumo da Diferença */}
          <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span>De <strong>{formatCurrency(currentDailyBudget)}</strong> para <strong>{formatCurrency(newBudget)}</strong></span>
            </span>
            <span className={`font-black ${diffNominal >= 0 ? 'text-brand-neon' : 'text-red-400'}`}>
              {diffNominal >= 0 ? '+' : ''}{formatCurrency(diffNominal)}/dia ({percentageIncrease >= 0 ? '+' : ''}{percentageIncrease.toFixed(1)}%)
            </span>
          </div>

          {/* REGRA DE SEGURANÇA: ALERTA DE AUMENTO > 20% */}
          {isOverSafeLimit && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2.5 text-xs animate-in slide-in-from-top-1 duration-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">
                  Atenção: Aumentos acima de 20% podem reiniciar a fase de aprendizado do algoritmo.
                </strong>
                <span className="text-[11px] text-amber-300/80 mt-0.5 block leading-relaxed">
                  Para manter a estabilidade de entrega e do CPL, a Meta recomenda aumentos de até +20% a cada 48 a 72 horas.
                </span>
              </div>
            </div>
          )}

          {/* Feedback de Sucesso */}
          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-2 text-xs font-bold animate-in zoom-in-95">
              <Check className="w-4 h-4" />
              <span>Orçamento diário escalado com sucesso para {formatCurrency(newBudget)}/dia!</span>
            </div>
          )}
        </div>

        {/* Footer com Botões de Ação */}
        <div className="p-4 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving || isSuccess || newBudget <= 0}
            className="px-6 py-2.5 rounded-xl text-xs font-black bg-brand-neon hover:bg-brand-neonHover text-black shadow-lg shadow-brand-neon/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Aplicando Escala...</span>
              </>
            ) : isSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Escalado!</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                <span>Confirmar Escala</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

