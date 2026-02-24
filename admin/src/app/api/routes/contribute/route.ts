import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { 
            route_code, 
            contributor_name, 
            contributor_email, 
            coordinates_forward,
            status = 'pending'
        } = body;

        // Validate input
        if (!route_code || !contributor_name || !coordinates_forward || coordinates_forward.length < 2) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields or insufficient coordinates' },
                { status: 400 }
            );
        }

        // Create GeoJSON for the contribution
        const forward_geojson = {
            type: 'LineString',
            coordinates: coordinates_forward
        };

        // Insert into route_contributions table
        const sql = `
            INSERT INTO route_contributions (
                route_code,
                contributor_name,
                contributor_email,
                forward_geojson,
                status,
                start_point_name,
                end_point_name
            ) VALUES (
                $1, $2, $3, $4::jsonb, $5, $6, $7
            ) RETURNING id, route_code, contributor_name, status;
        `;

        const result = await query(sql, [
            route_code,
            contributor_name,
            contributor_email || null,
            JSON.stringify(forward_geojson),
            status,
            'Terminal A',
            'Terminal B'
        ]);

        if (!result || result.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Failed to store contribution' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Route contribution submitted successfully for review',
            contribution: result[0]
        });

    } catch (error) {
        console.error('Error in contribute route:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET endpoint to retrieve pending contributions (for admin review)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending';
        
        const sql = `
            SELECT 
                id,
                route_code,
                contributor_name,
                contributor_email,
                forward_geojson,
                status,
                review_notes,
                created_at,
                start_point_name,
                end_point_name
            FROM route_contributions
            WHERE status = $1
            ORDER BY created_at DESC;
        `;

        const contributions = await query(sql, [status]);

        return NextResponse.json({
            success: true,
            contributions: contributions || []
        });

    } catch (error) {
        console.error('Error fetching contributions:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}