import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/db';

interface Params {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(
    req: NextRequest,
    { params }: Params
) {
    try {
        const { id } = await params;
        
        // Fetch route with coordinates converted to JSON
        const sql = `
            SELECT 
                id,
                route_code as route_id,
                CONCAT(start_point_name, ' - ', end_point_name) as route_name,
                '#33ff00' as route_color,
                ST_AsGeoJSON(geom_forward)::json as geojson
            FROM jeepney_routes
            WHERE id = $1;
        `;
        
        const result = await query(sql, [id]);
        
        if (!result || result.length === 0) {
            return NextResponse.json(
                { error: 'Route not found' },
                { status: 404 }
            );
        }

        const route = result[0];
        
        // Convert GeoJSON to coordinates array
        let coordinates = [];
        if (route.geojson && route.geojson.coordinates) {
            // Handle different GeoJSON types
            const geomCoords = route.geojson.coordinates;
            if (route.geojson.type === 'LineString') {
                coordinates = geomCoords.map((coord: number[]) => ({
                    latitude: coord[1],
                    longitude: coord[0]
                }));
            } else if (route.geojson.type === 'MultiLineString' || route.geojson.type === 'Polygon') {
                coordinates = geomCoords[0].map((coord: number[]) => ({
                    latitude: coord[1],
                    longitude: coord[0]
                }));
            }
        }

        const response = {
            ...route,
            coordinates
        };
        
        return NextResponse.json(response);
    } catch (error) {
        console.error('Failed to fetch route:', error);
        return NextResponse.json(
            { error: 'Failed to fetch route' },
            { status: 500 }
        );
    }
}