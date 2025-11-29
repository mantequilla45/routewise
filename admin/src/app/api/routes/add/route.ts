import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/db';

export async function POST(request: NextRequest) {
    try {
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
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create LineString from coordinates
        const forwardLineString = `LINESTRING(${coordinates_forward
            .map((coord: number[]) => `${coord[0]} ${coord[1]}`)
            .join(', ')})`;

        const sql = `
            INSERT INTO new_jeepney_routes (
                route_code,
                start_point_name,
                end_point_name,
                geom_forward,
                horizontal_or_vertical_road
            ) VALUES (
                $1,
                $2,
                $3,
                ST_GeomFromText($4, 4326),
                $5
            ) RETURNING id, route_code, start_point_name, end_point_name;
        `;

        const result = await query(sql, [
            route_code,
            start_point_name,
            end_point_name,
            forwardLineString,
            horizontal_or_vertical_road ?? true
        ]);

        return NextResponse.json({
            success: true,
            route: result[0]
        });

    } catch (error) {
        console.error('Error adding route:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to add route', details: errorMessage },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const sql = `
            SELECT 
                id,
                route_code,
                start_point_name,
                end_point_name,
                horizontal_or_vertical_road,
                ST_AsGeoJSON(geom_forward)::json as forward_geojson
            FROM new_jeepney_routes
            ORDER BY route_code;
        `;

        const routes = await query(sql);

        return NextResponse.json({
            success: true,
            routes: routes
        });

    } catch (error) {
        console.error('Error fetching routes:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch routes', details: errorMessage },
            { status: 500 }
        );
    }
}