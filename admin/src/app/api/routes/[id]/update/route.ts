import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/db';
import { RouteRecord } from '@/types/database';

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
        ) as RouteRecord[];

        // The query function returns rows directly as an array
        if (!result || result.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Route not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            route: result[0]
        });

    } catch (error) {
        console.error('Error updating route:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update route';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}