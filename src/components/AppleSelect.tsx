import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface AppleSelectOption<T = string> {
  value: T;
  label: string;
  badgeColor?: string;
  badgeClass?: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

export interface AppleSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: AppleSelectOption<T>[];
  icon?: React.ReactNode;
  label?: string;
  placeholder?: string;
  className?: string;
  menuWidth?: string;
  align?: 'left' | 'right';
}

export function AppleSelect<T extends string = string>({
  value,
  onChange,
  options,
  icon,
  label,
  placeholder,
  className = '',
  menuWidth = 'min-w-[190px]',
  align = 'left'
}: AppleSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];
  const isDefault = value === 'TODOS' || value === 'TODAS' || value === 'ALL';

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative select-none ${className}`} ref={containerRef}>
      {/* Botão Trigger Estilo Apple Glassmorphism */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-200 outline-none active:scale-[0.97] ${
          isOpen
            ? 'bg-zinc-800/95 border-brand-neon/60 text-white shadow-lg shadow-brand-neon/10 ring-1 ring-brand-neon/30'
            : !isDefault
            ? 'bg-zinc-850/90 border-brand-neon/40 text-brand-neon shadow-sm hover:border-brand-neon hover:bg-zinc-800'
            : 'bg-zinc-900/80 hover:bg-zinc-850/90 border-zinc-750/80 hover:border-zinc-600 text-zinc-300 hover:text-white shadow-xs'
        }`}
      >
        {/* Ícone ou Badge */}
        {icon && (
          <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
            {icon}
          </span>
        )}

        {/* Label descritivo opcional */}
        {label && (
          <span className="text-[11px] text-zinc-400 font-medium">
            {label}:
          </span>
        )}

        {/* Texto Selecionado */}
        <span className="truncate tracking-tight font-medium">
          {selectedOption ? selectedOption.label : placeholder || 'Selecionar'}
        </span>

        {/* Indicador de filtro ativo (ponto sutil) */}
        {!isDefault && (
          <span className="w-1.5 h-1.5 rounded-full bg-brand-neon animate-pulse shrink-0" />
        )}

        {/* Seta Chevron com animação de rotação */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand-neon' : 'group-hover:text-zinc-200'
          }`}
        />
      </button>

      {/* Menu Popover Flutuante Estilo macOS / Apple Glass */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } top-full mt-2 ${menuWidth} p-1.5 bg-[#18181b]/95 backdrop-blur-2xl border border-zinc-700/80 rounded-2xl shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden ring-1 ring-white/10`}
        >
          <div className="space-y-0.5 max-h-64 overflow-y-auto custom-scrollbar">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={String(option.value)}
                  onClick={() => handleSelect(option.value)}
                  className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-brand-neon/15 text-brand-neon font-bold shadow-xs'
                      : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {/* Dot ou Badge Colorido opcional */}
                    {option.badgeColor ? (
                      <span
                        className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: option.badgeColor }}
                      />
                    ) : option.badgeClass ? (
                      <span className={`w-2 h-2 rounded-full shrink-0 ${option.badgeClass}`} />
                    ) : null}

                    {/* Ícone opcional no item */}
                    {option.icon && (
                      <span className="shrink-0">{option.icon}</span>
                    )}

                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{option.label}</span>
                      {option.subtitle && (
                        <span className="text-[10px] text-zinc-500 font-normal truncate">
                          {option.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ícone Checkmark para item selecionado estilo Apple */}
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 stroke-[3] text-brand-neon shrink-0 animate-in fade-in duration-150" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
