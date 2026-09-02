import React, { useState, useEffect, useCallback } from 'react';
import { X, Key, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { getApifyToken, saveApifyToken, scrapeInstagramPostsViaApify } from '../services/instagramScraperService';

interface SmmSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const SmmSettingsModal: React.FC<SmmSettingsModalProps> = React.memo(({
  isOpen,
  onClose,
  onSaved
}) => {
  const [token, setToken] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setToken(getApifyToken());
      setTestResult(null);
      setIsTesting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleTestToken = useCallback(async () => {
    if (!token.trim()) {
      setTestResult({ success: false, message: 'Informe um token para testar.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Test with a public instagram handle
      await scrapeInstagramPostsViaApify('instagram', token.trim(), 1);
      setTestResult({ success: true, message: 'Conexão com a API do Apify estabelecida com sucesso!' });
    } catch (err: any) {
      setTestResult({ 
        success: false, 
        message: err?.message || 'Falha ao conectar ao Apify. Verifique se o token é válido.' 
      });
    } finally {
      setIsTesting(false);
    }
  }, [token]);

  const handleSave = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    saveApifyToken(token.trim());
    onSaved();
    onClose();
  }, [token, onSaved, onClose]);

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
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                Configuração do Apify Scraper
              </h2>
              <p className="text-xs text-zinc-400">
                Token para raspagem e auditoria automática do Instagram.
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
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 block flex items-center justify-between">
              <span>Apify API Personal Token</span>
              <a
                href="https://console.apify.com/account/integrations"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-brand-neon hover:underline flex items-center gap-1"
              >
                <span>Obter Token Grátis</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              type="password"
              placeholder="apify_api_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-brand-neon transition-all"
            />
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              O token é salvo localmente no seu navegador e utilizado para executar o Actor <code className="text-brand-neon bg-brand-neon/10 px-1 py-0.5 rounded font-mono">apify/instagram-scraper</code> sem risco de bloqueio das suas contas pessoais.
            </p>
          </div>

          {/* Test connection alert */}
          {testResult && (
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-brand-border flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleTestToken}
              disabled={isTesting || !token.trim()}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-neon" />
                  <span>Testando...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-neon" />
                  <span>Testar Token</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand-neon hover:bg-brand-neonHover text-black font-extrabold text-xs shadow-md shadow-brand-neon/20 transition-all cursor-pointer"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});
