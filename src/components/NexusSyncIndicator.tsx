import React, { useEffect, useState } from 'react';
import { RefreshCw, Loader2, CheckCircle2, Zap } from 'lucide-react';
import { fetchNexusSyncStatus, triggerManualNexusSync, NexusSyncStatus } from '../services/meta/nexusSyncEngine';
import { clearInsightsCache } from '../services/metaDataEngine';

interface NexusSyncIndicatorProps {
  onRefresh?: () => void;
}

export const NexusSyncIndicator: React.FC<NexusSyncIndicatorProps> = ({ onRefresh }) => {
  const [syncStatus, setSyncStatus] = useState<NexusSyncStatus>({
    id: 1,
    engine_name: 'Nexus Sync',
    last_run: new Date().toISOString(),
    status: 'SUCCESS',
    message: 'Sincronização profunda concluída com sucesso'
  });

  const [showTooltip, setShowTooltip] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadStatus = async () => {
      const res = await fetchNexusSyncStatus();
      if (isMounted && !isSyncing) {
        setSyncStatus(res);
      }
    };

    loadStatus();
    const interval = setInterval(loadStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isSyncing]);

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSyncing) return;

    setIsSyncing(true);
    setToastMessage(null);
    setSyncStatus(prev => ({
      ...prev,
      status: 'RUNNING',
      message: 'Sincronização profunda Nexus Sync em execução...'
    }));

    try {
      const res = await triggerManualNexusSync();
      
      const freshStatus = await fetchNexusSyncStatus();
      setSyncStatus(freshStatus);

      if (res.success) {
        setToastMessage('Auditoria de métricas concluída! Banco de dados atualizado.');
        setTimeout(() => setToastMessage(null), 4000);

        // Invalidate local insights cache & refresh table data
        clearInsightsCache();
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (err: any) {
      setSyncStatus(prev => ({
        ...prev,
        status: 'ERROR',
        message: err.message || 'Erro ao forçar sincronização'
      }));
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '03:00';
    }
  };

  const getLedStyle = () => {
    if (syncStatus.status === 'RUNNING' || isSyncing) {
      return 'bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse';
    }
    if (syncStatus.status === 'ERROR') {
      return 'bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse';
    }
    return 'bg-brand-neon shadow-[0_0_8px_#ccff00]';
  };

  return (
    <div 
      className="relative flex items-center cursor-pointer group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* 6px Glowing LED Dot */}
      <div className="flex items-center gap-2 py-1 px-2.5 rounded-full bg-brand-card/60 border border-brand-border/40 hover:border-brand-neon/40 transition-all">
        <span className={`w-2 h-2 rounded-full transition-all duration-300 ${getLedStyle()}`} />
        <span className="text-[11px] font-mono text-zinc-300 font-medium">Nexus Sync</span>
      </div>

      {/* Ultra-Clean Dark Tooltip Popover */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 p-4 bg-[#161618] border border-brand-border rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 text-left">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-2.5 mb-2.5">
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${getLedStyle()}`} />
              {syncStatus.engine_name}
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
              (syncStatus.status === 'RUNNING' || isSyncing) ? 'bg-amber-500/20 text-amber-400' :
              syncStatus.status === 'ERROR' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {isSyncing ? 'RUNNING' : syncStatus.status}
            </span>
          </div>

          <p className="text-xs text-zinc-300 font-sans leading-relaxed">
            {(syncStatus.status === 'SUCCESS' && !isSyncing)
              ? `Última sincronização profunda concluída com sucesso às ${formatTime(syncStatus.last_run)}.`
              : syncStatus.message}
          </p>

          {/* Toast feedback banner */}
          {toastMessage && (
            <div className="mt-2.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Manual Trigger Action Button */}
          <div className="mt-3 pt-2.5 border-t border-brand-border/40 space-y-2">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full py-2 px-3 bg-brand-card hover:bg-brand-neon hover:text-black text-brand-neon font-bold text-xs rounded-lg border border-brand-neon/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Forçar Sincronização</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
              <span>Automação PG_CRON: 03:00 AM</span>
              <span>60d Retention</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
