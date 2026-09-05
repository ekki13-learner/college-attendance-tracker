import { query } from '../db';

export async function seedSampleDataForUser(userId: number) {
  // 1. Insert sample subjects
  const sampleSubjects = [
    { name: 'Mathematics', code: 'MATH101', faculty: 'Dr. Sarah Jenkins', color: '#2563eb', required: 75 },
    { name: 'Physics', code: 'PHY102', faculty: 'Prof. Robert Lang', color: '#7c3aed', required: 75 },
    { name: 'Chemistry', code: 'CHEM103', faculty: 'Dr. Anita Roy', color: '#0891b2', required: 75 },
    { name: 'Digital Electronics', code: 'EC201', faculty: 'Prof. Vikram Sharma', color: '#059669', required: 75 },
    { name: 'VLSI Design', code: 'EC302', faculty: 'Dr. Elena Vance', color: '#d97706', required: 75 },
    { name: 'Programming in C++', code: 'CS105', faculty: 'Prof. David Miller', color: '#db2777', required: 75 },
  ];

  const subjectMap = new Map<string, number>();

  for (const s of sampleSubjects) {
    const res = await query(
      `INSERT INTO subjects (user_id, name, code, faculty, color, required_attendance)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [userId, s.name, s.code, s.faculty, s.color, s.required]
    );
    subjectMap.set(s.name, res.rows[0].id);
  }

  // 2. Insert sample weekly schedules (day_of_week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
  const schedulesData = [
    // Monday (1)
    { subject: 'Mathematics', day: 1, start: '09:00', end: '10:00', room: 'A-204', faculty: 'Dr. Sarah Jenkins', type: 'Lecture' },
    { subject: 'Digital Electronics', day: 1, start: '10:00', end: '11:00', room: 'E-102', faculty: 'Prof. Vikram Sharma', type: 'Lecture' },
    { subject: 'Physics', day: 1, start: '14:00', end: '16:00', room: 'Lab-3', faculty: 'Prof. Robert Lang', type: 'Lab' },
    // Tuesday (2)
    { subject: 'Programming in C++', day: 2, start: '09:00', end: '10:00', room: 'Comp-101', faculty: 'Prof. David Miller', type: 'Lecture' },
    { subject: 'Physics', day: 2, start: '10:00', end: '11:00', room: 'B-105', faculty: 'Prof. Robert Lang', type: 'Lecture' },
    { subject: 'Mathematics', day: 2, start: '11:15', end: '12:15', room: 'A-204', faculty: 'Dr. Sarah Jenkins', type: 'Tutorial' },
    { subject: 'Digital Electronics', day: 2, start: '14:00', end: '16:00', room: 'Hardware Lab', faculty: 'Prof. Vikram Sharma', type: 'Lab' },
    // Wednesday (3)
    { subject: 'Chemistry', day: 3, start: '09:00', end: '10:00', room: 'C-302', faculty: 'Dr. Anita Roy', type: 'Lecture' },
    { subject: 'VLSI Design', day: 3, start: '10:00', end: '11:00', room: 'E-201', faculty: 'Dr. Elena Vance', type: 'Lecture' },
    { subject: 'Programming in C++', day: 3, start: '11:15', end: '12:15', room: 'Comp-101', faculty: 'Prof. David Miller', type: 'Lecture' },
    // Thursday (4)
    { subject: 'Mathematics', day: 4, start: '09:00', end: '10:00', room: 'A-204', faculty: 'Dr. Sarah Jenkins', type: 'Lecture' },
    { subject: 'Physics', day: 4, start: '10:00', end: '11:00', room: 'B-105', faculty: 'Prof. Robert Lang', type: 'Lecture' },
    { subject: 'Programming in C++', day: 4, start: '14:00', end: '16:00', room: 'Lab-1', faculty: 'Prof. David Miller', type: 'Lab' },
    // Friday (5)
    { subject: 'Digital Electronics', day: 5, start: '09:00', end: '10:00', room: 'E-102', faculty: 'Prof. Vikram Sharma', type: 'Lecture' },
    { subject: 'VLSI Design', day: 5, start: '10:00', end: '11:00', room: 'E-201', faculty: 'Dr. Elena Vance', type: 'Lecture' },
    { subject: 'Chemistry', day: 5, start: '11:15', end: '12:15', room: 'C-302', faculty: 'Dr. Anita Roy', type: 'Lecture' },
    // Saturday (6)
    { subject: 'VLSI Design', day: 6, start: '10:00', end: '12:00', room: 'E-201', faculty: 'Dr. Elena Vance', type: 'Tutorial' },
  ];

  const scheduleList: Array<{ id: number; subjectId: number; subjectName: string; day: number; start: string }> = [];

  for (const item of schedulesData) {
    const subjectId = subjectMap.get(item.subject)!;
    const res = await query(
      `INSERT INTO schedules (user_id, subject_id, day_of_week, start_time, end_time, room, faculty, class_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [userId, subjectId, item.day, item.start, item.end, item.room, item.faculty, item.type]
    );
    scheduleList.push({
      id: res.rows[0].id,
      subjectId,
      subjectName: item.subject,
      day: item.day,
      start: item.start,
    });
  }

  // 3. Generate past 30 days of attendance
  const today = new Date();
  // Loop back 28 days (4 weeks)
  for (let daysAgo = 28; daysAgo >= 1; daysAgo--) {
    const dateObj = new Date(today);
    dateObj.setDate(today.getDate() - daysAgo);
    const dayOfWeek = dateObj.getDay();
    const dateStr = dateObj.toISOString().split('T')[0];

    const daySchedules = scheduleList.filter((s) => s.day === dayOfWeek);
    for (const sch of daySchedules) {
      let status: 'present' | 'absent' | 'cancelled' = 'present';
      let notes = '';

      // Create realistic attendance profile
      if (sch.subjectName === 'VLSI Design') {
        // lower attendance ~ 68%
        const rand = (daysAgo * 7 + sch.id) % 10;
        if (rand < 3) status = 'absent';
        else if (rand === 3) status = 'cancelled';
        else status = 'present';
      } else if (sch.subjectName === 'Digital Electronics') {
        // ~ 72%
        const rand = (daysAgo * 13 + sch.id) % 10;
        if (rand < 3) status = 'absent';
        else status = 'present';
      } else if (sch.subjectName === 'Physics') {
        // ~ 82%
        const rand = (daysAgo * 5 + sch.id) % 10;
        if (rand === 0 || rand === 1) status = 'absent';
        else if (rand === 2) status = 'cancelled';
        else status = 'present';
      } else {
        // Math, Chem, Prog ~ 90-95%
        const rand = (daysAgo * 3 + sch.id) % 10;
        if (rand === 0) status = 'absent';
        else status = 'present';
      }

      if (status === 'cancelled') {
        notes = 'Class cancelled by faculty';
      }

      await query(
        `INSERT INTO attendance (user_id, subject_id, schedule_id, date, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, schedule_id, date) DO NOTHING`,
        [userId, sch.subjectId, sch.id, dateStr, status, notes]
      );
    }
  }

  console.log(`[Seed] Successfully seeded realistic sample data for user ID ${userId}`);
}
