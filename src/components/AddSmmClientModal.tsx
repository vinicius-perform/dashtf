import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  UserPlus, 
  Pencil, 
  Instagram, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ExternalLink,
  Trash2,
  Download
} from 'lucide-react';
import { 
  saveMonitoredClient, 
  updateMonitoredClient, 
  cleanInstagramHandle, 
  SmmMonitoredClient 
} from '../services/instagramScraperService';
import { InstagramAvatar } from './InstagramAvatar';

interface AddSmmClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientSaved: (savedClient: SmmMonitoredClient) => void;
  clientToEdit?: SmmMonitoredClient | null;
}

export const AddSmmClientModal: React.FC<AddSmmClientModalProps> = React.memo(({
  isOpen,
  onClose,
  onClientSaved,
  clientToEdit = null
}) => {
  const isEditing = Boolean(clientToEdit);

  const [clientName, setClientName] = useState('');
  const [instagramInput, setInstagramInput] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live parsed handle
  const parsed = cleanInstagramHandle(instagramInput);

  useEffect(() => {
    if (isOpen) {
      if (clientToEdit) {
        setClientName(clientToEdit.clientName || '');
        setInstagramInput(clientToEdit.instagramUrl || clientToEdit.handle || '');
        setAvatarUrl(clientToEdit.avatarUrl || '');
      } else {
        setClientName('');
        setInstagramInput('');
        setAvatarUrl('');
      }
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, clientToEdit]);

  // Auto-fill avatar when handle is typed if avatar is empty
  const handleAutoFetchAvatar = () => {
    if (parsed.cleanHandle) {
      setAvatarUrl(`https://unavatar.io/instagram/${parsed.cleanHandle}`);
    }
  };

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
    if (!clientName.trim()) {
      setErrorMessage('Por favor, informe o nome do cliente ou empresa.');
      return;
    }
    if (!instagramInput.trim()) {
      setErrorMessage('Por favor, informe o link ou @handle do Instagram.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // If user didn't enter custom avatar, auto-set unavatar link as fallback
      const finalAvatar = avatarUrl.trim() || (parsed.cleanHandle ? `https://unavatar.io/instagram/${parsed.cleanHandle}` : undefined);

      let saved: SmmMonitoredClient;

      if (isEditing && clientToEdit) {
        saved = await updateMonitoredClient({
          id: clientToEdit.id,
          clientName: clientName.trim(),
          instagramInput: instagramInput.trim(),
          avatarUrl: finalAvatar,
          isActive: clientToEdit.isActive
        });
      } else {
        saved = await saveMonitoredClient({
          clientName: clientName.trim(),
          instagramInput: instagramInput.trim(),
          avatarUrl: finalAvatar,
          isActive: true
        });
      }

      setIsSubmitting(false);
      onClientSaved(saved);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar cliente SMM:', err);
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Falha ao salvar cliente.');
    }
  }, [clientName, instagramInput, avatarUrl, parsed.cleanHandle, isEditing, clientToEdit, onClientSaved, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-brand-sidebar border border-brand-border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-border bg-brand-card/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon shadow-inner">
              {isEditing ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                {isEditing ? 'Editar Cliente SMM' : 'Cadastrar Cliente SMM'}
                <span className="text-[10px] bg-brand-neon/10 text-brand-neon border border-brand-neon/20 px-2 py-0.5 rounded-full font-bold">
                  Instagram
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                {isEditing 
                  ? 'Atualize as informações de perfil e foto do Instagram.' 
                  : 'Monitore postagens diárias e entregas no feed automaticamente.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nome do Cliente */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 block">
              Nome do Cliente / Empresa <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Dra. Mariella Palmeira ou Clínica Harmonize"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-all"
              required
              autoFocus
            />
          </div>

          {/* Link ou @ do Instagram */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 block flex items-center justify-between">
              <span>Link ou @ do Instagram <span className="text-rose-400">*</span></span>
              <span className="text-[10px] text-zinc-500 font-normal">Aceita link completo ou @usuario</span>
            </label>
            <div className="relative">
              <Instagram className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-400" />
              <input
                type="text"
                placeholder="Ex: https://instagram.com/dramariellapalmeira ou @dramariellapalmeira"
                value={instagramInput}
                onChange={(e) => setInstagramInput(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-all"
                required
              />
            </div>

            {/* Live Handle Feedback + Botão Auto-puxar foto */}
            {parsed.cleanHandle && (
              <div className="bg-brand-card border border-brand-border/80 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-zinc-400">Identificador:</span>
                  <span className="font-mono text-white font-bold">{parsed.handle}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAutoFetchAvatar}
                    className="text-[11px] text-brand-neon hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Puxar Foto do Perfil</span>
                  </button>
                  <a
                    href={parsed.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    <span>Abrir Instagram</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Foto de Perfil / Copiar endereço da imagem */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 block">
                Foto de Perfil do Cliente <span className="text-zinc-500 font-normal">(Avatar)</span>
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="text-[11px] text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar campo</span>
                </button>
              )}
            </div>

            <div className="relative">
              <ImageIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Cole o endereço da imagem copiada do Instagram ou deixe vazio para puxar automático..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-all font-mono"
              />
            </div>

            {/* Preview Box com InstagramAvatar */}
            <div className="p-3.5 bg-brand-card/70 border border-brand-border/80 rounded-xl space-y-2.5">
              <div className="flex items-center gap-3.5">
                <InstagramAvatar
                  avatarUrl={avatarUrl}
                  handle={parsed.cleanHandle}
                  name={clientName || 'Cliente'}
                  size="lg"
                />
                <div className="space-y-0.5 min-w-0">
                  <span className="text-xs font-bold text-white block truncate">
                    {clientName || 'Nome do Cliente'}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono block">
                    {parsed.handle || '@instagram'}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Foto visualizada com bypass anti-bloqueio
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed border-t border-brand-border/40 pt-2">
                💡 <span className="text-zinc-200 font-semibold">Duas formas de colocar a foto:</span>
                <br />
                1. Clique em <span className="text-brand-neon font-bold">"Puxar Foto do Perfil"</span> acima; OU
                <br />
                2. No Instagram, clique com o botão direito na foto do perfil, selecione <span className="text-white font-bold underline">"Copiar endereço da imagem"</span> e cole no campo acima.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-brand-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !clientName.trim() || !instagramInput.trim()}
              className="px-4 py-2 rounded-xl bg-brand-neon hover:bg-brand-neonHover text-black font-extrabold text-xs shadow-md shadow-brand-neon/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isEditing ? <Pencil className="w-4 h-4 stroke-[2.5]" /> : <UserPlus className="w-4 h-4 stroke-[2.5]" />}
              <span>{isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar e Monitorar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
