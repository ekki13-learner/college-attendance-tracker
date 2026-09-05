import React from 'react';
import { CircularProgress } from '../common/CircularProgress';
import { StatusBadge } from '../common/StatusBadge';
import { CheckCircle2, XCircle, Slash, BookOpen, AlertTriangle, Calendar } from 'lucide-react';

interface OverallCardProps {
  stats: {
    percentage: number;
    attended: number;
    absent: number;
    cancelled: number;
    total: number;
    status: 'safe' | 'caution' | 'low' | 'critical';
    classesNeeded: number;
    classesCanMiss: number;
    message: string;
    isAtRisk: boolean;
  };
  totalSubjects: number;
  atRiskCount: number;
  requiredAttendance: number;
}

export const OverallCard: React.FC<OverallCardProps> = ({
  stats,
  totalSubjects,
  atRiskCount,
  requiredAttendance,
}) => {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
        {/* Left Circular Gauge & Status */}
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <CircularProgress percentage={stats.percentage} status={stats.status} size={135} strokeWidth={11} />
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <StatusBadge status={stats.status} />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Target: {requiredAttendance}%
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.percentage}% <span className="text-slate-600 dark:text-slate-400 text-lg font-semibold">Overall</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-sm">
              {stats.message}
            </p>
          </div>
        </div>

        {/* Right Stats Quick Grid */}
        <div className="w-full md:w-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                {stats.attended}
              </div>
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                Attended
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                {stats.absent}
              </div>
              <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                Absent
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              <Slash className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                {stats.cancelled}
              </div>
              <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Cancelled
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40">
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                {stats.total}
              </div>
              <div className="text-[11px] font-semibold text-sky-700 dark:text-sky-400">
                Total Held
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                {totalSubjects}
              </div>
              <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400">
                Subjects
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                {atRiskCount}
              </div>
              <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                Need Attention
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};