import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const PORT = parseInt(process.env.PORT || '5000', 10);
export const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-college-attendance-jwt-key-2026';
export const DATABASE_URL = process.env.DATABASE_URL;
export const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'postgres_db')
  : path.resolve(process.cwd(), 'data', 'postgres_db');
