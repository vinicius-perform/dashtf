import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Sparkles, 
  Check, 
  ExternalLink, 
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  AiSettings, 
  AiProvider, 
  getAiSettings, 
  saveAiSettings 
} from '../services/aiAssistantService';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (settings: AiSettings) => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [provider, setProvider] = useState<AiProvider>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [showKey, setShowKey] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getAiSettings();
      setProvider(current.provider || 'gemini');
      setApiKey(current.apiKey || '');
      setModel(current.model || (current.provider === 'openai' ? 'gpt-4o-mini' : current.provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gemini-1.5-flash'));
      setIsSavedNotice(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderChange = (newProvider: AiProvider) => {
    setProvider(newProvider);
    if (newProvider === 'gemini') setModel('gemini-1.5-flash');
    if (newProvider === 'openai') setModel('gpt-4o-mini');
    if (newProvider === 'anthropic') setModel('claude-3-5-sonnet-20241022');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AiSettings = {
      provider,
      apiKey: apiKey.trim(),
      model
    };
    saveAiSettings(updated);
    if (onSaved) onSaved(updated);
    setIsSavedNotice(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const getKeyHelpLink = () => {
    switch (provider) {
      case 'gemini':
        return 'https://aistudio.google.com/app/apikey';
      case 'openai':
        return 'https://platform.openai.com/api-keys';
      case 'anthropic':
        return 'https://console.anthropic.com/settings/keys';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative select-none">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-neon/15 text-brand-neon border border-brand-neon/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>Configurar IA Nativa</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-neon text-black">
                  F.A. Brain
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Conecte seu modelo de IA para diagnósticos e comandos
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          
          {/* Provedor de IA */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Provedor de Inteligência Artificial:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleProviderChange('gemini')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                  provider === 'gemini'
                    ? 'bg-brand-neon/15 text-brand-neon border-brand-neon font-black'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700/80 hover:border-zinc-500'
                }`}
              >
                Gemini
                <span className="block text-[9px] font-normal text-brand-neon/80">Recomendado</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('openai')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                  provider === 'openai'
                    ? 'bg-brand-neon/15 text-brand-neon border-brand-neon font-black'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700/80 hover:border-zinc-500'
                }`}
              >
                OpenAI
                <span className="block text-[9px] font-normal text-zinc-500">GPT-4o</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('anthropic')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                  provider === 'anthropic'
                    ? 'bg-brand-neon/15 text-brand-neon border-brand-neon font-black'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700/80 hover:border-zinc-500'
                }`}
              >
                Claude
                <span className="block text-[9px] font-normal text-zinc-500">Sonnet 3.5</span>
              </button>
            </div>
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Modelo Selecionado:
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon rounded-xl text-xs text-white font-mono outline-none"
            />
          </div>

          {/* Chave da API */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-300">
                Chave da API ({provider.toUpperCase()} API Key):
              </label>
              <a
                href={getKeyHelpLink()}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-brand-neon hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Obter chave</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Insira sua chave ${provider === 'gemini' ? 'AIza...' : provider === 'openai' ? 'sk-...' : 'sk-ant-...'}`}
                className="w-full pl-3 pr-10 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon rounded-xl text-xs font-mono text-white placeholder-zinc-600 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[11px] text-zinc-500 mt-1.5">
              Sua chave é salva com segurança no navegador e utilizada para consultas ao vivo.
            </p>
          </div>

          {/* Feedback de Salvo */}
          {isSavedNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in zoom-in-95">
              <Check className="w-4 h-4" />
              <span>Configurações da IA salvas com sucesso!</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2 rounded-xl text-xs font-black bg-brand-neon hover:bg-brand-neonHover text-black shadow-lg shadow-brand-neon/20 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Salvar Configuração</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

