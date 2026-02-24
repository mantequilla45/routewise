import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';

interface Params {
    params: Promise<{
        id: string;
    }>;
}

export async function PATCH(request: Request, { params }: Params) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, review_notes, transferred_route_id } = body;

        // Validate status
        if (!status || !['approved', 'rejected', 'needs_revision'].includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Invalid status' },
                { status: 400 }
            );
        }

        // Update the contribution
        const sql = `
            UPDATE route_contributions
            SET 
                status = $1,
                review_notes = $2,
                reviewed_at = CURRENT_TIMESTAMP,
                transferred_route_id = $3,
                transferred_at = CASE WHEN $1 = 'approved' THEN CURRENT_TIMESTAMP ELSE NULL END
            WHERE id = $4
            RETURNING id, route_code, status;
        `;

        const result = await query(sql, [
            status,
            review_notes || null,
            transferred_route_id || null,
            id
        ]);

        if (!result || result.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Contribution not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            contribution: result[0]
        });

    } catch (error) {
        console.error('Error updating contribution:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update contribution' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request, { params }: Params) {
    try {
        const { id } = await params;
        
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
                reviewed_at,
                transferred_route_id
            FROM route_contributions
            WHERE id = $1;
        `;

        const result = await query(sql, [id]);

        if (!result || result.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Contribution not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            contribution: result[0]
        });

    } catch (error) {
        console.error('Error fetching contribution:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch contribution' },
            { status: 500 }
        );
    }
}