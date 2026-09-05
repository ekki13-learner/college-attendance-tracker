import app from '../server/index';
import { initDb } from '../server/db/schema';

let dbReady = false;

export default async function handler(req: any, res: any) {
  if (!dbReady) {
    try {
      await initDb();
      dbReady = true;
    } catch (e) {
      console.error('[Vercel] DB init error:', e);
    }
  }
  return app(req, res);
}