import React, { useState, useEffect } from 'react';
import { api, Subject, AttendanceRecord, TodayClass } from '../api/client';
import { HistoryTable } from '../components/attendance/HistoryTable';
import { CalendarView } from '../components/attendance/CalendarView';
import { TodayClasses } from '../components/dashboard/TodayClasses';
import { Calendar, History, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface AttendanceProps {
  onNavigateToSchedule: () => void;
}

export const Attendance: React.FC<AttendanceProps> = ({ onNavigateToSchedule }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'history' | 'calendar'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  // Daily tab states
  const [dayData, setDayData] = useState<{ dayName: string; date: string; classes: TodayClass[] }>({
    dayName: '',
    date: '',
    classes: [],
  });
  const [dailyLoading, setDailyLoading] = useState(true);

  // History tab states
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Calendar tab states
  const [calendarDays, setCalendarDays] = useState<Record<string, any>>({});
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Load daily data
  const loadDailyData = async (dateStr: string) => {
    try {
      setDailyLoading(true);
      const res = await api.getDayAttendance(dateStr);
      setDayData({
        dayName: res.dayName,
        date: res.date,
        classes: res.classes,
      });
    } catch (err) {
      console.error('Failed to load day attendance:', err);
    } finally {
      setDailyLoading(false);
    }
  };

  // Load history data
  const loadHistory = async (filters: any = {}) => {
    try {
      setHistoryLoading(true);
      const [histRes, subRes] = await Promise.all([
        api.getHistory(filters),
        api.getSubjects(),
      ]);
      setRecords(histRes.records);
      setSubjects(subRes.subjects);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load calendar data
  const loadCalendar = async (y: number, m: number) => {
    try {
      setCalendarLoading(true);
      const res = await api.getCalendar(y, m);
      setCalendarDays(res.days);
    } catch (err) {
      console.error('Failed to load calendar:', err);
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    loadDailyData(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    } else if (activeTab === 'calendar') {
      loadCalendar(currentYear, currentMonth);
    }
  }, [activeTab, currentYear, currentMonth]);

  const handleMarkDaily = async (
    scheduleId: number,
    subjectId: number,
    status: 'present' | 'absent' | 'cancelled'
  ) => {
    try {
      await api.markAttendance({
        scheduleId,
        subjectId,
        date: selectedDate,
        status,
      });
      await loadDailyData(selectedDate);
    } catch (err) {
      console.error('Failed to mark attendance:', err);
      alert('Failed to record attendance.');
    }
  };

  const handleDeleteHistory = async (id: number) => {
    await api.deleteAttendance(id);
    await loadHistory();
  };

  const stepDate = (offset: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + offset);
    const newStr = dateObj.toISOString().split('T')[0];
    setSelectedDate(newStr);
  };

  const setToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Attendance Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Record class attendance, inspect past dates, and browse your monthly calendar.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'daily'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Daily View</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History Log</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'calendar'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Monthly Calendar</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Daily Class View */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Date Selector Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => stepDate(-1)}
                title="Previous Day"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              />

              <button
                onClick={() => stepDate(1)}
                title="Next Day"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={setToday}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
            >
              Jump to Today
            </button>
          </div>

          {dailyLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
            </div>
          ) : (
            <TodayClasses
              dayName={dayData.dayName}
              date={dayData.date}
              classes={dayData.classes}
              onMark={handleMarkDaily}
              onNavigateToSchedule={onNavigateToSchedule}
            />
          )}
        </div>
      )}

      {/* Tab 2: Attendance History */}
      {activeTab === 'history' && (
        <div>
          {historyLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
            </div>
          ) : (
            <HistoryTable
              records={records}
              subjects={subjects}
              onDelete={handleDeleteHistory}
              onFilterChange={loadHistory}
            />
          )}
        </div>
      )}

      {/* Tab 3: Monthly Calendar */}
      {activeTab === 'calendar' && (
        <div>
          {calendarLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
            </div>
          ) : (
            <CalendarView
              daysData={calendarDays}
              year={currentYear}
              month={currentMonth}
              onMonthChange={(y, m) => {
                setCurrentYear(y);
                setCurrentMonth(m);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};