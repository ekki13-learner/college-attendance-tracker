import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { PORT } from './config';
import { initDb } from './db/schema';
import authRouter from './routes/auth';
import subjectsRouter from './routes/subjects';
import schedulesRouter from './routes/schedules';
import attendanceRouter from './routes/attendance';
import analyticsRouter from './routes/analytics';
import dataRouter from './routes/data';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/data', dataRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend in production or when client/dist exists
const clientDistPath = path.resolve(process.cwd(), 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[Static] Serving frontend static assets from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.get('*', (req, res) => {
    // If not an API request, serve index.html
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found.' });
    }
  });
}

async function start() {
  try {
    await initDb();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`🚀 College Attendance Tracker server running on:`);
      console.log(`   Local: http://localhost:${PORT}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  start();
}

export default app;

