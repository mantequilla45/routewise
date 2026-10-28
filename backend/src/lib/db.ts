import { Pool } from 'pg';
import { env } from '../env';

// Small pool: on Vercel each function instance gets its own pool, and the
// Supabase transaction pooler multiplexes them onto real connections.
const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 60000,
  query_timeout: 60000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

export async function query<T = any>(sql: string, params?: unknown[]): Promise<T[]> {
  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await pool.query(sql, params);
      return res.rows as T[];
    } catch (error) {
      lastError = error;
      const errorObj = error as { code?: string; message?: string; detail?: string };
      console.error(`Database query attempt ${attempt}/${maxRetries} failed:`, {
        code: errorObj.code,
        message: errorObj.message,
        detail: errorObj.detail,
      });

      const transient =
        errorObj.code === 'ETIMEDOUT' ||
        errorObj.code === 'ECONNREFUSED' ||
        errorObj.code === 'ENOTFOUND' ||
        errorObj.message?.includes('Connection terminated');

      if (attempt < maxRetries && transient) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        continue;
      }
      break;
    }
  }

  throw lastError;
}
