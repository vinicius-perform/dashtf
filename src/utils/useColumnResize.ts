import { useState, useCallback, useRef } from 'react';

const STORAGE_KEY = 'meta_gerenciador_col_widths';

export const DEFAULT_WIDTHS: Record<string, number> = {
  checkbox: 40,
  status: 60,
  name: 320,
  deliveryInfo: 150,
  daily_budget: 130,
  spend: 140,
  conversions: 130,
  cpa: 140,
  profileVisits: 130,
  retentionPct: 130,
  followersGained: 130,
  cps: 120,
  impressions: 130,
  cpm: 120,
  reach: 120,
  frequency: 110,
  clicks: 130,
  cpc: 120,
  landingPageViews: 130,
  ctr: 120,
  action: 80
};

export function useColumnResize() {
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_WIDTHS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load column widths:', e);
    }
    return DEFAULT_WIDTHS;
  });

  const resizingColumn = useRef<string | null>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);
  const rafId = useRef<number | null>(null);

  const startResizing = useCallback((columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingColumn.current = columnKey;
    startX.current = e.clientX;
    startWidth.current = widths[columnKey] || DEFAULT_WIDTHS[columnKey] || 120;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingColumn.current) return;
      if (rafId.current) cancelAnimationFrame(rafId.current);

      rafId.current = requestAnimationFrame(() => {
        const delta = moveEvent.clientX - startX.current;
        const newWidth = Math.max(70, startWidth.current + delta);

        setWidths((prev) => {
          const updated = {
            ...prev,
            [resizingColumn.current!]: newWidth
          };
          return updated;
        });
      });
    };

    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (resizingColumn.current) {
        resizingColumn.current = null;
        setWidths((currentWidths) => {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentWidths));
          } catch (e) {}
          return currentWidths;
        });
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [widths]);

  return {
    widths,
    startResizing
  };
}
