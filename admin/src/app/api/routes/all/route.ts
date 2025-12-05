import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/db';

export async function GET(_req: NextRequest) {
    try {
        // Fetch all routes from the database
        const sql = `
            SELECT 
                id,
                route_code as route_id,
                CONCAT(start_point_name, ' - ', end_point_name) as route_code,
                '#33ff00' as route_color,
                created_at
            FROM jeepney_routes
            ORDER BY route_code ASC;
        `;
        
        const routes = await query(sql);

        // Return the routes
        return NextResponse.json(routes || []);
        
    } catch (error) {
        console.error('Error in routes API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}