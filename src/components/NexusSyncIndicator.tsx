import React, { useEffect, useState } from 'react';
import { fetchNexusSyncStatus, NexusSyncStatus } from '../services/meta/nexusSyncEngine';

export const NexusSyncIndicator: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<NexusSyncStatus>({
    id: 1,
    engine_name: 'Nexus Sync',
    last_run: new Date().toISOString(),
    status: 'SUCCESS',
    message: 'Sincronização profunda concluída com sucesso'
  });
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadStatus = async () => {
      const res = await fetchNexusSyncStatus();
      if (isMounted) {
        setSyncStatus(res);
      }
    };

    loadStatus();
    const interval = setInterval(loadStatus, 60000); // Polling discrete status every 60s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '03:00';
    }
  };

  const getLedStyle = () => {
    if (syncStatus.status === 'RUNNING') {
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
      <div className="flex items-center gap-2 py-1 px-2 rounded-full bg-brand-card/60 border border-brand-border/40 hover:border-brand-neon/40 transition-colors">
        <span className={`w-2 h-2 rounded-full transition-all duration-300 ${getLedStyle()}`} />
        <span className="text-[11px] font-mono text-zinc-400 font-medium">Nexus Sync</span>
      </div>

      {/* Ultra-Clean Dark Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 p-3.5 bg-[#161618] border border-brand-border rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 text-left">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-2 mb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${getLedStyle()}`} />
              {syncStatus.engine_name}
            </span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
              syncStatus.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
              syncStatus.status === 'RUNNING' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {syncStatus.status}
            </span>
          </div>

          <p className="text-xs text-zinc-300 font-sans leading-relaxed">
            {syncStatus.status === 'SUCCESS' 
              ? `Última sincronização profunda concluída com sucesso às ${formatTime(syncStatus.last_run)}.`
              : syncStatus.message}
          </p>

          <div className="mt-2.5 pt-2 border-t border-brand-border/40 flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span>Automação PG_CRON: 03:00 AM</span>
            <span>60 Dias Retention</span>
          </div>
        </div>
      )}
    </div>
  );
};
