import React, { useState, useEffect, useCallback } from 'react';
import { X, UserPlus, DollarSign, Calendar, Megaphone, Target, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { createManualCrmLead } from '../services/crmLeadsService';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = React.memo(({
  isOpen,
  onClose,
  onLeadCreated
}) => {
  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [dataLead, setDataLead] = useState<string>(getTodayDate());
  const [campaignId, setCampaignId] = useState<string>('');
  const [adId, setAdId] = useState<string>('');
  const [agendamento, setAgendamento] = useState<'Sim' | 'Não'>('Não');
  const [venda, setVenda] = useState<'Sim' | 'Não'>('Não');
  const [valorConversao, setValorConversao] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDataLead(getTodayDate());
      setCampaignId('');
      setAdId('');
      setAgendamento('Não');
      setVenda('Não');
      setValorConversao('');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataLead) {
      setErrorMessage('Por favor, informe a data do lead.');
      return;
    }

    let parsedValor = 0;
    if (venda === 'Sim' && valorConversao) {
      const cleanValor = valorConversao
        .replace(/[^0-9,.-]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
      parsedValor = parseFloat(cleanValor) || 0;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Anexa horário padrão T12:00:00.000Z para garantir compatibilidade com colunas TIMESTAMPTZ
    const isoDateTime = dataLead.includes('T')
      ? new Date(dataLead).toISOString()
      : new Date(`${dataLead}T12:00:00.000Z`).toISOString();

    const res = await createManualCrmLead({
      data_hora: isoDateTime,
      nome: 'Lead Anônimo',
      telefone: '',
      campaign_id: campaignId.trim(),
      ad_id: adId.trim(),
      agendamento,
      venda,
      valor_conversao: parsedValor
    });

    setIsSubmitting(false);

    if (res.success) {
      onLeadCreated();
      onClose();
    } else {
      setErrorMessage(res.error || 'Erro ao cadastrar lead. Verifique sua conexão.');
    }
  }, [dataLead, campaignId, adId, agendamento, venda, valorConversao, onLeadCreated, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#121214] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 my-8 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-neon/10 border border-brand-neon/20 text-brand-neon">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Cadastrar Lead Manual
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Atribua diretamente a conversão ao ID da Campanha / Anúncio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="m-5 mb-0 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-400 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Data do Lead */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-bold text-zinc-300">
              <Calendar className="w-3.5 h-3.5 text-brand-neon" />
              <span>Data do Lead <span className="text-red-400">*</span></span>
            </label>
            <input
              type="date"
              required
              value={dataLead}
              onChange={(e) => setDataLead(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/70 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-colors"
            />
          </div>

          {/* IDs da Campanha e Anúncio (2 Colunas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-bold text-zinc-300">
                <Megaphone className="w-3.5 h-3.5 text-zinc-400" />
                <span>ID da Campanha Meta</span>
              </label>
              <input
                type="text"
                placeholder="Ex: 1202500230899..."
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/70 rounded-xl px-3.5 py-2.5 text-white font-mono text-[11px] placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-bold text-zinc-300">
                <Target className="w-3.5 h-3.5 text-zinc-400" />
                <span>ID do Anúncio Meta</span>
              </label>
              <input
                type="text"
                placeholder="Ex: 1202500773350..."
                value={adId}
                onChange={(e) => setAdId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/70 rounded-xl px-3.5 py-2.5 text-white font-mono text-[11px] placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-colors"
              />
            </div>
          </div>

          {/* Status de Agendamento e Venda (2 Colunas com Toggles Elegantes) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Agendamento */}
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-300 block">
                Agendamento Realizado?
              </label>
              <div className="flex bg-zinc-900 border border-zinc-700/70 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setAgendamento('Não')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    agendamento === 'Não'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => setAgendamento('Sim')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    agendamento === 'Sim'
                      ? 'bg-brand-neon text-black shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Sim
                </button>
              </div>
            </div>

            {/* Venda */}
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-300 block">
                Venda Concluída?
              </label>
              <div className="flex bg-zinc-900 border border-zinc-700/70 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setVenda('Não');
                    setValorConversao('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    venda === 'Não'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => setVenda('Sim')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    venda === 'Sim'
                      ? 'bg-emerald-500 text-black shadow-sm font-black'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Sim
                </button>
              </div>
            </div>
          </div>

          {/* Campo Condicional: Valor de Conversão (Exibido apenas quando Venda === 'Sim') */}
          {venda === 'Sim' && (
            <div className="space-y-1.5 pt-1 animate-in fade-in slide-in-from-top-2 duration-150">
              <label className="flex items-center gap-1.5 font-bold text-emerald-400">
                <DollarSign className="w-4 h-4" />
                <span>Valor do Contrato / Conversão (R$) <span className="text-red-400">*</span></span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400">
                  R$
                </span>
                <input
                  type="text"
                  required={venda === 'Sim'}
                  placeholder="Ex: 5.000,00"
                  value={valorConversao}
                  onChange={(e) => setValorConversao(e.target.value)}
                  className="w-full bg-zinc-900 border border-emerald-500/50 rounded-xl pl-10 pr-3.5 py-2.5 text-white font-bold text-sm placeholder-zinc-600 focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-zinc-700/70 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !dataLead}
              className="flex items-center gap-2 bg-brand-neon hover:bg-brand-neonHover text-black font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-brand-neon/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando no CRM...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Lead</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

AddLeadModal.displayName = 'AddLeadModal';
