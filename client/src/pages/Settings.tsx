import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import { Modal } from '../components/common/Modal';
import {
  User,
  Building,
  Calendar,
  Percent,
  Moon,
  Sun,
  Laptop,
  Download,
  Upload,
  Sparkles,
  Trash2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [college, setCollege] = useState(user?.college || '');
  const [semester, setSemester] = useState(user?.semester || '');
  const [requiredAttendance, setRequiredAttendance] = useState(user?.requiredAttendance || 75);
  const [autoMarkAbsent, setAutoMarkAbsent] = useState(user?.autoMarkAbsent || false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  // Import modal
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  // Reset modal
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Sample data button state
  const [seeding, setSeeding] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileSuccess('');
      const res = await api.updateProfile({
        name,
        college,
        semester,
        requiredAttendance,
        autoMarkAbsent,
        theme,
      });
      updateUser(res.user);
      setProfileSuccess('Settings updated successfully.');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await api.exportCsv();
    } catch (err) {
      alert('Failed to export CSV.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleImportCsv = async () => {
    if (!csvText.trim()) return;
    try {
      setImporting(true);
      setImportMsg('');
      const res = await api.importCsv(csvText);
      setImportMsg(res.message);
      setTimeout(() => {
        setIsImportOpen(false);
        setCsvText('');
        setImportMsg('');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to import CSV.');
    } finally {
      setImporting(false);
    }
  };

  const handleSeedSample = async () => {
    if (!window.confirm('Populate your account with sample college subjects, timetable, and attendance?')) return;
    try {
      setSeeding(true);
      const res = await api.seedSample();
      alert(res.message);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to seed sample data.');
    } finally {
      setSeeding(false);
    }
  };

  const handleResetData = async (resetType: 'attendance_only' | 'all') => {
    if (!window.confirm(`Are you sure you want to proceed with: ${resetType === 'all' ? 'Resetting EVERYTHING (courses, timetable, attendance)' : 'Clearing all attendance records'}?`)) {
      return;
    }
    try {
      setResetting(true);
      const res = await api.resetData(resetType);
      alert(res.message);
      setIsResetOpen(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to reset data.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Customize your student profile, attendance thresholds, and manage your data.
        </p>
      </div>

      {profileSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{profileSuccess}</span>
        </div>
      )}

      {/* Student Profile Card */}
      <form onSubmit={handleSaveProfile} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
        <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          Student Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-sm font-semibold text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              College / University
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="e.g. Institute of Engineering & Tech"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Semester / Academic Term
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="e.g. Semester 5"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Target Attendance Requirement */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Default Required Attendance Target
            </label>
            <span className="text-xs font-black text-brand-600 dark:text-brand-400">
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
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Standard college requirement is typically 75% or 80%. Safe margins and recovery alerts will calculate according to this goal.
          </p>
        </div>

        {/* Auto mark absent setting */}
        <div className="pt-2">
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={autoMarkAbsent}
              onChange={(e) => setAutoMarkAbsent(e.target.checked)}
              className="mt-0.5 rounded text-brand-600 accent-brand-600"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Automatically mark unrecorded classes as absent after class ends
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Default is OFF. When disabled, past classes wait for you to confirm attendance.
              </p>
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all disabled:opacity-50"
        >
          {savingProfile ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </form>

      {/* Appearance & Theme Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          Appearance Theme
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-xs font-bold transition-all ${
              theme === 'light'
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-5 h-5 mb-1 text-amber-500" />
            <span>Light Mode</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-xs font-bold transition-all ${
              theme === 'dark'
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Moon className="w-5 h-5 mb-1 text-brand-400" />
            <span>Dark Mode</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-xs font-bold transition-all ${
              theme === 'system'
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Laptop className="w-5 h-5 mb-1 text-slate-500" />
            <span>System Default</span>
          </button>
        </div>
      </div>

      {/* Data Management Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          Data Management
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Export CSV */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white mb-1">
                <Download className="w-4 h-4 text-brand-500" />
                <span>Export Attendance</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Download your complete attendance history and details as a CSV file for Excel or Google Sheets.
              </p>
            </div>
            <button
              onClick={handleExportCsv}
              className="mt-3 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-xs"
            >
              Download CSV
            </button>
          </div>

          {/* Import CSV */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white mb-1">
                <Upload className="w-4 h-4 text-emerald-500" />
                <span>Import Attendance</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Import past exported attendance records or batch logs directly from a CSV file.
              </p>
            </div>
            <button
              onClick={() => setIsImportOpen(true)}
              className="mt-3 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-xs"
            >
              Upload / Paste CSV
            </button>
          </div>

          {/* Load Sample Data */}
          <div className="p-4 rounded-2xl border border-brand-200 dark:border-brand-900/40 bg-brand-50/50 dark:bg-brand-950/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold text-brand-800 dark:text-brand-300 mb-1">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <span>Sample College Data</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Add 6 sample college courses, weekly timetable, and realistic attendance logs to experiment with calculations.
              </p>
            </div>
            <button
              disabled={seeding}
              onClick={handleSeedSample}
              className="mt-3 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {seeding ? 'Adding...' : 'Load Sample Data'}
            </button>
          </div>

          {/* Reset Data */}
          <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold text-rose-800 dark:text-rose-300 mb-1">
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Reset Application Data</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Clear all attendance logs or reset your entire account to start completely fresh.
              </p>
            </div>
            <button
              onClick={() => setIsResetOpen(true)}
              className="mt-3 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Reset Data...
            </button>
          </div>
        </div>
      </div>

      {/* CSV Import Modal */}
      <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Import Attendance CSV">
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Upload a .csv file or paste raw CSV text. The file should include columns: <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Date, Subject Name, Subject Code, Status</code>.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Or Paste CSV Content
            </label>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Date,Subject Name,Subject Code,Status&#10;2026-09-01,Mathematics,MATH101,present"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          {importMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              {importMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsImportOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              disabled={importing || !csvText.trim()}
              onClick={handleImportCsv}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 disabled:opacity-50"
            >
              {importing ? 'Importing...' : 'Start Import'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} title="Reset Account Data">
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <div>
              <span className="font-bold">Caution:</span> This action cannot be undone. Please choose which data you want to clear.
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              disabled={resetting}
              onClick={() => handleResetData('attendance_only')}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-left text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
            >
              Clear Attendance History Only
              <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                Preserves your subjects and weekly timetable schedule.
              </span>
            </button>

            <button
              disabled={resetting}
              onClick={() => handleResetData('all')}
              className="w-full p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-100 text-left text-xs font-bold text-rose-700 dark:text-rose-300 transition-colors"
            >
              Reset Everything (Full Wipe)
              <span className="block text-[11px] font-normal text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                Deletes all courses, timetable slots, and attendance records completely.
              </span>
            </button>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsResetOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};