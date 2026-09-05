import { Router, Response } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { seedSampleDataForUser } from '../utils/sampleData';

const router = Router();

// Helper to escape CSV cell
function escapeCsv(str: any): string {
  if (str === null || str === undefined) return '';
  const text = String(str).replace(/"/g, '""');
  if (text.includes(',') || text.includes('\n') || text.includes('"')) {
    return `"${text}"`;
  }
  return text;
}

// GET /api/data/export-csv - Download attendance records as CSV
router.get('/export-csv', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT a.date, a.status, a.notes,
              sub.name as subject_name, sub.code as subject_code,
              s.class_type, s.start_time, s.end_time, s.room
       FROM attendance a
       JOIN subjects sub ON a.subject_id = sub.id
       LEFT JOIN schedules s ON a.schedule_id = s.id
       WHERE a.user_id = $1
       ORDER BY a.date DESC, a.created_at DESC`,
      [userId]
    );

    const headers = ['Date', 'Subject Name', 'Subject Code', 'Status', 'Class Type', 'Start Time', 'End Time', 'Room', 'Notes'];
    const rows = [headers.join(',')];

    for (const r of result.rows) {
      const dateStr = typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0];
      const row = [
        escapeCsv(dateStr),
        escapeCsv(r.subject_name),
        escapeCsv(r.subject_code),
        escapeCsv(r.status),
        escapeCsv(r.class_type || 'Lecture'),
        escapeCsv(r.start_time || ''),
        escapeCsv(r.end_time || ''),
        escapeCsv(r.room || ''),
        escapeCsv(r.notes || ''),
      ];
      rows.push(row.join(','));
    }

    const csvContent = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_export.csv"');
    return res.status(200).send(csvContent);
  } catch (err: any) {
    console.error('Export CSV error:', err);
    return res.status(500).json({ error: 'Failed to export attendance CSV.' });
  }
});

// POST /api/data/import-csv - Import attendance CSV
router.post('/import-csv', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { csvData } = req.body;

    if (!csvData || typeof csvData !== 'string') {
      return res.status(400).json({ error: 'Valid CSV data string is required.' });
    }

    const lines = csvData.trim().split(/\r?\n/);
    if (lines.length <= 1) {
      return res.status(400).json({ error: 'CSV file contains no data rows.' });
    }

    // Get or create subjects map
    const existingSubs = await query('SELECT id, name, code FROM subjects WHERE user_id = $1', [userId]);
    const subMapByName = new Map<string, number>();
    const subMapByCode = new Map<string, number>();

    for (const s of existingSubs.rows) {
      subMapByName.set(s.name.toLowerCase(), s.id);
      subMapByCode.set(s.code.toUpperCase(), s.id);
    }

    let importedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV regex splitter for quoted and unquoted cells
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((p) => p.replace(/^"|"$/g, '').trim());
      if (parts.length < 4) continue;

      const [dateStr, subjectName, subjectCode, status, classType, startTime, endTime, room, notes] = parts;

      if (!dateStr || !status) continue;
      const cleanStatus = status.toLowerCase();
      if (!['present', 'absent', 'cancelled'].includes(cleanStatus)) continue;

      let subjectId = subMapByCode.get(subjectCode?.toUpperCase()) || subMapByName.get(subjectName?.toLowerCase());

      if (!subjectId && subjectName) {
        // Create subject automatically
        const newSub = await query(
          `INSERT INTO subjects (user_id, name, code)
           VALUES ($1, $2, $3) RETURNING id`,
          [userId, subjectName, subjectCode || subjectName.substring(0, 4).toUpperCase()]
        );
        const newId: number = Number(newSub.rows[0].id);
        subjectId = newId;
        subMapByName.set(subjectName.toLowerCase(), newId);
        if (subjectCode) subMapByCode.set(subjectCode.toUpperCase(), newId);
      }

      if (!subjectId) continue;

      await query(
        `INSERT INTO attendance (user_id, subject_id, schedule_id, date, status, notes)
         VALUES ($1, $2, NULL, $3, $4, $5)`,
        [userId, subjectId, dateStr, cleanStatus, notes || 'Imported via CSV']
      );

      importedCount++;
    }

    return res.json({ message: `Successfully imported ${importedCount} attendance records.` });
  } catch (err: any) {
    console.error('Import CSV error:', err);
    return res.status(500).json({ error: 'Failed to process CSV file.' });
  }
});

// POST /api/data/seed-sample - Populate with sample data
router.post('/seed-sample', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await seedSampleDataForUser(userId);
    return res.json({ message: 'Sample college subjects, timetable, and attendance records added.' });
  } catch (err: any) {
    console.error('Seed sample error:', err);
    return res.status(500).json({ error: 'Failed to load sample data.' });
  }
});

// POST /api/data/reset - Reset all attendance or all user data
router.post('/reset', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { resetType } = req.body; // 'attendance_only' | 'all'

    if (resetType === 'attendance_only') {
      await query('DELETE FROM attendance WHERE user_id = $1', [userId]);
      return res.json({ message: 'All attendance history has been cleared.' });
    } else {
      // Clear attendance, schedules, subjects
      await query('DELETE FROM attendance WHERE user_id = $1', [userId]);
      await query('DELETE FROM schedules WHERE user_id = $1', [userId]);
      await query('DELETE FROM subjects WHERE user_id = $1', [userId]);
      return res.json({ message: 'All subjects, timetable, and attendance data have been reset.' });
    }
  } catch (err: any) {
    console.error('Reset error:', err);
    return res.status(500).json({ error: 'Failed to reset data.' });
  }
});

export default router;
