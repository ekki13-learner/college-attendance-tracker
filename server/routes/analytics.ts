import { Router, Response } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { calculateAttendanceStats } from '../utils/calculations';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get user details
    const userRes = await query('SELECT required_attendance FROM users WHERE id = $1', [userId]);
    const defaultRequired = userRes.rows[0]?.required_attendance || 75;

    // Fetch subjects
    const subjectsRes = await query(
      'SELECT id, name, code, color, required_attendance FROM subjects WHERE user_id = $1 ORDER BY name ASC',
      [userId]
    );

    // Fetch all attendance
    const attendanceRes = await query(
      `SELECT a.id, a.subject_id, a.date, a.status,
              sub.name as subject_name, sub.code as subject_code
       FROM attendance a
       JOIN subjects sub ON a.subject_id = sub.id
       WHERE a.user_id = $1
       ORDER BY a.date ASC`,
      [userId]
    );

    let totalAttended = 0;
    let totalAbsent = 0;
    let totalCancelled = 0;

    const subjectCounts = new Map<number, { attended: number; absent: number; cancelled: number }>();
    for (const s of subjectsRes.rows) {
      subjectCounts.set(s.id, { attended: 0, absent: 0, cancelled: 0 });
    }

    // Process records
    for (const record of attendanceRes.rows) {
      if (record.status === 'present') totalAttended++;
      else if (record.status === 'absent') totalAbsent++;
      else if (record.status === 'cancelled') totalCancelled++;

      if (subjectCounts.has(record.subject_id)) {
        const entry = subjectCounts.get(record.subject_id)!;
        if (record.status === 'present') entry.attended++;
        else if (record.status === 'absent') entry.absent++;
        else if (record.status === 'cancelled') entry.cancelled++;
      }
    }

    const overallStats = calculateAttendanceStats(totalAttended, totalAbsent, totalCancelled, defaultRequired);

    // Map subjects with stats
    const subjectStatsList = subjectsRes.rows.map((s) => {
      const counts = subjectCounts.get(s.id) || { attended: 0, absent: 0, cancelled: 0 };
      const reqPct = s.required_attendance || defaultRequired;
      const stats = calculateAttendanceStats(counts.attended, counts.absent, counts.cancelled, reqPct);
      return {
        id: s.id,
        name: s.name,
        code: s.code,
        color: s.color,
        requiredAttendance: reqPct,
        stats,
      };
    });

    // Subjects at risk
    const atRiskSubjects = subjectStatsList.filter((s) => s.stats.isAtRisk);

    // Highest and lowest
    let highestSubject: any = null;
    let lowestSubject: any = null;

    if (subjectStatsList.length > 0) {
      const sortedByPct = [...subjectStatsList].filter(s => s.stats.total > 0).sort((a, b) => b.stats.percentage - a.stats.percentage);
      if (sortedByPct.length > 0) {
        highestSubject = sortedByPct[0];
        lowestSubject = sortedByPct[sortedByPct.length - 1];
      }
    }

    // Weekly trend aggregation (past 6-8 weeks)
    // Group attendance by week starting date
    const weeklyBuckets = new Map<string, { weekLabel: string; attended: number; total: number }>();
    
    for (const record of attendanceRes.rows) {
      if (record.status === 'cancelled') continue;

      const dateObj = new Date(record.date);
      // Find Monday of this week
      const day = dateObj.getDay();
      const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(dateObj.setDate(diff));
      const weekKey = monday.toISOString().split('T')[0];
      const weekLabel = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!weeklyBuckets.has(weekKey)) {
        weeklyBuckets.set(weekKey, { weekLabel, attended: 0, total: 0 });
      }
      const b = weeklyBuckets.get(weekKey)!;
      b.total++;
      if (record.status === 'present') b.attended++;
    }

    const weeklyTrend = Array.from(weeklyBuckets.entries())
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .slice(-8)
      .map(([key, data]) => ({
        week: data.weekLabel,
        percentage: data.total === 0 ? 100 : Number(((data.attended / data.total) * 100).toFixed(1)),
        attended: data.attended,
        total: data.total,
      }));

    return res.json({
      overall: overallStats,
      totalSubjects: subjectsRes.rows.length,
      atRiskCount: atRiskSubjects.length,
      highestSubject,
      lowestSubject,
      subjects: subjectStatsList,
      weeklyTrend,
      distribution: [
        { name: 'Present', value: totalAttended, color: '#10b981' },
        { name: 'Absent', value: totalAbsent, color: '#ef4444' },
        { name: 'Cancelled', value: totalCancelled, color: '#94a3b8' },
      ],
    });
  } catch (err: any) {
    console.error('Analytics error:', err);
    return res.status(500).json({ error: 'Failed to compute analytics.' });
  }
});

export default router;
