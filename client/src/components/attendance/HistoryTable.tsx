import React, { useState } from 'react';
import { AttendanceRecord, Subject } from '../../api/client';
import { Check, X, Ban, Trash2, Filter, Calendar } from 'lucide-react';

interface HistoryTableProps {
  records: AttendanceRecord[];
  subjects: Subject[];
  onDelete: (id: number) => Promise<void>;
  onFilterChange: (filters: { subjectId: string; status: string; startDate: string; endDate: string }) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  records,
  subjects,
  onDelete,
  onFilterChange,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleSubjectChange = (val: string) => {
    setSelectedSubject(val);
    onFilterChange({ subjectId: val, status: selectedStatus, startDate, endDate });
  };

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    onFilterChange({ subjectId: selectedSubject, status: val, startDate, endDate });
  };

  const handleStartDate = (val: string) => {
    setStartDate(val);
    onFilterChange({ subjectId: selectedSubject, status: selectedStatus, startDate: val, endDate });
  };

  const handleEndDate = (val: string) => {
    setEndDate(val);
    onFilterChange({ subjectId: selectedSubject, status: selectedStatus, startDate, endDate: val });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this attendance record?')) return;
    try {
      setDeletingId(id);
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-brand-500" />
          <span>Filter by:</span>
        </div>

        {/* Subject Filter */}
        <select
          value={selectedSubject}
          onChange={(e) => handleSubjectChange(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} - {s.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="present">Present Only</option>
          <option value="absent">Absent Only</option>
          <option value="cancelled">Cancelled Only</option>
        </select>

        {/* Date range */}
        <div className="flex items-center gap-1.5 ml-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleEndDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          />
        </div>
      </div>

      {/* Table / List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        {records.length === 0 ? (
          <div className="py-12 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            No attendance records found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Subject</th>
                  <th className="px-4 py-3.5">Class / Time</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Notes</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {records.map((r) => {
                  const dateStr = typeof r.date === 'string' ? r.date.split('T')[0] : '';
                  const formattedDate = new Intl.DateTimeFormat('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(new Date(r.date));

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: r.subject_color || '#0284c7' }}
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {r.subject_code}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 ml-1.5 hidden sm:inline">
                              {r.subject_name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <span>{r.start_time ? `${r.start_time} - ${r.end_time}` : 'Direct Log'}</span>
                        {r.class_type && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                            {r.class_type}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {r.status === 'present' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Present
                          </span>
                        )}
                        {r.status === 'absent' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold">
                            <X className="w-3.5 h-3.5 stroke-[2.5]" /> Absent
                          </span>
                        )}
                        {r.status === 'cancelled' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-bold">
                            <Ban className="w-3 h-3" /> Cancelled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {r.notes || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          disabled={deletingId === r.id}
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
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