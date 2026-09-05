import { Router, Response } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { calculateAttendanceStats } from '../utils/calculations';

const router = Router();

const DAYS_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to format Date to YYYY-MM-DD
function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// GET /api/attendance/day?date=YYYY-MM-DD - Get classes and attendance for a specific date
router.get('/day', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const requestedDateStr = (req.query.date as string) || getLocalDateString();
    
    // Parse date safely
    const [year, month, day] = requestedDateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const dayOfWeek = targetDate.getDay();
    const dayName = DAYS_NAMES[dayOfWeek];

    // Check user preference for auto mark absent
    const userRes = await query('SELECT auto_mark_absent FROM users WHERE id = $1', [userId]);
    const autoMarkAbsent = userRes.rows[0]?.auto_mark_absent ?? false;

    // 1. Fetch weekly schedules for this day of week
    const schedulesRes = await query(
      `SELECT s.id, s.subject_id, s.day_of_week, s.start_time, s.end_time,
              s.room, s.faculty, s.class_type,
              sub.name as subject_name, sub.code as subject_code, sub.color as subject_color,
              sub.required_attendance
       FROM schedules s
       JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.user_id = $1 AND s.day_of_week = $2
       ORDER BY s.start_time ASC`,
      [userId, dayOfWeek]
    );

    // 2. Fetch existing attendance records for this user and date
    const attendanceRes = await query(
      `SELECT id, subject_id, schedule_id, date, status, notes
       FROM attendance
       WHERE user_id = $1 AND date = $2`,
      [userId, requestedDateStr]
    );

    const attendanceBySchedule = new Map<number, any>();
    for (const record of attendanceRes.rows) {
      if (record.schedule_id) {
        attendanceBySchedule.set(record.schedule_id, record);
      }
    }

    const todayStr = getLocalDateString();
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const classes = schedulesRes.rows.map((sch) => {
      const existingAttendance = attendanceBySchedule.get(sch.id);

      let timingState: 'upcoming' | 'in_progress' | 'completed' | 'marked' = 'upcoming';

      if (existingAttendance) {
        timingState = 'marked';
      } else if (requestedDateStr < todayStr) {
        timingState = 'completed';
      } else if (requestedDateStr > todayStr) {
        timingState = 'upcoming';
      } else {
        // Today
        if (currentTimeStr < sch.start_time) {
          timingState = 'upcoming';
        } else if (currentTimeStr >= sch.start_time && currentTimeStr <= sch.end_time) {
          timingState = 'in_progress';
        } else {
          timingState = 'completed'; // past class end time today, not yet marked
        }
      }

      return {
        scheduleId: sch.id,
        subjectId: sch.subject_id,
        subjectName: sch.subject_name,
        subjectCode: sch.subject_code,
        subjectColor: sch.subject_color,
        startTime: sch.start_time,
        endTime: sch.end_time,
        room: sch.room,
        faculty: sch.faculty,
        classType: sch.class_type,
        timingState,
        attendance: existingAttendance
          ? {
              id: existingAttendance.id,
              status: existingAttendance.status,
              notes: existingAttendance.notes,
            }
          : null,
      };
    });

    return res.json({
      date: requestedDateStr,
      dayOfWeek,
      dayName,
      isToday: requestedDateStr === todayStr,
      classes,
    });
  } catch (err: any) {
    console.error('Day attendance error:', err);
    return res.status(500).json({ error: 'Failed to fetch day schedule & attendance.' });
  }
});

// POST /api/attendance/mark - Record or update attendance for a scheduled class
router.post('/mark', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { scheduleId, subjectId, date, status, notes } = req.body;

    if (!subjectId || !date || !status) {
      return res.status(400).json({ error: 'Subject ID, date, and status are required.' });
    }

    if (!['present', 'absent', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status must be present, absent, or cancelled.' });
    }

    let record;
    if (scheduleId) {
      // Upsert based on unique constraint (user_id, schedule_id, date)
      const resUpsert = await query(
        `INSERT INTO attendance (user_id, subject_id, schedule_id, date, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, schedule_id, date)
         DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes
         RETURNING id, user_id, subject_id, schedule_id, date, status, notes, created_at`,
        [userId, Number(subjectId), Number(scheduleId), date, status, notes?.trim() || '']
      );
      record = resUpsert.rows[0];
    } else {
      // Manual extra class attendance
      const resInsert = await query(
        `INSERT INTO attendance (user_id, subject_id, schedule_id, date, status, notes)
         VALUES ($1, $2, NULL, $3, $4, $5)
         RETURNING id, user_id, subject_id, schedule_id, date, status, notes, created_at`,
        [userId, Number(subjectId), date, status, notes?.trim() || '']
      );
      record = resInsert.rows[0];
    }

    // Recalculate subject attendance stats to return immediately
    const countsRes = await query(
      `SELECT status, COUNT(*)::int as count
       FROM attendance
       WHERE user_id = $1 AND subject_id = $2
       GROUP BY status`,
      [userId, Number(subjectId)]
    );

    let attended = 0;
    let absent = 0;
    let cancelled = 0;
    for (const row of countsRes.rows) {
      if (row.status === 'present') attended = row.count;
      else if (row.status === 'absent') absent = row.count;
      else if (row.status === 'cancelled') cancelled = row.count;
    }

    const subRes = await query('SELECT required_attendance FROM subjects WHERE id = $1', [Number(subjectId)]);
    const target = subRes.rows[0]?.required_attendance || 75;
    const stats = calculateAttendanceStats(attended, absent, cancelled, target);

    return res.status(201).json({
      attendance: record,
      subjectStats: stats,
      message: `Attendance marked as ${status}.`,
    });
  } catch (err: any) {
    console.error('Mark attendance error:', err);
    return res.status(500).json({ error: 'Failed to record attendance.' });
  }
});

