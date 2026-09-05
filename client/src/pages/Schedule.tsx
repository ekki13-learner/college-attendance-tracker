import React, { useState, useEffect } from 'react';
import { api, ScheduleItem, Subject } from '../api/client';
import { TimetableGrid } from '../components/schedule/TimetableGrid';
import { ClassModal } from '../components/schedule/ClassModal';
import { Plus, Calendar, RefreshCw } from 'lucide-react';

interface ScheduleProps {
  openAddModalTrigger?: boolean;
}

export const Schedule: React.FC<ScheduleProps> = ({ openAddModalTrigger }) => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schRes, subRes] = await Promise.all([
        api.getSchedules(),
        api.getSubjects(),
      ]);
      setSchedules(schRes.schedules);
      setSubjects(subRes.subjects);
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (openAddModalTrigger) {
      setEditingSchedule(null);
      setIsModalOpen(true);
    }
  }, [openAddModalTrigger]);

  const handleAddClass = (presetDay?: number) => {
    setEditingSchedule(null);
    setIsModalOpen(true);
  };

  const handleEditClass = (item: ScheduleItem) => {
    setEditingSchedule(item);
    setIsModalOpen(true);
  };

  const handleDuplicate = async (item: ScheduleItem) => {
    try {
      await api.duplicateSchedule(item.id, {});
      await loadData();
    } catch (err) {
      console.error('Duplicate failed:', err);
      alert('Failed to duplicate class.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Remove this class slot from your weekly schedule?')) return;
    try {
      await api.deleteSchedule(id);
      await loadData();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete class.');
    }
  };

  const handleSaveClass = async (data: any) => {
    if (editingSchedule) {
      await api.updateSchedule(editingSchedule.id, data);
    } else {
      await api.createSchedule(data);
    }
    await loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Weekly Schedule & Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Your recurring weekly template. Daily attendance is generated automatically from these slots.
          </p>
        </div>

        <button
          onClick={() => handleAddClass()}
          disabled={subjects.length === 0}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Class</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="py-16 text-center flex flex-col items-center justify-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm">
          <Calendar className="w-10 h-10 text-brand-600 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Please add subjects first
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xs">
            Before creating timetable slots, you must create at least one course subject.
          </p>
        </div>
      ) : (
        <TimetableGrid
          schedules={schedules}
          onEdit={handleEditClass}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onAddClass={handleAddClass}
        />
      )}

      {/* Add / Edit Class Modal */}
      <ClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClass}
        subjects={subjects}
        initialData={editingSchedule}
      />
    </div>
  );
};