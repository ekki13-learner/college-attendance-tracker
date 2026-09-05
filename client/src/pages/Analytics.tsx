import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Award,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!data) return null;

  const { overall, subjects, weeklyTrend, distribution, highestSubject, lowestSubject } = data;

  const barChartData = subjects.map((s: any) => ({
    name: s.code,
    fullName: s.name,
    percentage: s.stats.percentage,
    required: s.requiredAttendance,
    attended: s.stats.attended,
    total: s.stats.total,
    color: s.color || '#0284c7',
  }));

  const pieColors: Record<string, string> = {
    Present: '#10b981',
    Absent: '#ef4444',
    Cancelled: '#94a3b8',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Attendance Analytics & Insights
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Visual graphs, distribution metrics, and course performance comparisons.
        </p>
      </div>

      {/* Highlights: Highest & Lowest Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {highestSubject && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-teal-50/70 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase text-emerald-700 dark:text-emerald-400">
                  Highest Attendance Course
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {highestSubject.code} — {highestSubject.name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {highestSubject.stats.attended} of {highestSubject.stats.total} classes attended
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {highestSubject.stats.percentage}%
              </div>
              <StatusBadge status={highestSubject.stats.status} size="sm" />
            </div>
          </div>
        )}

        {lowestSubject && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50/70 to-amber-50/70 dark:from-rose-950/20 dark:to-amber-950/20 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase text-rose-700 dark:text-rose-400">
                  Lowest Attendance Course
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {lowestSubject.code} — {lowestSubject.name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {lowestSubject.stats.message}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {lowestSubject.stats.percentage}%
              </div>
              <StatusBadge status={lowestSubject.stats.status} size="sm" />
            </div>
          </div>
        )}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance by Course (Bar Chart) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-500" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Attendance by Subject
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Red line indicates 75% target
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `${value}% (${item.payload.attended}/${item.payload.total} classes)`,
                    item.payload.fullName,
                  ]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" />
                <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                  {barChartData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.percentage >= 75 ? '#10b981' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Present vs Absent vs Cancelled Donut */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 pb-4 mb-2 border-b border-slate-100 dark:border-slate-800">
            <PieIcon className="w-5 h-5 text-brand-500" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Status Breakdown
            </h3>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {distribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={pieColors[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} classes`, name]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            {distribution.map((item: any) => (
              <div key={item.name} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div
                  className="text-base font-black"
                  style={{ color: pieColors[item.name] || '#94a3b8' }}
                >
                  {item.value}
                </div>
                <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Trend Line Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-500" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Weekly Attendance Trend
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Past 8 weeks performance
          </span>
        </div>

        {weeklyTrend.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-600 dark:text-slate-400">
            No weekly data logged yet.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `${val}% (${item.payload.attended}/${item.payload.total} classes)`,
                    'Weekly Average',
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" />
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
    </div>
  );
};