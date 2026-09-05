import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Subject } from '../../api/client';

interface AttendanceWarningsProps {
  subjects: Subject[];
  onSelectSubject: (id: number) => void;
}

export const AttendanceWarnings: React.FC<AttendanceWarningsProps> = ({
  subjects,
  onSelectSubject,
}) => {
  const atRisk = subjects.filter((s) => s.stats.isAtRisk && s.stats.total > 0);

  if (atRisk.length === 0) return null;

  return (
    <div className="rounded-3xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-3 text-amber-800 dark:text-amber-300 font-bold">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h3 className="text-base font-black tracking-tight">Attendance Warning</h3>
      </div>
      <div className="space-y-2.5">
        {atRisk.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelectSubject(s.id)}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/60 dark:border-amber-900/40 hover:border-amber-400 cursor-pointer transition-all shadow-sm group"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase text-amber-700 dark:text-amber-400">
                  {s.code}
                </span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {s.name}
                </span>
                <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                  {s.stats.percentage}%
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {s.stats.message}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        ))}
      </div>
    </div>
  );
};