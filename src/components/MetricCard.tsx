import React from 'react';
import { DollarSign } from 'lucide-react';

interface MetricCardProps {
  title: string;
  mainValue: string;
  extraInfoLabel?: string;
  extraInfoValue?: string;
  showDollarIcon?: boolean;
  isLoading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = React.memo(({
  title,
  mainValue,
  extraInfoLabel,
  extraInfoValue,
  showDollarIcon = true,
  isLoading = false,
}) => {
  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex flex-col justify-between hover:border-brand-neon/40 transition-all shadow-sm group sharp-card">
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {showDollarIcon && (
            <DollarSign className="w-4 h-4 text-brand-neon shrink-0" />
          )}
          <span className="text-xs font-bold text-zinc-300 tracking-tight uppercase group-hover:text-white transition-colors">
            {title}
          </span>
        </div>
      </div>

      {/* Main Metric Value / Skeleton Loader */}
      {isLoading ? (
        <div className="h-8 w-28 rounded skeleton-shimmer my-1" />
      ) : (
        <div className="text-2xl font-black text-white tracking-tight my-1">
          {mainValue}
        </div>
      )}

      {/* Extra Info (e.g. CPA / CAC for Leads) */}
      {extraInfoLabel && (
        <div className="flex items-center justify-between text-xs border-t border-brand-border/60 pt-2.5 mt-2">
          <span className="text-zinc-400 font-medium">{extraInfoLabel}:</span>
          {isLoading ? (
            <div className="h-4 w-12 rounded skeleton-shimmer" />
          ) : (
            <span className="font-bold text-brand-neon">{extraInfoValue}</span>
          )}
        </div>
      )}
    </div>
  );
});

MetricCard.displayName = 'MetricCard';
