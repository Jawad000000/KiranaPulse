'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type MiniCalendarProps = {
  selected: Date | null;
  onSelect: (date: Date) => void;
  maxDate?: Date;
  minDate?: Date;
};

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function MiniCalendar({ selected, onSelect, maxDate, minDate }: MiniCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const isDisabled = (day: number): boolean => {
    const date = new Date(viewYear, viewMonth, day);
    if (maxDate && date > maxDate) return true;
    if (minDate && date < minDate) return true;
    return false;
  };

  // Build calendar grid
  const cells: { day: number; inMonth: boolean; disabled: boolean }[] = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, inMonth: false, disabled: true });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true, disabled: isDisabled(d) });
  }

  // Next month leading days
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, inMonth: false, disabled: true });
  }

  return (
    <div className="w-full bg-white rounded-xl border border-gray-100 p-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <div className="font-sans font-bold text-sm text-dark">
          {MONTHS[viewMonth]} {viewYear}
        </div>
        <button
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => {
          const isSelected =
            cell.inMonth &&
            selected &&
            isSameDay(selected, new Date(viewYear, viewMonth, cell.day));
          const isToday =
            cell.inMonth && isSameDay(today, new Date(viewYear, viewMonth, cell.day));

          return (
            <button
              key={i}
              disabled={cell.disabled || !cell.inMonth}
              onClick={() => {
                if (cell.inMonth && !cell.disabled) {
                  onSelect(new Date(viewYear, viewMonth, cell.day));
                }
              }}
              className={`
                w-full aspect-square flex items-center justify-center text-xs font-sans rounded-lg transition-all
                ${!cell.inMonth ? 'text-gray-200 cursor-default' : ''}
                ${cell.inMonth && !cell.disabled && !isSelected ? 'text-gray-700 hover:bg-gray-50 cursor-pointer' : ''}
                ${cell.inMonth && cell.disabled ? 'text-gray-300 cursor-not-allowed' : ''}
                ${isSelected ? 'bg-[#111] text-white font-bold' : ''}
                ${isToday && !isSelected ? 'ring-1 ring-[#10B981] font-bold text-[#10B981]' : ''}
              `}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
