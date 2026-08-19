import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { SortState } from '../utils/tableSort';

interface SortableHeaderProps {
  columnKey: string;
  label: string;
  sortState: SortState;
  onSort: (columnKey: string) => void;
  onResizeStart?: (columnKey: string, e: React.MouseEvent) => void;
  width?: number;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const SortableHeader: React.FC<SortableHeaderProps> = React.memo(({
  columnKey,
  label,
  sortState,
  onSort,
  onResizeStart,
  width,
  align = 'left',
  className = ''
}) => {
  const isSorted = sortState.column === columnKey;
  const isDesc = sortState.direction === 'DESC';

  const alignClass = {
    left: 'justify-start text-left',
    center: 'justify-center text-center',
    right: 'justify-end text-right'
  }[align];

  return (
    <th
      onClick={() => onSort(columnKey)}
      style={width ? { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` } : undefined}
      className={`relative py-3 px-3 select-none cursor-pointer group transition-colors hover:bg-zinc-800/60 overflow-hidden text-ellipsis whitespace-nowrap ${alignClass} ${className}`}
    >
      <div className={`inline-flex items-center gap-1.5 w-full overflow-hidden ${alignClass}`}>
        <span
          className={`font-bold transition-colors truncate ${
            isSorted ? 'text-blue-400' : 'text-brand-textMuted group-hover:text-white'
          }`}
        >
          {label}
        </span>

        {/* Crisp SVG Arrow Indicator */}
        {isSorted && (
          <span className="text-blue-400 shrink-0 font-extrabold flex items-center">
            {isDesc ? (
              <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
          </span>
        )}
      </div>

      {/* Resizable Drag Handle (Right Edge Handle) */}
      {onResizeStart && (
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => onResizeStart(columnKey, e)}
          className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500/70 active:bg-blue-400 z-20 group-hover:bg-zinc-700/50 transition-colors"
          title="Arrastar para redimensionar largura da coluna"
        />
      )}
    </th>
  );
});

SortableHeader.displayName = 'SortableHeader';
