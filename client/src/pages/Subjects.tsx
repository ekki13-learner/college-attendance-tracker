import React, { useState, useEffect } from 'react';
import { api, Subject } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Plus, BookOpen, User, Edit2, Trash2, ChevronRight, Calculator, RefreshCw } from 'lucide-react';

interface SubjectsProps {
  onSelectSubject: (id: number) => void;
  openAddModalTrigger?: boolean;
}

const PRESET_COLORS = [
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#0891b2', // Cyan
  '#059669', // Emerald
  '#d97706', // Amber
  '#db2777', // Pink
  '#e11d48', // Rose
  '#4f46e5', // Indigo
];

export const Subjects: React.FC<SubjectsProps> = ({ onSelectSubject, openAddModalTrigger }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [faculty, setFaculty] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [requiredAttendance, setRequiredAttendance] = useState(75);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.getSubjects();
      setSubjects(res.subjects);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (openAddModalTrigger) {
      openAdd();
    }
  }, [openAddModalTrigger]);

  const openAdd = () => {
    setEditingSubject(null);
    setName('');
    setCode('');
    setFaculty('');
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setRequiredAttendance(75);
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (sub: Subject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSubject(sub);
    setName(sub.name);
    setCode(sub.code);
    setFaculty(sub.faculty || '');
    setColor(sub.color || '#2563eb');
    setRequiredAttendance(sub.requiredAttendance || 75);
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this subject? Associated timetable classes and attendance records will also be deleted.')) {
      return;
    }
    try {
      await api.deleteSubject(id);
      await loadSubjects();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete subject.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      setError('Course name and code are required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (editingSubject) {
        await api.updateSubject(editingSubject.id, {
          name,
          code,
          faculty,
          color,
          requiredAttendance,
        });
      } else {
        await api.createSubject({
          name,
          code,
          faculty,
          color,
          requiredAttendance,
        });
      }
      setIsModalOpen(false);
      await loadSubjects();
    } catch (err: any) {
      setError(err.message || 'Failed to save course.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Subjects & Courses
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your courses, track requirements, and monitor safe absence allowances.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="py-16 text-center flex flex-col items-center justify-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No courses added yet</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm">
            Add your subjects to start tracking attendance and generating your weekly timetable.
          </p>
          <button
            onClick={openAdd}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-600/20"
          >
            <Plus className="w-4 h-4" /> Add Your First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              onClick={() => onSelectSubject(sub.id)}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-brand-500/60 cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between group"
            >
              <div>
                {/* Top Row: Code & Status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sub.color || '#2563eb' }}
                    />
                    <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                      {sub.code}
                    </span>
                  </div>
                  <StatusBadge status={sub.stats.status} />
                </div>

                {/* Course Name */}
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">
                  {sub.name}
                </h3>

                {/* Faculty */}
                {sub.faculty && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sub.faculty}</span>
                  </div>
                )}

                {/* Attendance Progress & Numbers */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-800 dark:text-slate-200">
                      Attendance: <span className="font-extrabold text-sm">{sub.stats.percentage}%</span>
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">
                      {sub.stats.attended} / {sub.stats.total} held
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
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

                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 font-medium">
                    <span>Required: {sub.requiredAttendance}%</span>
                    <span>{sub.stats.cancelled} cancelled</span>
                  </div>
                </div>

                {/* Smart Calculator summary note */}
                <div className="flex items-center gap-2 mt-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Calculator className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span className="line-clamp-1">{sub.stats.message}</span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4" />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => openEdit(sub, e)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit subject"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(sub.id, e)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete subject"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Course Details' : 'Add New Course'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-900">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Course Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Digital Electronics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Course Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. EC201"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Faculty / Professor Name (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Prof. Vikram Sharma"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Course Target Attendance %
              </label>
              <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400">
                {requiredAttendance}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={requiredAttendance}
              onChange={(e) => setRequiredAttendance(Number(e.target.value))}
              className="w-full accent-brand-600 cursor-pointer"
            />
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Color Accent
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingSubject ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};