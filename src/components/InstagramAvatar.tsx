import React, { useState, useEffect } from 'react';
import { cleanInstagramHandle } from '../services/instagramScraperService';

interface InstagramAvatarProps {
  avatarUrl?: string;
  handle?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const InstagramAvatar: React.FC<InstagramAvatarProps> = ({
  avatarUrl,
  handle,
  name,
  size = 'md',
  className = ''
}) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [retryStage, setRetryStage] = useState(0); // 0: primary, 1: unavatar, 2: wsrv proxy, 3: initials

  const cleanHandle = handle ? cleanInstagramHandle(handle).cleanHandle : '';

  useEffect(() => {
    setHasError(false);
    setRetryStage(0);
    
    if (avatarUrl && avatarUrl.trim()) {
      setImgSrc(avatarUrl.trim());
    } else if (cleanHandle) {
      setImgSrc(`https://unavatar.io/instagram/${cleanHandle}`);
    } else {
      setImgSrc(null);
    }
  }, [avatarUrl, cleanHandle]);

  const handleError = () => {
    if (retryStage === 0) {
      setRetryStage(1);
      // Se tinha avatarUrl customizado, tenta via proxy wsrv.nl para contornar bloqueios de CORS/hotlink
      if (avatarUrl && avatarUrl.trim() && !avatarUrl.includes('wsrv.nl')) {
        setImgSrc(`https://wsrv.nl/?url=${encodeURIComponent(avatarUrl.trim())}&w=160&h=160&fit=cover&output=webp`);
        return;
      }
      // Se não, tenta unavatar via handle
      if (cleanHandle && imgSrc !== `https://unavatar.io/instagram/${cleanHandle}`) {
        setImgSrc(`https://unavatar.io/instagram/${cleanHandle}`);
        return;
      }
    } else if (retryStage === 1) {
      setRetryStage(2);
      if (cleanHandle && !imgSrc?.includes('wsrv.nl')) {
        setImgSrc(`https://wsrv.nl/?url=${encodeURIComponent(`https://unavatar.io/instagram/${cleanHandle}`)}&w=160&h=160&fit=cover&output=webp`);
        return;
      }
    }

    setHasError(true);
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-base'
  };

  const initials = (name || 'CL')
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'CL';

  return (
    <div className={`relative shrink-0 ${className}`}>
      {imgSrc && !hasError ? (
        <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 shadow-md inline-block">
          <img
            src={imgSrc}
            alt={name}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            loading="lazy"
            onError={handleError}
            className={`${sizeClasses[size]} rounded-full object-cover border-2 border-brand-sidebar bg-zinc-900`}
          />
        </div>
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-tr from-brand-neon to-emerald-400 text-black font-black flex items-center justify-center border border-zinc-700 shadow-inner`}>
          {initials}
        </div>
      )}
    </div>
  );
};
