import { Router, Response } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { calculateAttendanceStats } from '../utils/calculations';

const router = Router();

// GET /api/subjects - List all subjects with stats
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get user default required attendance
    const userRes = await query('SELECT required_attendance FROM users WHERE id = $1', [userId]);
    const userDefaultRequired = userRes.rows[0]?.required_attendance || 75;

    // Fetch subjects
    const subjectsRes = await query(
      `SELECT id, name, code, faculty, color, required_attendance, created_at
       FROM subjects
       WHERE user_id = $1
       ORDER BY name ASC`,
      [userId]
    );

    // Fetch attendance aggregate counts grouped by subject
    const attendanceRes = await query(
      `SELECT subject_id, status, COUNT(*)::int as count
       FROM attendance
       WHERE user_id = $1
       GROUP BY subject_id, status`,
      [userId]
    );

    // Group counts
    const countsMap = new Map<number, { attended: number; absent: number; cancelled: number }>();
    for (const row of attendanceRes.rows) {
      if (!countsMap.has(row.subject_id)) {
        countsMap.set(row.subject_id, { attended: 0, absent: 0, cancelled: 0 });
      }
      const entry = countsMap.get(row.subject_id)!;
      if (row.status === 'present') entry.attended = row.count;
      else if (row.status === 'absent') entry.absent = row.count;
      else if (row.status === 'cancelled') entry.cancelled = row.count;
    }

    const subjectsWithStats = subjectsRes.rows.map((s) => {
      const counts = countsMap.get(s.id) || { attended: 0, absent: 0, cancelled: 0 };
      const required = s.required_attendance || userDefaultRequired;
      const stats = calculateAttendanceStats(counts.attended, counts.absent, counts.cancelled, required);

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        faculty: s.faculty,
        color: s.color,
        requiredAttendance: required,
        createdAt: s.created_at,
        stats,
      };
    });

    return res.json({ subjects: subjectsWithStats });
  } catch (err: any) {
    console.error('Fetch subjects error:', err);
    return res.status(500).json({ error: 'Failed to fetch subjects.' });
  }
});

// POST /api/subjects - Add subject
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, code, faculty, color, requiredAttendance } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Subject name and code are required.' });
    }

    const userRes = await query('SELECT required_attendance FROM users WHERE id = $1', [userId]);
    const defaultReq = userRes.rows[0]?.required_attendance || 75;
    const target = Number(requiredAttendance) || defaultReq;

    const result = await query(
      `INSERT INTO subjects (user_id, name, code, faculty, color, required_attendance)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, code, faculty, color, required_attendance, created_at`,
      [userId, name.trim(), code.trim().toUpperCase(), faculty?.trim() || '', color || '#0284c7', target]
    );

    const newSubject = result.rows[0];
    const stats = calculateAttendanceStats(0, 0, 0, target);

    return res.status(201).json({
      subject: {
        id: newSubject.id,
        name: newSubject.name,
        code: newSubject.code,
        faculty: newSubject.faculty,
        color: newSubject.color,
        requiredAttendance: newSubject.required_attendance,
        createdAt: newSubject.created_at,
        stats,
      },
    });
  } catch (err: any) {
    console.error('Create subject error:', err);
    return res.status(500).json({ error: 'Failed to create subject.' });
  }
});

// GET /api/subjects/:id - Details & Attendance trend
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const subjectId = parseInt(req.params.id, 10);

    const subjectRes = await query(
      `SELECT id, name, code, faculty, color, required_attendance, created_at
       FROM subjects
       WHERE id = $1 AND user_id = $2`,
      [subjectId, userId]
    );

    if (subjectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    const subject = subjectRes.rows[0];

    // Fetch all attendance for this subject ordered by date
    const attendanceRes = await query(
      `SELECT a.id, a.date, a.status, a.notes, a.created_at,
              s.start_time, s.end_time, s.class_type, s.room
       FROM attendance a
       LEFT JOIN schedules s ON a.schedule_id = s.id
       WHERE a.user_id = $1 AND a.subject_id = $2
       ORDER BY a.date ASC, a.created_at ASC`,
      [userId, subjectId]
    );

    let attended = 0;
    let absent = 0;
    let cancelled = 0;

    // Calculate trend data points (cumulative percentage over dates)
    const trendData: Array<{ date: string; displayDate: string; percentage: number; attended: number; total: number }> = [];

    attendanceRes.rows.forEach((row) => {
      if (row.status === 'present') attended++;
      else if (row.status === 'absent') absent++;
      else if (row.status === 'cancelled') cancelled++;

      const cumulativeTotal = attended + absent;
      const currentPct = cumulativeTotal === 0 ? 100 : Number(((attended / cumulativeTotal) * 100).toFixed(1));

      trendData.push({
        date: row.date,
        displayDate: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        percentage: currentPct,
        attended,
        total: cumulativeTotal,
      });
    });

    // Also get weekly schedules for this subject
    const schedulesRes = await query(
      `SELECT id, day_of_week, start_time, end_time, room, faculty, class_type
       FROM schedules
       WHERE user_id = $1 AND subject_id = $2
       ORDER BY day_of_week ASC, start_time ASC`,
      [userId, subjectId]
    );

    const stats = calculateAttendanceStats(attended, absent, cancelled, subject.required_attendance);

    return res.json({
      subject: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        faculty: subject.faculty,
        color: subject.color,
        requiredAttendance: subject.required_attendance,
        createdAt: subject.created_at,
        stats,
        schedules: schedulesRes.rows,
        trendData,
        attendanceHistory: attendanceRes.rows.reverse(), // most recent first for the history list
      },
    });
  } catch (err: any) {
    console.error('Subject details error:', err);
    return res.status(500).json({ error: 'Failed to fetch subject details.' });
  }
});

// PUT /api/subjects/:id - Update subject
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const subjectId = parseInt(req.params.id, 10);
    const { name, code, faculty, color, requiredAttendance } = req.body;

    const result = await query(
      `UPDATE subjects
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           faculty = COALESCE($3, faculty),
           color = COALESCE($4, color),
           required_attendance = COALESCE($5, required_attendance)
       WHERE id = $6 AND user_id = $7
       RETURNING id, name, code, faculty, color, required_attendance, created_at`,
      [name?.trim(), code?.trim()?.toUpperCase(), faculty?.trim(), color, requiredAttendance ? Number(requiredAttendance) : null, subjectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    return res.json({ subject: result.rows[0] });
  } catch (err: any) {
    console.error('Update subject error:', err);
    return res.status(500).json({ error: 'Failed to update subject.' });
  }
});

// DELETE /api/subjects/:id - Delete subject
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const subjectId = parseInt(req.params.id, 10);

    const result = await query(
      'DELETE FROM subjects WHERE id = $1 AND user_id = $2 RETURNING id',
      [subjectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    return res.json({ message: 'Subject and associated records deleted successfully.' });
  } catch (err: any) {
    console.error('Delete subject error:', err);
    return res.status(500).json({ error: 'Failed to delete subject.' });
  }
});

export default router;
