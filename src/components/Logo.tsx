import React from 'react';

export const Logo: React.FC<{ className?: string; collapsed?: boolean }> = ({ className = '', collapsed = false }) => {
  return (
    <div className={`flex items-center ${className}`}>
      {collapsed ? (
        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-start bg-black">
          <img
            src="/logo.png"
            alt="FA"
            className="h-8 w-auto max-w-none object-left object-cover select-none"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      ) : (
        <img
          src="/logo.png"
          alt="FAZENDO ACONTECER™"
          className="h-8 max-w-[200px] object-contain select-none"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
    </div>
  );
};
