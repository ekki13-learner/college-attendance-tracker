import React, { useState } from 'react';
import { TodayClass } from '../../api/client';
import { Clock, MapPin, User, Check, X, Ban, Edit3, CalendarCheck, Sparkles } from 'lucide-react';

interface TodayClassesProps {
  dayName: string;
  date: string;
  classes: TodayClass[];
  onMark: (scheduleId: number, subjectId: number, status: 'present' | 'absent' | 'cancelled') => Promise<void>;
  onNavigateToSchedule: () => void;
}

export const TodayClasses: React.FC<TodayClassesProps> = ({
  dayName,
  date,
  classes,
  onMark,
  onNavigateToSchedule,
}) => {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleAction = async (schId: number, subId: number, status: 'present' | 'absent' | 'cancelled') => {
    try {
      setLoadingId(schId);
      await onMark(schId, subId, status);
      setEditingId(null);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 text-xs font-black uppercase tracking-wider">
              {dayName}
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Today's Classes</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Read directly from your weekly schedule. Mark present or absent with one click.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          {classes.length} {classes.length === 1 ? 'class' : 'classes'} scheduled
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="py-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 mb-3">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No classes scheduled today!</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xs">
            Enjoy your free day or review your weekly schedule to add classes for {dayName}.
          </p>
          <button
            onClick={onNavigateToSchedule}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
          >
            Manage Weekly Schedule
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {classes.map((item) => {
            const isMarked = Boolean(item.attendance);
            const isEditing = editingId === item.scheduleId;
            const currentStatus = item.attendance?.status;
            const isLoading = loadingId === item.scheduleId;

            return (
              <div
                key={item.scheduleId}
                className="py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
              >
                {/* Left info */}
                <div className="flex items-start gap-4">
                  {/* Subject Color Pill */}
                  <div
                    className="w-3 self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.subjectColor || '#0284c7' }}
                  />

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        {item.subjectCode}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {item.subjectName}
                      </h4>
                      {item.classType && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.classType}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 mt-1.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-brand-500" />
                        {item.startTime} - {item.endTime}
                      </span>
                      {item.room && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          Room {item.room}
                        </span>
                      )}
                      {item.faculty && (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {item.faculty}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Attendance Controls */}
                <div className="flex items-center gap-2 sm:self-center pl-7 md:pl-0">
                  {isMarked && !isEditing ? (
                    <div className="flex items-center gap-2">
                      {currentStatus === 'present' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold shadow-sm">
                          <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                          Present
                        </span>
                      )}
                      {currentStatus === 'absent' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold shadow-sm">
                          <X className="w-4 h-4 text-rose-500 stroke-[3]" />
                          Absent
                        </span>
                      )}
                      {currentStatus === 'cancelled' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                          <Ban className="w-3.5 h-3.5" />
                          Cancelled
                        </span>
                      )}

                      <button
                        onClick={() => setEditingId(item.scheduleId)}
                        title="Edit attendance"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        disabled={isLoading}
                        onClick={() => handleAction(item.scheduleId, item.subjectId, 'present')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        Present
                      </button>

                      <button
                        disabled={isLoading}
                        onClick={() => handleAction(item.scheduleId, item.subjectId, 'absent')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-sm shadow-rose-600/20 transition-all disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                        Absent
                      </button>

                      <button
                        disabled={isLoading}
                        onClick={() => handleAction(item.scheduleId, item.subjectId, 'cancelled')}
                        title="Class was cancelled (does not count toward total classes)"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Cancelled
                      </button>

                      {isEditing && (
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-slate-600 dark:text-slate-400 hover:underline px-1"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};