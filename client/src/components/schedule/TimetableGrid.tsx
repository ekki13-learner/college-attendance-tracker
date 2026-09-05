import React, { useState } from 'react';
import { ScheduleItem } from '../../api/client';
import { Clock, MapPin, User, Edit2, Copy, Trash2, Plus } from 'lucide-react';

interface TimetableGridProps {
  schedules: ScheduleItem[];
  onEdit: (item: ScheduleItem) => void;
  onDuplicate: (item: ScheduleItem) => void;
  onDelete: (id: number) => void;
  onAddClass: (day?: number) => void;
}

const DAYS = [
  { id: 1, name: 'Monday', short: 'MON' },
  { id: 2, name: 'Tuesday', short: 'TUE' },
  { id: 3, name: 'Wednesday', short: 'WED' },
  { id: 4, name: 'Thursday', short: 'THU' },
  { id: 5, name: 'Friday', short: 'FRI' },
  { id: 6, name: 'Saturday', short: 'SAT' },
];

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  schedules,
  onEdit,
  onDuplicate,
  onDelete,
  onAddClass,
}) => {
  const [selectedMobileDay, setSelectedMobileDay] = useState<number>(() => {
    const today = new Date().getDay();
    return today === 0 ? 1 : today;
  });

  // Group schedules by day
  const schedulesByDay = new Map<number, ScheduleItem[]>();
  DAYS.forEach((d) => schedulesByDay.set(d.id, []));
  schedules.forEach((sch) => {
    if (!schedulesByDay.has(sch.day_of_week)) {
      schedulesByDay.set(sch.day_of_week, []);
    }
    schedulesByDay.get(sch.day_of_week)!.push(sch);
  });

  // Sort each day by start time
  schedulesByDay.forEach((list) => {
    list.sort((a, b) => a.start_time.localeCompare(b.start_time));
  });

  return (
    <div>
      {/* Mobile Day Selector Tabs */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-3 mb-4 no-scrollbar">
        {DAYS.map((d) => {
          const count = schedulesByDay.get(d.id)?.length || 0;
          const isSelected = selectedMobileDay === d.id;
          return (
            <button
              key={d.id}
              onClick={() => setSelectedMobileDay(d.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>{d.short}</span>
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop Grid View */}
      <div className="hidden md:grid md:grid-cols-6 gap-3 lg:gap-4">
        {DAYS.map((day) => {
          const items = schedulesByDay.get(day.id) || [];
          return (
            <div
              key={day.id}
              className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm"
            >
              {/* Day Header */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    {day.name}
                  </span>
                  <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                    {items.length} {items.length === 1 ? 'class' : 'classes'}
                  </div>
                </div>
                <button
                  onClick={() => onAddClass(day.id)}
                  title={`Add class on ${day.name}`}
                  className="p-1 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Day Class Cards */}
              <div className="flex-1 p-2 space-y-2.5 min-h-[300px] overflow-y-auto">
                {items.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-4">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      No classes
                    </span>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="group relative p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:shadow-md transition-all"
                    >
                      {/* Accent strip */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
                        style={{ backgroundColor: item.subject_color || '#0284c7' }}
                      />

                      <div className="pl-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                            {item.subject_code}
                          </span>
                          {item.class_type && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {item.class_type}
                            </span>
                          )}
                        </div>

                        <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mt-0.5">
                          {item.subject_name}
                        </h5>

                        <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <Clock className="w-3 h-3 text-brand-500" />
                            {item.start_time} - {item.end_time}
                          </div>
                          {item.room && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {item.room}
                            </div>
                          )}
                        </div>

                        {/* Hover Quick Actions */}
                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onDuplicate(item)}
                            title="Duplicate"
                            className="p-1 rounded text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEdit(item)}
                            title="Edit"
                            className="p-1 rounded text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(item.id)}
                            title="Delete"
                            className="p-1 rounded text-rose-500 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Day View */}
      <div className="md:hidden space-y-3">
        {(() => {
          const items = schedulesByDay.get(selectedMobileDay) || [];
          const activeDay = DAYS.find((d) => d.id === selectedMobileDay);
          return (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {activeDay?.name} Classes
                </h4>
                <button
                  onClick={() => onAddClass(selectedMobileDay)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Class
                </button>
              </div>

              {items.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-600 dark:text-slate-400">
                  No classes scheduled for {activeDay?.name}.
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 relative overflow-hidden"
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1.5"
                        style={{ backgroundColor: item.subject_color || '#0284c7' }}
                      />
                      <div className="pl-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
                            {item.subject_code}
                          </span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => onDuplicate(item)} className="text-slate-600 dark:text-slate-400">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onEdit(item)} className="text-slate-600 dark:text-slate-400">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onDelete(item.id)} className="text-rose-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h5 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {item.subject_name}
                        </h5>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-2">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-brand-500" />
                            {item.start_time} - {item.end_time}
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
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};