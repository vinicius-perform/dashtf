import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

import { 
  getTodayRange, 
  getYesterdayRange, 
  getLast7DaysRange, 
  getLast30DaysRange,
  getThisMonthRange, 
  getLastMonthRange,
  formatDateRangeLabel
} from '../utils/timezone';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  timezone?: string;
}

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange, timezone = 'America/Sao_Paulo' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState<string | null>(null);
  
  const todayRange = getTodayRange(timezone);
  const todayParts = (value.startDate || todayRange.startDate).split('-');
  const initialYear = parseInt(todayParts[0]) || new Date().getFullYear();
  const initialMonth = (parseInt(todayParts[1]) || (new Date().getMonth() + 1)) - 1;

  const [startMonth, setStartMonth] = useState<number>(initialMonth);
  const [startYear, setStartYear] = useState<number>(initialYear);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync calendar display month when value changes
  useEffect(() => {
    if (value.startDate) {
      const parts = value.startDate.split('-');
      if (parts.length === 3) {
        setStartYear(parseInt(parts[0]));
        setStartMonth(parseInt(parts[1]) - 1);
      }
    }
  }, [value.startDate]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetSelect = (type: string) => {
    let range: DateRange;
    if (type === 'hoje') {
      range = getTodayRange(timezone);
    } else if (type === 'ontem') {
      range = getYesterdayRange(timezone);
    } else if (type === '7d') {
      range = getLast7DaysRange(timezone);
    } else if (type === '30d') {
      range = getLast30DaysRange(timezone);
    } else if (type === 'este_mes') {
      range = getThisMonthRange(timezone);
    } else if (type === 'mes_anterior') {
      range = getLastMonthRange(timezone);
    } else {
      range = getTodayRange(timezone);
    }

    range.label = formatDateRangeLabel(range.startDate, range.endDate, timezone);
    setTempStart(null);

    const sParts = range.startDate.split('-');
    setStartYear(parseInt(sParts[0]));
    setStartMonth(parseInt(sParts[1]) - 1);

    onChange(range);
  };

  const handleDateClick = (dayNum: number, mIdx: number, yNum: number) => {
    const formatNum = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const clickedStr = `${yNum}-${formatNum(mIdx + 1)}-${formatNum(dayNum)}`;

    if (!tempStart) {
      // First click: set temporary start date
      setTempStart(clickedStr);
      onChange({
        startDate: clickedStr,
        endDate: clickedStr,
        label: formatDateRangeLabel(clickedStr, clickedStr, timezone)
      });
    } else {
      // Second click: finalize range between tempStart and clickedStr
      const t1 = new Date(`${tempStart}T00:00:00`).getTime();
      const t2 = new Date(`${clickedStr}T00:00:00`).getTime();

      let finalStart = tempStart;
      let finalEnd = clickedStr;

      if (t2 < t1) {
        finalStart = clickedStr;
        finalEnd = tempStart;
      }

      setTempStart(null);

      onChange({
        startDate: finalStart,
        endDate: finalEnd,
        label: formatDateRangeLabel(finalStart, finalEnd, timezone)
      });
    }
  };

  // Helper to render days grid for a given month/year
  const renderMonthGrid = (monthIdx: number, yearNum: number) => {
    const daysInMonth = new Date(yearNum, monthIdx + 1, 0).getDate();
    const firstDayOfWeek = new Date(yearNum, monthIdx, 1).getDay();

    // Previous month filler days
    const prevMonthDays = new Date(yearNum, monthIdx, 0).getDate();
    const fillerDays = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      fillerDays.push(prevMonthDays - i);
    }

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }

    const startMs = value.startDate ? new Date(`${value.startDate}T00:00:00`).getTime() : 0;
    const endMs = value.endDate ? new Date(`${value.endDate}T00:00:00`).getTime() : 0;

    return (
      <div className="space-y-2">
        {/* Month Name Header */}
        <div className="text-center font-bold text-sm text-white capitalize">
          {MONTH_NAMES[monthIdx]} {yearNum}
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 text-center text-[11px] text-zinc-400 font-medium mb-1">
          {WEEKDAYS.map((w, idx) => (
            <span key={idx}>{w}</span>
          ))}
        </div>

        {/* Calendar Days Matrix */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {/* Muted Filler Days from Previous Month */}
          {fillerDays.map((fd, idx) => (
            <span key={`f-${idx}`} className="py-1.5 text-zinc-600 font-sans cursor-default">
              {fd}
            </span>
          ))}

          {/* Actual Month Days */}
          {days.map((d) => {
            const formatNum = (n: number) => (n < 10 ? `0${n}` : `${n}`);
            const cellDateStr = `${yearNum}-${formatNum(monthIdx + 1)}-${formatNum(d)}`;
            const cellMs = new Date(`${cellDateStr}T00:00:00`).getTime();

            const isStart = cellDateStr === value.startDate;
            const isEnd = cellDateStr === value.endDate;
            const isInRange = startMs && endMs && cellMs >= Math.min(startMs, endMs) && cellMs <= Math.max(startMs, endMs);

            return (
              <button
                key={d}
                type="button"
                onClick={() => handleDateClick(d, monthIdx, yearNum)}
                className={`py-1.5 rounded-md font-semibold text-xs transition-all relative ${
                  isStart || isEnd
                    ? 'bg-brand-neon text-black font-extrabold shadow-md shadow-brand-neon/30 z-10'
                    : isInRange
                    ? 'bg-[#536A00] text-brand-neon font-bold'
                    : 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const nextMonthIdx = (startMonth + 1) % 12;
  const nextMonthYear = startMonth === 11 ? startYear + 1 : startYear;

  return (
    <div className="relative" ref={containerRef}>
      {/* Date Range Trigger Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all select-none cursor-pointer ${
          isOpen
            ? 'border-2 border-brand-neon text-brand-neon bg-brand-neon/10 shadow-lg shadow-brand-neon/20'
            : 'border border-brand-border bg-brand-card text-zinc-200 hover:border-brand-neon/50'
        }`}
      >
        <Calendar className="w-3.5 h-3.5 text-brand-neon" />
        <span>{value.label}</span>
      </button>

      {/* Popover Calendar (Positioned with right-0 to prevent right-edge overflow) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-[#121214] border border-brand-border rounded-2xl shadow-2xl z-50 p-5 w-[540px] max-w-[90vw] space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Top Horizontal Preset Tabs */}
          <div className="flex items-center gap-6 text-xs font-semibold text-zinc-400 border-b border-brand-border/60 pb-3 px-1 overflow-x-auto">
            <button
              onClick={() => handlePresetSelect('hoje')}
              className="hover:text-brand-neon transition-colors shrink-0"
            >
              Hoje
            </button>
            <button
              onClick={() => handlePresetSelect('ontem')}
              className="hover:text-brand-neon transition-colors shrink-0"
            >
              Ontem
            </button>
            <button
              onClick={() => handlePresetSelect('7d')}
              className="hover:text-brand-neon transition-colors shrink-0"
            >
              Últimos 7 dias
            </button>
            <button
              onClick={() => handlePresetSelect('este_mes')}
              className="text-white font-bold underline decoration-brand-neon decoration-2 underline-offset-4 shrink-0"
            >
              Este mês
            </button>
            <button
              onClick={() => handlePresetSelect('mes_anterior')}
              className="hover:text-brand-neon transition-colors shrink-0"
            >
              Mês anterior
            </button>
          </div>

          {/* Navigation Controls & Dual Month Grid */}
          <div className="relative">
            {/* Prev Month Arrow */}
            <button
              type="button"
              onClick={() => setStartMonth(startMonth === 0 ? 11 : startMonth - 1)}
              className="absolute left-0 top-0.5 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Next Month Arrow */}
            <button
              type="button"
              onClick={() => setStartMonth((startMonth + 1) % 12)}
              className="absolute right-0 top-0.5 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dual Month Side-by-Side Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 px-2 pt-1">
              {renderMonthGrid(startMonth, startYear)}
              {renderMonthGrid(nextMonthIdx, nextMonthYear)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
