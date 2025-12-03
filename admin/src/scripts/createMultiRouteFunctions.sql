-- Function to find routes containing a point within a certain distance
CREATE OR REPLACE FUNCTION find_routes_containing_point(
    lat FLOAT,
    lon FLOAT,
    max_distance FLOAT DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    route_id TEXT,
    route_name TEXT,
    closest_point geometry(Point, 4326),
    distance_meters FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (r.id)
        r.id,
        r.route_id,
        r.route_name,
        ST_ClosestPoint(r.coordinates::geometry, ST_SetSRID(ST_MakePoint(lon, lat), 4326)) as closest_point,
        ST_Distance(
            ST_Transform(r.coordinates::geometry, 3857),
            ST_Transform(ST_SetSRID(ST_MakePoint(lon, lat), 4326), 3857)
        ) as distance_meters
    FROM routes r
    WHERE ST_DWithin(
        ST_Transform(r.coordinates::geometry, 3857),
        ST_Transform(ST_SetSRID(ST_MakePoint(lon, lat), 4326), 3857),
        max_distance
    )
    ORDER BY r.id, distance_meters;
END;
$$;

-- Function to find intersection points between two routes
CREATE OR REPLACE FUNCTION find_route_intersections(
    route1_id UUID,
    route2_id UUID,
    max_distance FLOAT DEFAULT 50
)
RETURNS TABLE (
    latitude FLOAT,
    longitude FLOAT,
    distance_meters FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH route1_points AS (
        SELECT (ST_DumpPoints(coordinates::geometry)).geom AS point
        FROM routes
        WHERE id = route1_id
    ),
    route2 AS (
        SELECT coordinates::geometry AS line
        FROM routes
        WHERE id = route2_id
    )
    SELECT 
        ST_Y(rp.point) AS latitude,
        ST_X(rp.point) AS longitude,
        ST_Distance(
            ST_Transform(rp.point, 3857),
            ST_Transform(ST_ClosestPoint(r2.line, rp.point), 3857)
        ) AS distance_meters
    FROM route1_points rp
    CROSS JOIN route2 r2
    WHERE ST_DWithin(
        ST_Transform(rp.point, 3857),
        ST_Transform(r2.line, 3857),
        max_distance
    )
    ORDER BY distance_meters
    LIMIT 5;
END;
$$;

-- Function to get a segment of a route between two points
CREATE OR REPLACE FUNCTION get_route_segment(
    route_id UUID,
    start_lat FLOAT,
    start_lon FLOAT,
    end_lat FLOAT,
    end_lon FLOAT
)
RETURNS TABLE (
    coordinates JSON,
    distance_meters FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
    route_line geometry;
    start_point geometry;
    end_point geometry;
    start_fraction FLOAT;
    end_fraction FLOAT;
    segment geometry;
    segment_coords JSON;
    segment_distance FLOAT;
BEGIN
    -- Get the route geometry
    SELECT coordinates::geometry INTO route_line
    FROM routes
    WHERE id = route_id;
    
    -- Create points
    start_point := ST_SetSRID(ST_MakePoint(start_lon, start_lat), 4326);
    end_point := ST_SetSRID(ST_MakePoint(end_lon, end_lat), 4326);
    
    -- Find closest points on the route
    start_fraction := ST_LineLocatePoint(route_line, ST_ClosestPoint(route_line, start_point));
    end_fraction := ST_LineLocatePoint(route_line, ST_ClosestPoint(route_line, end_point));
    
    -- Ensure we go in the forward direction
    IF end_fraction < start_fraction THEN
        -- For one-way routes, we might need to go around
        -- This is simplified - in production you'd handle this based on route type
        RETURN QUERY SELECT NULL::JSON, 0::FLOAT;
        RETURN;
    END IF;
    
    -- Extract the segment
    segment := ST_LineSubstring(route_line, start_fraction, end_fraction);
    
    -- Convert to JSON coordinates
    segment_coords := json_build_array(
        json_agg(
            json_build_object(
                'latitude', ST_Y((dp).geom),
                'longitude', ST_X((dp).geom)
            )
        )
    )
    FROM ST_DumpPoints(segment) AS dp;
    
    -- Calculate distance
    segment_distance := ST_Length(ST_Transform(segment, 3857));
    
    RETURN QUERY SELECT segment_coords, segment_distance;
END;
$$;