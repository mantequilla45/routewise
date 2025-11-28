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
            coordinates_reverse,
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
        
        const reverseLineString = coordinates_reverse
            ? `LINESTRING(${coordinates_reverse
                .map((coord: number[]) => `${coord[0]} ${coord[1]}`)
                .join(', ')})`
            : forwardLineString;

        const sql = `
            INSERT INTO new_jeepney_routes (
                route_code,
                start_point_name,
                end_point_name,
                geom_forward,
                geom_reverse,
                horizontal_or_vertical_road
            ) VALUES (
                $1,
                $2,
                $3,
                ST_GeomFromText($4, 4326),
                ST_GeomFromText($5, 4326),
                $6
            ) RETURNING id, route_code, start_point_name, end_point_name;
        `;

        const result = await query(sql, [
            route_code,
            start_point_name,
            end_point_name,
            forwardLineString,
            reverseLineString,
            horizontal_or_vertical_road ?? true
        ]);

        return NextResponse.json({
            success: true,
            route: result[0]
        });

    } catch (error: any) {
        console.error('Error adding route:', error);
        return NextResponse.json(
            { error: 'Failed to add route', details: error.message },
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
                ST_AsGeoJSON(geom_forward)::json as forward_geojson,
                ST_AsGeoJSON(geom_reverse)::json as reverse_geojson
            FROM new_jeepney_routes
            ORDER BY route_code;
        `;

        const routes = await query(sql);

        return NextResponse.json({
            success: true,
            routes: routes
        });

    } catch (error: any) {
        console.error('Error fetching routes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch routes', details: error.message },
            { status: 500 }
        );
    }
}