import React from 'react';

interface TableCheckboxProps {
  checked: boolean;
  onChange: (e: React.MouseEvent) => void;
  title?: string;
}

export const TableCheckbox: React.FC<TableCheckboxProps> = React.memo(({
  checked,
  onChange,
  title
}) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onChange(e);
      }}
      title={title || (checked ? 'Desmarcar linha' : 'Selecionar linha')}
      className={`w-4 h-4 rounded border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
        checked
          ? 'bg-blue-600 border-blue-400 text-white shadow-sm shadow-blue-500/30'
          : 'bg-zinc-900 border-zinc-600 hover:border-zinc-400'
      }`}
    >
      {checked && (
        <svg className="w-3 h-3 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
});

TableCheckbox.displayName = 'TableCheckbox';
