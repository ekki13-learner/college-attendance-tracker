import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Subjects } from './pages/Subjects';
import { SubjectDetail } from './pages/SubjectDetail';
import { Schedule } from './pages/Schedule';
import { Attendance } from './pages/Attendance';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { RefreshCw } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  // Quick modals triggers
  const [addSubjectTrigger, setAddSubjectTrigger] = useState(false);
  const [addClassTrigger, setAddClassTrigger] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
          <span className="text-xs font-bold tracking-wider uppercase">Loading Attendo...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authView === 'login') {
      return <Login onSwitchToRegister={() => setAuthView('register')} />;
    }
    return <Register onSwitchToLogin={() => setAuthView('login')} />;
  }

  const handleNavigate = (tab: string, extraId?: number) => {
    if (tab === 'subject-detail' && extraId) {
      setSelectedSubjectId(extraId);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen bg-slate-50/60 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <Sidebar currentTab={currentTab} onNavigate={handleNavigate} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar currentTab={currentTab} onNavigate={handleNavigate} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10 overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <Dashboard
              onNavigate={handleNavigate}
              onAddSubject={() => {
                setAddSubjectTrigger((prev) => !prev);
                setCurrentTab('subjects');
              }}
              onAddClass={() => {
                setAddClassTrigger((prev) => !prev);
                setCurrentTab('schedule');
              }}
            />
          )}

          {currentTab === 'subjects' && (
            <Subjects
              onSelectSubject={(id) => handleNavigate('subject-detail', id)}
              openAddModalTrigger={addSubjectTrigger}
            />
          )}

          {currentTab === 'subject-detail' && selectedSubjectId && (
            <SubjectDetail
              subjectId={selectedSubjectId}
              onBack={() => setCurrentTab('subjects')}
            />
          )}

          {currentTab === 'schedule' && (
            <Schedule openAddModalTrigger={addClassTrigger} />
          )}

          {currentTab === 'attendance' && (
            <Attendance onNavigateToSchedule={() => setCurrentTab('schedule')} />
          )}

          {currentTab === 'analytics' && <Analytics />}

          {currentTab === 'settings' && <Settings />}
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav currentTab={currentTab} onNavigate={handleNavigate} />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;