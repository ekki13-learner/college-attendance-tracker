const API_BASE = '/api';

export interface User {
  id: number;
  name: string;
  email: string;
  college?: string;
  semester?: string;
  requiredAttendance: number;
  autoMarkAbsent?: boolean;
  theme?: string;
}

export interface AttendanceStats {
  attended: number;
  absent: number;
  cancelled: number;
  total: number;
  percentage: number;
  status: 'safe' | 'caution' | 'low' | 'critical';
  classesNeeded: number;
  classesCanMiss: number;
  message: string;
  isAtRisk: boolean;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  faculty?: string;
  color: string;
  requiredAttendance: number;
  createdAt: string;
  stats: AttendanceStats;
}

export interface ScheduleItem {
  id: number;
  subject_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
  faculty?: string;
  class_type?: string;
  subject_name?: string;
  subject_code?: string;
  subject_color?: string;
}

export interface TodayClass {
  scheduleId: number;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  subjectColor: string;
  startTime: string;
  endTime: string;
  room?: string;
  faculty?: string;
  classType?: string;
  timingState: 'upcoming' | 'in_progress' | 'completed' | 'marked';
  attendance: {
    id: number;
    status: 'present' | 'absent' | 'cancelled';
    notes?: string;
  } | null;
}

export interface DayAttendanceResponse {
  date: string;
  dayOfWeek: number;
  dayName: string;
  isToday: boolean;
  classes: TodayClass[];
}

export interface AttendanceRecord {
  id: number;
  date: string;
  status: 'present' | 'absent' | 'cancelled';
  notes?: string;
  start_time?: string;
  end_time?: string;
  class_type?: string;
  room?: string;
  subject_id: number;
  subject_name: string;
  subject_code: string;
  subject_color: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('cat_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMsg = 'Something went wrong';
    try {
      const data = await res.json();
      errMsg = data.error || errMsg;
    } catch {
      errMsg = res.statusText || errMsg;
    }
    throw new Error(errMsg);
  }

  // Handle empty or file responses
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return (await res.text()) as unknown as T;
  }

  return res.json();
}

export const api = {
  // Auth
  register: (body: any) => request<{ user: User; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<{ user: User; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  demo: () => request<{ user: User; token: string }>('/auth/demo', { method: 'POST' }),
  getMe: () => request<{ user: User }>('/auth/me'),
  updateProfile: (body: any) => request<{ user: User; message: string }>('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Subjects
  getSubjects: () => request<{ subjects: Subject[] }>('/subjects'),
  getSubject: (id: number) => request<{ subject: any }>(`/subjects/${id}`),
  createSubject: (body: any) => request<{ subject: Subject }>('/subjects', { method: 'POST', body: JSON.stringify(body) }),
  updateSubject: (id: number, body: any) => request<{ subject: Subject }>(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSubject: (id: number) => request<{ message: string }>(`/subjects/${id}`, { method: 'DELETE' }),

  // Schedules
  getSchedules: () => request<{ schedules: ScheduleItem[] }>('/schedules'),
  createSchedule: (body: any) => request<{ schedule: ScheduleItem }>('/schedules', { method: 'POST', body: JSON.stringify(body) }),
  updateSchedule: (id: number, body: any) => request<{ schedule: ScheduleItem }>(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  duplicateSchedule: (id: number, body: any) => request<{ schedule: ScheduleItem }>(`/schedules/${id}/duplicate`, { method: 'POST', body: JSON.stringify(body) }),
  deleteSchedule: (id: number) => request<{ message: string }>(`/schedules/${id}`, { method: 'DELETE' }),

  // Attendance
  getDayAttendance: (date?: string) => request<DayAttendanceResponse>(`/attendance/day${date ? `?date=${date}` : ''}`),
  markAttendance: (body: { scheduleId?: number; subjectId: number; date: string; status: string; notes?: string }) =>
    request<{ attendance: any; subjectStats: AttendanceStats; message: string }>('/attendance/mark', { method: 'POST', body: JSON.stringify(body) }),
  deleteAttendance: (id: number) => request<{ message: string }>(`/attendance/${id}`, { method: 'DELETE' }),
  getHistory: (params: { subjectId?: string; status?: string; startDate?: string; endDate?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.subjectId) query.append('subjectId', params.subjectId);
    if (params.status) query.append('status', params.status);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    return request<{ records: AttendanceRecord[] }>(`/attendance/history?${query.toString()}`);
  },
  getCalendar: (year?: number, month?: number) => {
    const query = new URLSearchParams();
    if (year) query.append('year', String(year));
    if (month) query.append('month', String(month));
    return request<{ year: number; month: number; days: Record<string, { present: number; absent: number; cancelled: number; records: any[] }> }>(`/attendance/calendar?${query.toString()}`);
  },

  // Analytics
  getAnalytics: () => request<any>('/analytics'),

  // Data
  exportCsv: async () => {
    const token = localStorage.getItem('cat_token');
    const res = await fetch(`${API_BASE}/data/export-csv`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendance_Export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  importCsv: (csvData: string) => request<{ message: string }>('/data/import-csv', { method: 'POST', body: JSON.stringify({ csvData }) }),
  seedSample: () => request<{ message: string }>('/data/seed-sample', { method: 'POST' }),
  resetData: (resetType: 'attendance_only' | 'all') => request<{ message: string }>('/data/reset', { method: 'POST', body: JSON.stringify({ resetType }) }),
};