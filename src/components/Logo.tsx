import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Favicon / Icon Symbol */}
      <img
        src="/favicon.png"
        alt="FAZENDO ACONTECER™"
        className="h-8 w-8 object-contain rounded-lg shadow-sm shrink-0"
      />

      {/* Full Typography Brand Name & Tagline */}
      <div className="flex flex-col">
        <span className="font-black text-sm tracking-tight text-white uppercase font-sans leading-none flex items-center gap-0.5">
          FAZENDO ACONTECER<span className="text-[10px] text-brand-neon font-bold">™</span>
        </span>
        <span className="text-[9px] text-brand-textMuted font-bold tracking-widest uppercase mt-1">
          Meta Ads Performance
        </span>
      </div>
    </div>
  );
};
