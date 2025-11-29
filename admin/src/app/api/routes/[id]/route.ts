import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/db';

interface Params {
    params: Promise<{
        id: string;
    }>;
}

export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        
        if (!id) {
            return NextResponse.json(
                { error: 'Invalid route ID' },
                { status: 400 }
            );
        }

        const sql = `
            DELETE FROM new_jeepney_routes
            WHERE id = $1
            RETURNING id, route_code;
        `;

        const result = await query(sql, [id]);

        if (result.length === 0) {
            return NextResponse.json(
                { error: 'Route not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            deleted: result[0]
        });

    } catch (error) {
        console.error('Error deleting route:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to delete route', details: errorMessage },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        console.log('GET route details for ID:', id);
        
        if (!id) {
            console.error('No ID provided');
            return NextResponse.json(
                { error: 'Invalid route ID' },
                { status: 400 }
            );
        }

        const sql = `
            SELECT 
                id,
                route_code,
                start_point_name,
                end_point_name,
                ST_AsGeoJSON(geom_forward)::json as forward_geojson
            FROM new_jeepney_routes
            WHERE id = $1;
        `;

        console.log('Executing query for route ID:', id);
        const result = await query(sql, [id]);
        console.log('Query result:', result);

        if (!result || result.length === 0) {
            console.log('No route found with ID:', id);
            return NextResponse.json(
                { error: 'Route not found' },
                { status: 404 }
            );
        }

        // The geometry is already parsed as JSON from PostgreSQL
        const route = result[0];
        
        const response = {
            success: true,
            route: {
                id: route.id,
                route_code: route.route_code,
                start_point_name: route.start_point_name,
                end_point_name: route.end_point_name,
                forward_geojson: route.forward_geojson
            }
        };
        
        console.log('Sending response:', response);
        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching route:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch route', details: errorMessage },
            { status: 500 }
        );
    }
}