// DELETE /api/attendance/:id - Remove an attendance record
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const attendanceId = parseInt(req.params.id, 10);

    const deleted = await query(
      'DELETE FROM attendance WHERE id = $1 AND user_id = $2 RETURNING id, subject_id',
      [attendanceId, userId]
    );

    if (deleted.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found.' });
    }

    return res.json({ message: 'Attendance record deleted successfully.' });
  } catch (err: any) {
    console.error('Delete attendance error:', err);
    return res.status(500).json({ error: 'Failed to delete attendance record.' });
  }
});

// GET /api/attendance/history - Chronological history with filters
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { subjectId, status, startDate, endDate } = req.query;

    let sql = `
      SELECT a.id, a.date, a.status, a.notes, a.created_at,
             s.start_time, s.end_time, s.class_type, s.room,
             sub.id as subject_id, sub.name as subject_name, sub.code as subject_code, sub.color as subject_color
      FROM attendance a
      JOIN subjects sub ON a.subject_id = sub.id
      LEFT JOIN schedules s ON a.schedule_id = s.id
      WHERE a.user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (subjectId) {
      sql += ` AND a.subject_id = $${paramIndex++}`;
      params.push(Number(subjectId));
    }
    if (status && status !== 'all') {
      sql += ` AND a.status = $${paramIndex++}`;
      params.push(status);
    }
    if (startDate) {
      sql += ` AND a.date >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND a.date <= $${paramIndex++}`;
      params.push(endDate);
    }

    sql += ' ORDER BY a.date DESC, a.created_at DESC';

    const result = await query(sql, params);
    return res.json({ records: result.rows });
  } catch (err: any) {
    console.error('Attendance history error:', err);
    return res.status(500).json({ error: 'Failed to fetch attendance history.' });
  }
});

// GET /api/attendance/calendar?year=YYYY&month=MM - Monthly summary for calendar view
router.get('/calendar', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const year = parseInt((req.query.year as string) || String(now.getFullYear()), 10);
    const month = parseInt((req.query.month as string) || String(now.getMonth() + 1), 10);

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

    const recordsRes = await query(
      `SELECT a.id, a.date, a.status, a.notes,
              sub.name as subject_name, sub.code as subject_code, sub.color as subject_color,
              s.start_time, s.end_time, s.class_type
       FROM attendance a
       JOIN subjects sub ON a.subject_id = sub.id
       LEFT JOIN schedules s ON a.schedule_id = s.id
       WHERE a.user_id = $1 AND a.date >= $2 AND a.date <= $3
       ORDER BY a.date ASC, s.start_time ASC`,
      [userId, startDate, endDate]
    );

    // Group records by date (YYYY-MM-DD)
    const calendarDays: Record<
      string,
      {
        present: number;
        absent: number;
        cancelled: number;
        records: Array<any>;
      }
    > = {};

    for (const row of recordsRes.rows) {
      // Normalize date to YYYY-MM-DD
      const dateKey = typeof row.date === 'string' ? row.date.split('T')[0] : getLocalDateString(new Date(row.date));
      if (!calendarDays[dateKey]) {
        calendarDays[dateKey] = { present: 0, absent: 0, cancelled: 0, records: [] };
      }
      if (row.status === 'present') calendarDays[dateKey].present++;
      else if (row.status === 'absent') calendarDays[dateKey].absent++;
      else if (row.status === 'cancelled') calendarDays[dateKey].cancelled++;

      calendarDays[dateKey].records.push(row);
    }

    return res.json({
      year,
      month,
      days: calendarDays,
    });
  } catch (err: any) {
    console.error('Calendar error:', err);
    return res.status(500).json({ error: 'Failed to fetch calendar attendance.' });
  }
});

export default router;
