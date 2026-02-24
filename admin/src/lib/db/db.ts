import { Pool } from "pg";

// Prefer pooler URL for better serverless compatibility
const DATABASE_URL = process.env.DATABASE_POOLER_URL || process.env.DATABASE_URL || "";

if (!DATABASE_URL) {
    console.error("DATABASE_URL or DATABASE_POOLER_URL must be set in environment variables");
}

console.log("Connecting to database:", DATABASE_URL.replace(/:[^:@]*@/, ':****@'));

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10, // Reduce pool size for serverless
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // Additional options for Supabase pooler
    statement_timeout: 60000,
    query_timeout: 60000,
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
});

pool.on('connect', () => {
    console.log('New client connected to PostgreSQL pool');
});

export async function query(sql: string, params?: unknown[]) {
    const maxRetries = 3;
    let lastError: Error | unknown;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const res = await pool.query(sql, params);
            return res.rows;
        } catch (error) {
            lastError = error;
            const errorObj = error as { code?: string; message?: string; detail?: string };
            console.error(`Database query attempt ${attempt}/${maxRetries} failed:`, {
                code: errorObj.code,
                message: errorObj.message,
                detail: errorObj.detail
            });
            
            // If it's a connection error and we have retries left, wait and retry
            if (attempt < maxRetries && (
                errorObj.code === 'ETIMEDOUT' || 
                errorObj.code === 'ECONNREFUSED' ||
                errorObj.code === 'ENOTFOUND' ||
                errorObj.message?.includes('Connection terminated')
            )) {
                console.log(`Waiting ${attempt * 1000}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                continue;
            }
            
            // For other errors, throw immediately
            break;
        }
    }
    
    console.error("All database query attempts failed");
    throw lastError;
}

// Health check function
export async function checkConnection() {
    try {
        const result = await query('SELECT NOW() as current_time');
        console.log('Database connection successful:', result[0]);
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}

// Test connection on module load
checkConnection();