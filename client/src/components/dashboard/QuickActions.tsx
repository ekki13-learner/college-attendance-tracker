import React from 'react';
import { PlusCircle, CalendarDays, CheckCircle2, BarChart3 } from 'lucide-react';

interface QuickActionsProps {
  onAddSubject: () => void;
  onAddClass: () => void;
  onNavigate: (tab: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAddSubject,
  onAddClass,
  onNavigate,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <button
        onClick={onAddSubject}
        className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-500 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-sm hover:shadow transition-all active:scale-98 group"
      >
        <PlusCircle className="w-4 h-4 text-brand-600 group-hover:scale-110 transition-transform" />
        <span>Add Subject</span>
      </button>

      <button
        onClick={onAddClass}
        className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-500 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-sm hover:shadow transition-all active:scale-98 group"
      >
        <PlusCircle className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
        <span>Add Class</span>
      </button>

      <button
        onClick={() => onNavigate('schedule')}
        className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-500 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-sm hover:shadow transition-all active:scale-98 group"
      >
        <CalendarDays className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
        <span>View Timetable</span>
      </button>

      <button
        onClick={() => onNavigate('attendance')}
        className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-500 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-sm hover:shadow transition-all active:scale-98 group"
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
        <span>Full History</span>
      </button>
    </div>
  );
};