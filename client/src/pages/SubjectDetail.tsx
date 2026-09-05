import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  Slash,
  Clock,
  MapPin,
  User,
  Calculator,
  Trash2,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface SubjectDetailProps {
  subjectId: number;
  onBack: () => void;
}

export const SubjectDetail: React.FC<SubjectDetailProps> = ({ subjectId, onBack }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getSubject(subjectId);
      setData(res.subject);
    } catch (err) {
      console.error('Failed to load course details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subjectId]);

  const handleDeleteRecord = async (recordId: number) => {
    if (!window.confirm('Delete this attendance record?')) return;
    try {
      setDeletingId(recordId);
      await api.deleteAttendance(recordId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete attendance:', err);
      alert('Could not delete attendance record.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Course not found.</p>
        <button onClick={onBack} className="mt-3 text-xs font-bold text-brand-600 hover:underline">
          Return to subjects
        </button>
      </div>
    );
  }

  const { stats, schedules, trendData, attendanceHistory } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Bar with Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: data.color || '#2563eb' }}
            />
            <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
              {data.code}
            </span>
            <StatusBadge status={stats.status} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {data.name}
          </h1>
        </div>
      </div>

      {/* Main Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Current %</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.percentage}%
          </div>
          <span className="text-[10px] text-slate-600 dark:text-slate-400">Target: {data.requiredAttendance}%</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Attended</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.attended}
          </div>
          <span className="text-[10px] text-slate-600 dark:text-slate-400">Classes present</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Absent</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {stats.absent}
          </div>
          <span className="text-[10px] text-slate-600 dark:text-slate-400">Classes missed</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Cancelled</span>
          <div className="text-2xl font-black text-slate-600 dark:text-slate-400 mt-1">
            {stats.cancelled}
          </div>
          <span className="text-[10px] text-slate-600 dark:text-slate-400">Not counted in total</span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-sky-600 dark:text-sky-400">Total Held</span>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">
            {stats.total}
          </div>
          <span className="text-[10px] text-slate-600 dark:text-slate-400">Attended + Absent</span>
        </div>
      </div>

      {/* Smart Attendance Calculator Breakdown Box */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-50/80 via-sky-50/60 to-indigo-50/80 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 border border-brand-200/70 dark:border-slate-700/60 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Smart Attendance Calculator
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recovery Needed */}
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/70 border border-brand-100 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Classes Needed To Reach {data.requiredAttendance}%
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {stats.classesNeeded > 0 ? (
                <span>
                  Attend next{' '}
                  <span className="text-rose-600 dark:text-rose-400 text-2xl font-black">
                    {stats.classesNeeded}
                  </span>{' '}
                  consecutive classes
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base">
                  Requirement met! No extra classes needed.
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Formula: (Attended + n) / (Total + n) &ge; {data.requiredAttendance}%
            </p>
          </div>

          {/* Safe Absence Margin */}
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/70 border border-brand-100 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Safe Bunk / Miss Allowance
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {stats.classesCanMiss > 0 ? (
                <span>
                  You can safely miss{' '}
                  <span className="text-emerald-600 dark:text-emerald-400 text-2xl font-black">
                    {stats.classesCanMiss}
                  </span>{' '}
                  classes
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-bold text-base">
                  Borderline / Shortage! Zero misses permitted.
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Formula: Attended / (Total + m) &ge; {data.requiredAttendance}%
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Trend Line Graph (Recharts) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-500" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Attendance Progression Trend
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Target threshold: {data.requiredAttendance}%
          </span>
        </div>

        {trendData.length <= 1 ? (
          <div className="py-12 text-center text-xs text-slate-600 dark:text-slate-400">
            More class entries needed to plot historical trend.
          </div>
        ) : (
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, 'Attendance']}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine
                  y={data.requiredAttendance}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: `Target ${data.requiredAttendance}%`, fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#0284c7"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0284c7' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Weekly Schedule Slots for this subject */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-3">
          Weekly Scheduled Slots
        </h3>
        {schedules.length === 0 ? (
          <p className="text-xs text-slate-600 dark:text-slate-400">
            No weekly timetable slots assigned to this course yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {schedules.map((sch: any) => {
              const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              return (
                <div
                  key={sch.id}
                  className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs"
                >
                  <div className="font-extrabold text-slate-900 dark:text-white">
                    {days[sch.day_of_week]}
                  </div>
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 mt-1 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-brand-500" />
                    {sch.start_time} - {sch.end_time} • {sch.class_type}
                  </div>
                  {sch.room && (
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Room {sch.room}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attendance History for this Course */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-4">
          Attendance Records History ({attendanceHistory.length})
        </h3>
        {attendanceHistory.length === 0 ? (
          <p className="text-xs text-slate-600 dark:text-slate-400">
            No attendance recorded for this course yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-extrabold uppercase">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Slot / Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {attendanceHistory.map((rec: any) => {
                  const formatted = new Intl.DateTimeFormat('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(new Date(rec.date));

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                        {formatted}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {rec.start_time ? `${rec.start_time} - ${rec.end_time}` : 'Direct'}
                        {rec.class_type && ` • ${rec.class_type}`}
                      </td>
                      <td className="px-4 py-3">
                        {rec.status === 'present' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                            Present
                          </span>
                        )}
                        {rec.status === 'absent' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                            Absent
                          </span>
                        )}
                        {rec.status === 'cancelled' && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{rec.notes || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          disabled={deletingId === rec.id}
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1 text-slate-600 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};