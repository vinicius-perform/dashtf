import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Sparkles,
  Instagram,
  RefreshCw
} from 'lucide-react';
import { 
  saveBulkMonitoredClients, 
  cleanInstagramHandle, 
  SmmMonitoredClient 
} from '../services/instagramScraperService';
import { 
  getSocialMediaForClient, 
  getSocialMediaBadgeStyle 
} from '../services/teamData';

interface AddSmmClientBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientsSaved: (savedClients: SmmMonitoredClient[]) => void;
}

interface ParsedClientRow {
  clientName: string;
  instagramInput: string;
  cleanHandle: string;
  avatarUrl?: string;
  isValid: boolean;
  error?: string;
}

export const AddSmmClientBulkModal: React.FC<AddSmmClientBulkModalProps> = React.memo(({
  isOpen,
  onClose,
  onClientsSaved
}) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setInputText('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Real-time parsing of the textarea content
  const parsedRows: ParsedClientRow[] = useMemo(() => {
    if (!inputText.trim()) return [];

    const lines = inputText.split('\n');
    const results: ParsedClientRow[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue; // Ignora linhas vazias

      // Separador por pipe "|"
      const parts = line.split('|').map(p => p.trim());
      const clientName = parts[0] || '';
      const rawHandle = parts[1] || '';
      const rawAvatar = parts[2] || '';

      if (!clientName && !rawHandle) continue;

      const { cleanHandle } = cleanInstagramHandle(rawHandle);

      if (!clientName) {
        results.push({
          clientName: '',
          instagramInput: rawHandle,
          cleanHandle,
          avatarUrl: rawAvatar || undefined,
          isValid: false,
          error: 'Nome do cliente ausente'
        });
        continue;
      }

      if (!cleanHandle && !rawHandle) {
        results.push({
          clientName,
          instagramInput: '',
          cleanHandle: '',
          avatarUrl: rawAvatar || undefined,
          isValid: false,
          error: 'Handle ou link do Instagram ausente'
        });
        continue;
      }

      results.push({
        clientName,
        instagramInput: rawHandle,
        cleanHandle,
        avatarUrl: rawAvatar || (cleanHandle ? `https://unavatar.io/instagram/${cleanHandle}` : undefined),
        isValid: true
      });
    }

    return results;
  }, [inputText]);

  const validRows = useMemo(() => parsedRows.filter(r => r.isValid), [parsedRows]);
  const invalidRows = useMemo(() => parsedRows.filter(r => !r.isValid), [parsedRows]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (validRows.length === 0) {
      setErrorMessage('Nenhum cliente válido encontrado. Verifique o formato inserido.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const toSave = validRows.map(row => ({
        clientName: row.clientName,
        instagramInput: row.cleanHandle || row.instagramInput,
        avatarUrl: row.avatarUrl,
        isActive: true
      }));

      const saved = await saveBulkMonitoredClients(toSave);

      setSuccessMessage(`${saved.length} clientes importados com sucesso!`);
      setIsSubmitting(false);

      setTimeout(() => {
        onClientsSaved(saved);
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Erro na importação em massa:', err);
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Falha ao importar clientes em massa.');
    }
  }, [validRows, onClientsSaved, onClose]);

  const handleInsertExample = () => {
    setInputText(
      `Dra. Mariella Palmeira | @dramariellapalmeira | https://unavatar.io/instagram/dramariellapalmeira\n` +
      `Dr. Jair Dacás | @drjairdacas\n` +
      `Clínica Doctors | clinicadoctors\n` +
      `Coife Odonto | @coifeodonto`
    );
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-text"
      onClick={onClose}
    >
      <div 
        className="bg-brand-sidebar border border-brand-border rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-border bg-brand-card/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon shadow-inner">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Cadastro em Massa (Importar Lista)
              </h3>
              <p className="text-xs text-zinc-400">
                Adicione múltiplos clientes de uma só vez no monitoramento SMM
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Instruções de Formato */}
          <div className="bg-zinc-850/80 border border-brand-border/80 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-brand-neon" />
                Formato esperado por linha:
              </span>
              <button
                type="button"
                onClick={handleInsertExample}
                className="text-[11px] text-brand-neon hover:text-white transition-colors underline cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Preencher com exemplo
              </button>
            </div>
            <div className="font-mono bg-zinc-900/90 text-brand-neon p-2.5 rounded-lg border border-zinc-800 text-[11px]">
              Nome do Cliente | @handle | URL da Imagem (opcional)
            </div>
            <p className="text-[11px] text-zinc-400">
              Dica: A foto do perfil será obtida automaticamente do Instagram se a URL da imagem não for informada.
            </p>
          </div>

          {/* Textarea de Entrada */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Lista de Clientes
              </label>
              {parsedRows.length > 0 && (
                <span className="text-xs font-semibold text-zinc-400">
                  <strong className="text-emerald-400">{validRows.length}</strong> válidos
                  {invalidRows.length > 0 && (
                    <span className="text-rose-400 ml-1">({invalidRows.length} com erro)</span>
                  )}
                </span>
              )}
            </div>
            <textarea
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Alessandra Montera | @alessandramontera | https://...\nBodyincision | @bodyincision\nClínica Doctors (Dr. Fernando) | @clinicadoctors\nCoife Odonto | @coifeodonto`}
              className="w-full h-56 px-4 py-3 bg-zinc-900/90 border border-brand-border rounded-xl text-white font-mono text-xs focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon placeholder:text-zinc-600 resize-y"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Preview dos Clientes Detectados */}
          {validRows.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Pré-visualização ({validRows.length} identificados):
              </span>
              <div className="max-h-36 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/60 divide-y divide-zinc-800/60 text-xs custom-scrollbar">
                {validRows.slice(0, 10).map((row, idx) => {
                  const sm = getSocialMediaForClient(row.clientName);
                  const smStyle = getSocialMediaBadgeStyle(sm);
                  return (
                    <div key={idx} className="p-2.5 px-3 flex items-center justify-between hover:bg-zinc-800/30">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-pink-400 font-bold border border-zinc-700 shrink-0">
                          <Instagram className="w-3 h-3" />
                        </div>
                        <span className="font-bold text-white truncate max-w-[200px]">
                          {row.clientName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${smStyle}`}>
                          {sm}
                        </span>
                        <span className="font-mono text-zinc-400 text-[11px]">
                          @{row.cleanHandle}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {validRows.length > 10 && (
                  <div className="p-2 text-center text-[11px] text-zinc-500 italic bg-zinc-900/90">
                    + {validRows.length - 10} outros clientes na lista...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback de Erro ou Sucesso */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/60 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || validRows.length === 0}
              className="px-5 py-2 text-xs font-black text-black bg-brand-neon hover:bg-brand-neonHover rounded-xl shadow-lg shadow-brand-neon/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importando ({validRows.length})...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Processar e Salvar ({validRows.length})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
