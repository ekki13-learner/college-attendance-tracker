import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Ban, Calendar as CalendarIcon } from 'lucide-react';
import { Modal } from '../common/Modal';

interface CalendarViewProps {
  daysData: Record<string, { present: number; absent: number; cancelled: number; records: any[] }>;
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  daysData,
  year,
  month,
  onMonthChange,
}) => {
  const [selectedDateRecords, setSelectedDateRecords] = useState<{ date: string; records: any[] } | null>(null);

  const prevMonth = () => {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  };

  const nextMonth = () => {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  };

  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1)
  );

  // Generate calendar grid dates
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  const calendarCells = [];
  // Empty slots for preceding days
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  // Days of month
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    calendarCells.push(dayNum);
  }

  const handleDayClick = (dayNum: number) => {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dayData = daysData[dateKey];
    if (dayData && dayData.records.length > 0) {
      setSelectedDateRecords({ date: dateKey, records: dayData.records });
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
      {/* Month Navigation */}
      <div className="flex items-center justify-between pb-6 mb-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-brand-500" />
          {monthName}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400 mb-4 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Cancelled
        </span>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center font-extrabold text-[11px] text-slate-400 uppercase tracking-wider mb-2">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarCells.map((dayNum, idx) => {
          if (dayNum === null) {
            return <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-xl bg-transparent" />;
          }

          const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const dayData = daysData[dateKey];
          const hasRecords = Boolean(dayData && dayData.records.length > 0);

          return (
            <div
              key={dateKey}
              onClick={() => handleDayClick(dayNum)}
              className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-xl border transition-all flex flex-col justify-between ${
                hasRecords
                  ? 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 hover:border-brand-500 cursor-pointer hover:shadow-sm'
                  : 'border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/30 text-slate-400'
              }`}
            >
              <div className="text-[11px] sm:text-xs font-black text-slate-700 dark:text-slate-300">
                {dayNum}
              </div>

              {hasRecords && (
                <div className="flex flex-wrap items-center gap-1 mt-auto">
                  {dayData.present > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title={`${dayData.present} Present`} />
                  )}
                  {dayData.absent > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500" title={`${dayData.absent} Absent`} />
                  )}
                  {dayData.cancelled > 0 && (
                    <span className="w-2 h-2 rounded-full bg-slate-400" title={`${dayData.cancelled} Cancelled`} />
                  )}
                  <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 ml-0.5 hidden sm:inline">
                    {dayData.records.length}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Day Details Modal */}
      {selectedDateRecords && (
        <Modal
          isOpen={Boolean(selectedDateRecords)}
          onClose={() => setSelectedDateRecords(null)}
          title={`Attendance on ${selectedDateRecords.date}`}
        >
          <div className="space-y-3">
            {selectedDateRecords.records.map((r, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-600 dark:text-slate-400">
                      {r.subject_code}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {r.subject_name}
                    </span>
                  </div>
                  {r.start_time && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {r.start_time} - {r.end_time} • {r.class_type || 'Lecture'}
                    </div>
                  )}
                  {r.notes && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 italic mt-1">
                      {r.notes}
                    </div>
                  )}
                </div>

                <div>
                  {r.status === 'present' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                      <Check className="w-3.5 h-3.5" /> Present
                    </span>
                  )}
                  {r.status === 'absent' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800">
                      <X className="w-3.5 h-3.5" /> Absent
                    </span>
                  )}
                  {r.status === 'cancelled' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">
                      <Ban className="w-3 h-3" /> Cancelled
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};