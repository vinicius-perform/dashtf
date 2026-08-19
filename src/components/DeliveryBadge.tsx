import React, { useState } from 'react';
import { DeliveryStatusInfo } from '../types/meta';
import { BaseTooltip } from './BaseTooltip';
import { AlertTriangle, CheckCircle2, Clock, HelpCircle, PauseCircle, XCircle } from 'lucide-react';

interface DeliveryBadgeProps {
  deliveryInfo?: DeliveryStatusInfo;
  statusFallback?: string;
}

export const DeliveryBadge: React.FC<DeliveryBadgeProps> = React.memo(({
  deliveryInfo,
  statusFallback = 'ACTIVE'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const info: DeliveryStatusInfo = deliveryInfo || {
    code: statusFallback === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
    label: statusFallback === 'ACTIVE' ? 'Ativo' : 'Pausado',
    badgeColor: statusFallback === 'ACTIVE' ? 'green' : 'gray'
  };

  const getStyleClasses = () => {
    switch (info.badgeColor) {
      case 'green':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20';
      case 'blue':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20';
      case 'yellow':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20';
      case 'amber':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25';
      case 'red':
        return 'bg-red-500/15 text-red-400 border-red-500/40 hover:bg-red-500/25 font-bold animate-pulse';
      case 'gray':
      default:
        return 'bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:bg-zinc-800';
    }
  };

  const getIcon = () => {
    switch (info.code) {
      case 'ACTIVE':
        return <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />;
      case 'SCHEDULED':
      case 'IN_LEARNING':
        return <Clock className="w-3 h-3 text-blue-400 shrink-0" />;
      case 'LEARNING_LIMITED':
      case 'PENDING_REVIEW':
        return <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />;
      case 'DISAPPROVED':
      case 'ACCOUNT_ERROR':
      case 'NOT_DELIVERING':
        return <XCircle className="w-3 h-3 text-red-400 shrink-0" />;
      case 'PAUSED':
      case 'COMPLETED':
      default:
        return <PauseCircle className="w-3 h-3 text-zinc-500 shrink-0" />;
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-default ${getStyleClasses()}`}
      >
        {getIcon()}
        <span>{info.label}</span>

        {info.reason && (
          <HelpCircle className="w-3 h-3 text-current opacity-70 ml-0.5" />
        )}
      </div>

      {/* Meta API Error / Rejection Tooltip with BaseTooltip standard */}
      <BaseTooltip
        visible={showTooltip && Boolean(info.reason)}
        title="Detalhe de Veiculação (Meta API):"
        titleIcon={<AlertTriangle className="w-3.5 h-3.5" />}
        content={info.reason || ''}
      />
    </div>
  );
});

DeliveryBadge.displayName = 'DeliveryBadge';
