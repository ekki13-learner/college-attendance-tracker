import { Router, Response } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/schedules - List weekly schedule
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT s.id, s.subject_id, s.day_of_week, s.start_time, s.end_time,
              s.room, s.faculty, s.class_type, s.created_at,
              sub.name as subject_name, sub.code as subject_code, sub.color as subject_color
       FROM schedules s
       JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.user_id = $1
       ORDER BY s.day_of_week ASC, s.start_time ASC`,
      [userId]
    );

    return res.json({ schedules: result.rows });
  } catch (err: any) {
    console.error('Fetch schedules error:', err);
    return res.status(500).json({ error: 'Failed to fetch timetable schedules.' });
  }
});

// POST /api/schedules - Add class
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { subjectId, dayOfWeek, startTime, endTime, room, faculty, classType } = req.body;

    if (!subjectId || dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({ error: 'Subject, day of week, start time, and end time are required.' });
    }

    // Verify subject belongs to user
    const subCheck = await query('SELECT id, name, code, color, faculty FROM subjects WHERE id = $1 AND user_id = $2', [subjectId, userId]);
    if (subCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    const sub = subCheck.rows[0];
    const facultyName = faculty?.trim() || sub.faculty || '';

    const result = await query(
      `INSERT INTO schedules (user_id, subject_id, day_of_week, start_time, end_time, room, faculty, class_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id, subject_id, day_of_week, start_time, end_time, room, faculty, class_type, created_at`,
      [userId, subjectId, Number(dayOfWeek), startTime, endTime, room?.trim() || '', facultyName, classType || 'Lecture']
    );

    const newSchedule = {
      ...result.rows[0],
      subject_name: sub.name,
      subject_code: sub.code,
      subject_color: sub.color,
    };

    return res.status(201).json({ schedule: newSchedule });
  } catch (err: any) {
    console.error('Add schedule error:', err);
    return res.status(500).json({ error: 'Failed to add class to schedule.' });
  }
});

// PUT /api/schedules/:id - Edit class
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const scheduleId = parseInt(req.params.id, 10);
    const { subjectId, dayOfWeek, startTime, endTime, room, faculty, classType } = req.body;

    // Verify ownership
    const existing = await query('SELECT id FROM schedules WHERE id = $1 AND user_id = $2', [scheduleId, userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Class schedule not found.' });
    }

    const result = await query(
      `UPDATE schedules
       SET subject_id = COALESCE($1, subject_id),
           day_of_week = COALESCE($2, day_of_week),
           start_time = COALESCE($3, start_time),
           end_time = COALESCE($4, end_time),
           room = COALESCE($5, room),
           faculty = COALESCE($6, faculty),
           class_type = COALESCE($7, class_type)
       WHERE id = $8 AND user_id = $9
       RETURNING id, user_id, subject_id, day_of_week, start_time, end_time, room, faculty, class_type`,
      [
        subjectId ? Number(subjectId) : null,
        dayOfWeek !== undefined ? Number(dayOfWeek) : null,
        startTime,
        endTime,
        room?.trim(),
        faculty?.trim(),
        classType,
        scheduleId,
        userId,
      ]
    );

    // Fetch joined subject info
    const joined = await query(
      `SELECT s.*, sub.name as subject_name, sub.code as subject_code, sub.color as subject_color
       FROM schedules s
       JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.id = $1`,
      [scheduleId]
    );

    return res.json({ schedule: joined.rows[0] });
  } catch (err: any) {
    console.error('Update schedule error:', err);
    return res.status(500).json({ error: 'Failed to update schedule.' });
  }
});

// POST /api/schedules/:id/duplicate - Duplicate class
router.post('/:id/duplicate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const scheduleId = parseInt(req.params.id, 10);
    const { targetDayOfWeek, startTime, endTime } = req.body;

    const sourceRes = await query(
      'SELECT * FROM schedules WHERE id = $1 AND user_id = $2',
      [scheduleId, userId]
    );

    if (sourceRes.rows.length === 0) {
      return res.status(404).json({ error: 'Source class schedule not found.' });
    }

    const src = sourceRes.rows[0];
    const newDay = targetDayOfWeek !== undefined ? Number(targetDayOfWeek) : (src.day_of_week + 1) % 7;
    const newStart = startTime || src.start_time;
    const newEnd = endTime || src.end_time;

    const insertRes = await query(
      `INSERT INTO schedules (user_id, subject_id, day_of_week, start_time, end_time, room, faculty, class_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, src.subject_id, newDay, newStart, newEnd, src.room, src.faculty, src.class_type]
    );

    const joined = await query(
      `SELECT s.*, sub.name as subject_name, sub.code as subject_code, sub.color as subject_color
       FROM schedules s
       JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.id = $1`,
      [insertRes.rows[0].id]
    );

    return res.status(201).json({ schedule: joined.rows[0] });
  } catch (err: any) {
    console.error('Duplicate schedule error:', err);
    return res.status(500).json({ error: 'Failed to duplicate schedule.' });
  }
});

// DELETE /api/schedules/:id - Delete class
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const scheduleId = parseInt(req.params.id, 10);

    const result = await query(
      'DELETE FROM schedules WHERE id = $1 AND user_id = $2 RETURNING id',
      [scheduleId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class schedule not found.' });
    }

    return res.json({ message: 'Class schedule deleted successfully.' });
  } catch (err: any) {
    console.error('Delete schedule error:', err);
    return res.status(500).json({ error: 'Failed to delete schedule.' });
  }
});

export default router;
