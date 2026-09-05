import { getDb } from './index';

export async function initDb() {
  const db = await getDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      college VARCHAR(255) DEFAULT '',
      semester VARCHAR(50) DEFAULT '',
      required_attendance INTEGER DEFAULT 75,
      auto_mark_absent BOOLEAN DEFAULT FALSE,
      theme VARCHAR(20) DEFAULT 'system',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL,
      faculty VARCHAR(255) DEFAULT '',
      color VARCHAR(50) DEFAULT '#0284c7',
      required_attendance INTEGER DEFAULT 75,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
      start_time VARCHAR(10) NOT NULL,
      end_time VARCHAR(10) NOT NULL,
      room VARCHAR(100) DEFAULT '',
      faculty VARCHAR(255) DEFAULT '',
      class_type VARCHAR(50) DEFAULT 'Lecture',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      schedule_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL,
      date DATE NOT NULL,
      status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'cancelled')),
      notes TEXT DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_user_schedule_date UNIQUE (user_id, schedule_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_attendance_subject ON attendance(subject_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_user_day ON schedules(user_id, day_of_week);
    CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects(user_id);
  `);

  console.log('[DB] Database schema initialized successfully');
}
