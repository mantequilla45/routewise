import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/db';

interface Params {
    params: Promise<{
        id: string;
    }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await request.json();
        
        const {
            route_code,
            start_point_name,
            end_point_name,
            coordinates_forward,
            horizontal_or_vertical_road
        } = body;

        // Validate required fields
        if (!route_code || !start_point_name || !end_point_name || !coordinates_forward) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Convert coordinates to LineString for PostGIS
        const forwardLineString = `LINESTRING(${coordinates_forward
            .map((coord: number[]) => `${coord[0]} ${coord[1]}`)
            .join(', ')})`;

        // Update the route with exact columns from the table
        const updateQuery = `
            UPDATE new_jeepney_routes
            SET 
                route_code = $1,
                start_point_name = $2,
                end_point_name = $3,
                geom_forward = ST_GeomFromText($4, 4326),
                geom_reverse = ST_GeomFromText($4, 4326),
                horizontal_or_vertical_road = $5
            WHERE id = $6::uuid
            RETURNING id, route_code, start_point_name, end_point_name, horizontal_or_vertical_road,
                     ST_AsGeoJSON(geom_forward)::json as forward_geojson
        `;

        const result = await query(
            updateQuery,
            [
                route_code,
                start_point_name,
                end_point_name,
                forwardLineString,
                horizontal_or_vertical_road,
                id
            ]
        );

        // Check if result is an array (direct result) or has rows property
        const rows = Array.isArray(result) ? result : result?.rows;
        
        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Route not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            route: rows[0]
        });

    } catch (error: any) {
        console.error('Error updating route:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update route' },
            { status: 500 }
        );
    }
}