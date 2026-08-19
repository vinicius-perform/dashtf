import React from 'react';

interface BaseTooltipProps {
  title?: string;
  titleIcon?: React.ReactNode;
  content: string | React.ReactNode;
  visible: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidthClass?: string;
}

export const BaseTooltip: React.FC<BaseTooltipProps> = React.memo(({
  title,
  titleIcon,
  content,
  visible,
  position = 'top',
  maxWidthClass = 'max-w-[320px]'
}) => {
  if (!visible) return null;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2.5'
  }[position];

  return (
    <div 
      className={`absolute ${positionClasses} ${maxWidthClass} min-w-[240px] bg-zinc-900/95 text-white border border-zinc-700/80 rounded-xl shadow-2xl backdrop-blur-md px-4 py-3 z-50 pointer-events-none text-left box-border whitespace-normal break-words overflow-hidden leading-relaxed`}
      style={{ boxSizing: 'border-box' }}
    >
      {title && (
        <div className="font-bold text-xs text-red-400 mb-1.5 flex items-center gap-1.5 border-b border-zinc-800 pb-1.5">
          {titleIcon}
          <span>{title}</span>
        </div>
      )}
      <div className="text-xs text-zinc-200 leading-normal tracking-wide space-y-1">
        {content}
      </div>
    </div>
  );
});

BaseTooltip.displayName = 'BaseTooltip';
