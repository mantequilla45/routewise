import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/db';

export async function POST(request: NextRequest) {
    try {
        const { latitude, longitude, maxDistance = 50 } = await request.json();
        
        if (!latitude || !longitude) {
            return NextResponse.json(
                { error: 'Latitude and longitude are required' },
                { status: 400 }
            );
        }

        // Query to find the nearest point on any route using PostGIS
        const nearestQuery = `
            WITH route_distances AS (
                SELECT 
                    r.id as route_id,
                    r.route_code,
                    r.start_point_name,
                    r.end_point_name,
                    ST_Distance(
                        r.geom_forward::geography,
                        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                    ) as distance_meters,
                    ST_LineLocatePoint(
                        r.geom_forward,
                        ST_SetSRID(ST_MakePoint($1, $2), 4326)
                    ) as position_on_route,
                    ST_AsGeoJSON(
                        ST_ClosestPoint(
                            r.geom_forward,
                            ST_SetSRID(ST_MakePoint($1, $2), 4326)
                        )
                    ) as nearest_point_geojson
                FROM jeepney_routes r
                WHERE ST_DWithin(
                    r.geom_forward::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                    $3
                )
                ORDER BY distance_meters
                LIMIT 1
            )
            SELECT 
                route_id,
                route_code,
                start_point_name,
                end_point_name,
                distance_meters,
                position_on_route,
                nearest_point_geojson
            FROM route_distances;
        `;

        const result = await query(nearestQuery, [longitude, latitude, maxDistance]);

        if (!result || result.length === 0) {
            return NextResponse.json({
                found: false,
                original: { latitude, longitude },
                message: 'No route points found within maximum distance'
            });
        }

        const nearest = result[0];
        
        // Parse the nearest point coordinates
        let nearestLat = latitude;
        let nearestLng = longitude;
        try {
            const pointGeoJson = JSON.parse(nearest.nearest_point_geojson);
            if (pointGeoJson.type === 'Point' && pointGeoJson.coordinates) {
                nearestLng = pointGeoJson.coordinates[0];
                nearestLat = pointGeoJson.coordinates[1];
            }
        } catch (e) {
            console.error('Error parsing nearest point GeoJSON:', e);
        }

        return NextResponse.json({
            found: true,
            original: { latitude, longitude },
            nearest: {
                route_id: nearest.route_id,
                route_code: nearest.route_code,
                route_name: `${nearest.start_point_name} - ${nearest.end_point_name}`,
                latitude: nearestLat,
                longitude: nearestLng,
                distance: nearest.distance_meters,
                position_on_route: nearest.position_on_route
            },
            snapped: nearest.distance_meters < 15 // Snap if within 15 meters
        });

    } catch (error) {
        console.error('Error in nearest-point API:', error);
        return NextResponse.json(
            { error: 'Failed to find nearest point' },
            { status: 500 }
        );
    }
}