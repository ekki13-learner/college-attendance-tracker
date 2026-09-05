import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { JWT_SECRET } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';
import { seedSampleDataForUser } from '../utils/sampleData';

const router = Router();

// Helper to sign JWT
function generateToken(user: { id: number; email: string; name: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, college, semester, requiredAttendance, withSampleData } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const existing = await query('SELECT id FROM users WHERE email = $1', [emailTrimmed]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const targetAttendance = Number(requiredAttendance) || 75;

    const insertResult = await query(
      `INSERT INTO users (name, email, password_hash, college, semester, required_attendance)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, college, semester, required_attendance, auto_mark_absent, theme`,
      [name.trim(), emailTrimmed, passwordHash, college?.trim() || '', semester?.trim() || '', targetAttendance]
    );

    const newUser = insertResult.rows[0];

    if (withSampleData) {
      await seedSampleDataForUser(newUser.id);
    }

    const token = generateToken(newUser);
    return res.status(201).json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        college: newUser.college,
        semester: newUser.semester,
        requiredAttendance: newUser.required_attendance,
        autoMarkAbsent: newUser.auto_mark_absent,
        theme: newUser.theme,
      },
      token,
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const result = await query(
      `SELECT id, name, email, password_hash, college, semester, required_attendance, auto_mark_absent, theme
       FROM users WHERE email = $1`,
      [emailTrimmed]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        college: user.college,
        semester: user.semester,
        requiredAttendance: user.required_attendance,
        autoMarkAbsent: user.auto_mark_absent,
        theme: user.theme,
      },
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// POST /api/auth/demo
router.post('/demo', async (req, res) => {
  try {
    const demoEmail = 'student.demo@college.edu';
    const existing = await query(
      `SELECT id, name, email, college, semester, required_attendance, auto_mark_absent, theme
       FROM users WHERE email = $1`,
      [demoEmail]
    );

    let user;
    if (existing.rows.length > 0) {
      user = existing.rows[0];
    } else {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('DemoStudent123!', salt);
      const insert = await query(
        `INSERT INTO users (name, email, password_hash, college, semester, required_attendance)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, email, college, semester, required_attendance, auto_mark_absent, theme`,
        ['Alex Johnson', demoEmail, passwordHash, 'Institute of Engineering & Tech', 'Semester 5', 75]
      );
      user = insert.rows[0];
      await seedSampleDataForUser(user.id);
    }

    const token = generateToken(user);
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        college: user.college,
        semester: user.semester,
        requiredAttendance: user.required_attendance,
        autoMarkAbsent: user.auto_mark_absent,
        theme: user.theme,
      },
      token,
    });
  } catch (err: any) {
    console.error('Demo auth error:', err);
    return res.status(500).json({ error: 'Internal server error creating demo session.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, email, college, semester, required_attendance, auto_mark_absent, theme, created_at
       FROM users WHERE id = $1`,
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        college: user.college,
        semester: user.semester,
        requiredAttendance: user.required_attendance,
        autoMarkAbsent: user.auto_mark_absent,
        theme: user.theme,
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, college, semester, requiredAttendance, autoMarkAbsent, theme } = req.body;
    const userId = req.user!.id;

    const result = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           college = COALESCE($2, college),
           semester = COALESCE($3, semester),
           required_attendance = COALESCE($4, required_attendance),
           auto_mark_absent = COALESCE($5, auto_mark_absent),
           theme = COALESCE($6, theme)
       WHERE id = $7
       RETURNING id, name, email, college, semester, required_attendance, auto_mark_absent, theme`,
      [name, college, semester, requiredAttendance ? Number(requiredAttendance) : null, autoMarkAbsent, theme, userId]
    );

    const user = result.rows[0];
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        college: user.college,
        semester: user.semester,
        requiredAttendance: user.required_attendance,
        autoMarkAbsent: user.auto_mark_absent,
        theme: user.theme,
      },
      message: 'Profile updated successfully.',
    });
  } catch (err: any) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

export default router;
