import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, Subject, TodayClass } from '../api/client';
import { OverallCard } from '../components/dashboard/OverallCard';
import { TodayClasses } from '../components/dashboard/TodayClasses';
import { AttendanceWarnings } from '../components/dashboard/AttendanceWarnings';
import { QuickActions } from '../components/dashboard/QuickActions';
import { Sparkles, RefreshCw, BookOpen, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';

interface DashboardProps {
  onNavigate: (tab: string, extraId?: number) => void;
  onAddSubject: () => void;
  onAddClass: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onAddSubject,
  onAddClass,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [todayData, setTodayData] = useState<{ dayName: string; date: string; classes: TodayClass[] }>({
    dayName: '',
    date: '',
    classes: [],
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadDashboardData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      const [analyticsRes, subjectsRes, todayRes] = await Promise.all([
        api.getAnalytics(),
        api.getSubjects(),
        api.getDayAttendance(),
      ]);

      setAnalytics(analyticsRes);
      setSubjects(subjectsRes.subjects);
      setTodayData({
        dayName: todayRes.dayName,
        date: todayRes.date,
        classes: todayRes.classes,
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleMarkAttendance = async (
    scheduleId: number,
    subjectId: number,
    status: 'present' | 'absent' | 'cancelled'
  ) => {
    try {
      await api.markAttendance({
        scheduleId,
        subjectId,
        date: todayData.date,
        status,
      });
      // Refresh dashboard stats smoothly
      await loadDashboardData(false);
    } catch (err) {
      console.error('Failed to mark attendance:', err);
      alert('Failed to record attendance. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
          <span className="text-xs font-bold">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  const overallStats = analytics?.overall || {
    percentage: 100,
    attended: 0,
    absent: 0,
    cancelled: 0,
    total: 0,
    status: 'safe',
    classesNeeded: 0,
    classesCanMiss: 0,
    message: 'No classes recorded yet.',
    isAtRisk: false,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Here is your daily attendance summary and upcoming classes for today.
          </p>
        </div>

        <button
          onClick={() => loadDashboardData(true)}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Quick Actions */}
      <QuickActions
        onAddSubject={onAddSubject}
        onAddClass={onAddClass}
        onNavigate={onNavigate}
      />

      {/* Attendance Warnings (if any subject is at risk) */}
      <AttendanceWarnings
        subjects={subjects}
        onSelectSubject={(id) => onNavigate('subject-detail', id)}
      />

      {/* Overall Attendance Card */}
      <OverallCard
        stats={overallStats}
        totalSubjects={subjects.length}
        atRiskCount={analytics?.atRiskCount || 0}
        requiredAttendance={user?.requiredAttendance || 75}
      />

      {/* Today's Classes Section */}
      <TodayClasses
        dayName={todayData.dayName}
        date={todayData.date}
        classes={todayData.classes}
        onMark={handleMarkAttendance}
        onNavigateToSchedule={() => onNavigate('schedule')}
      />

      {/* Subjects Overview Grid */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Courses Overview</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Live status and safe margin calculations for each enrolled course.
            </p>
          </div>
          <button
            onClick={() => onNavigate('subjects')}
            className="flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-600 dark:text-slate-400">
            No courses added yet. Click "+ Add Subject" to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                onClick={() => onNavigate('subject-detail', sub.id)}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-brand-500/60 dark:hover:border-brand-500/60 cursor-pointer transition-all hover:shadow-md group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sub.color || '#0284c7' }}
                    />
                    <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                      {sub.code}
                    </span>
                  </div>
                  <StatusBadge status={sub.stats.status} />
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">
                  {sub.name}
                </h4>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">
                      {sub.stats.percentage}%
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">
                      {sub.stats.attended} / {sub.stats.total} held
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        sub.stats.status === 'safe'
                          ? 'bg-emerald-500'
                          : sub.stats.status === 'caution'
                          ? 'bg-amber-500'
                          : sub.stats.status === 'low'
                          ? 'bg-orange-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, sub.stats.percentage)}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-1">
                  {sub.stats.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};