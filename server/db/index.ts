import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { DATABASE_URL, DATA_DIR } from '../config';

interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

interface DatabaseAdapter {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  exec(text: string): Promise<void>;
  close(): Promise<void>;
}

let dbInstance: DatabaseAdapter | null = null;

export async function getDb(): Promise<DatabaseAdapter> {
  if (dbInstance) {
    return dbInstance;
  }

  if (DATABASE_URL) {
    console.log('[DB] Connecting to external PostgreSQL via DATABASE_URL');
    const pool = new Pool({
      connectionString: DATABASE_URL,
    });
    
    // Test connection
    const client = await pool.connect();
    client.release();

    dbInstance = {
      async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
        const res = await pool.query(text, params);
        return {
          rows: res.rows,
          rowCount: res.rowCount ?? res.rows.length,
        };
      },
      async exec(text: string): Promise<void> {
        await pool.query(text);
      },
      async close(): Promise<void> {
        await pool.end();
      }
    };
  } else {
    console.log(`[DB] Initializing embedded persistent PostgreSQL at: ${DATA_DIR}`);
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const pglite = new PGlite(DATA_DIR);

    dbInstance = {
      async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
        const res = await pglite.query(text, params);
        return {
          rows: res.rows as T[],
          rowCount: res.rows.length,
        };
      },
      async exec(text: string): Promise<void> {
        await pglite.exec(text);
      },
      async close(): Promise<void> {
        await pglite.close();
      }
    };
  }

  return dbInstance;
}

export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const db = await getDb();
  return db.query<T>(text, params);
}
