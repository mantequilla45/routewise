import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
    db: {
        schema: 'public'
    }
});

export async function query(sql: string, params?: unknown[]) {
    try {
        // Convert positional parameters ($1, $2) to named parameters for Supabase
        let formattedSql = sql;
        const paramObj: Record<string, any> = {};
        
        if (params && params.length > 0) {
            params.forEach((param, index) => {
                const paramName = `param${index + 1}`;
                formattedSql = formattedSql.replace(`$${index + 1}`, `{{${paramName}}}`);
                paramObj[paramName] = param;
            });
        }
        
        const { data, error } = await supabase.rpc('query_raw', {
            query_text: sql,
            query_params: params || []
        }).select();

        if (error) {
            // Fallback to direct SQL if RPC doesn't exist
            const { data: directData, error: directError } = await supabase
                .from('routes')
                .select('*')
                .limit(1);
                
            if (directError) {
                throw directError;
            }
            
            // If this works, use a different approach
            console.log('Using alternative Supabase query method');
            // For now, throw the original error
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Supabase query error:', error);
        throw error;
    }
}

// Export the supabase client for direct use if needed
export { supabase };