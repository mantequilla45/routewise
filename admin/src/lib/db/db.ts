import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

export async function query(sql: string, params?: any[]) {
    const res = await pool.query(sql, params);
    return res.rows;
}
