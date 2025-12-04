-- Function to get route for display with coordinates as JSON array
CREATE OR REPLACE FUNCTION get_route_for_display(route_uuid UUID)
RETURNS TABLE (
    id UUID,
    route_id TEXT,
    route_name TEXT,
    route_color TEXT,
    coordinates JSON
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.route_id,
        r.route_name,
        r.route_color,
        json_agg(
            json_build_object(
                'latitude', ST_Y((dp).geom),
                'longitude', ST_X((dp).geom)
            ) ORDER BY (dp).path
        ) AS coordinates
    FROM 
        routes r,
        LATERAL ST_DumpPoints(r.coordinates::geometry) AS dp
    WHERE 
        r.id = route_uuid
    GROUP BY 
        r.id, r.route_id, r.route_name, r.route_color;
END;
$$;