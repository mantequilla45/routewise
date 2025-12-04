-- RUN THIS SQL IN YOUR SUPABASE SQL EDITOR
-- This creates the necessary functions for 2-jeep route calculations

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
        r.route_code as route_id,
        CONCAT(r.start_point_name, ' - ', r.end_point_name) as route_name,
        ST_ClosestPoint(r.geom_forward, ST_SetSRID(ST_MakePoint(lon, lat), 4326)) as closest_point,
        ST_Distance(
            r.geom_forward::geography,
            ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
        ) as distance_meters
    FROM jeepney_routes r
    WHERE ST_DWithin(
        r.geom_forward::geography,
        ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
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
DECLARE
    route1_geom geometry;
    route2_geom geometry;
    intersection_points geometry;
BEGIN
    -- Get the geometries for both routes
    SELECT geom_forward INTO route1_geom FROM jeepney_routes WHERE id = route1_id;
    SELECT geom_forward INTO route2_geom FROM jeepney_routes WHERE id = route2_id;
    
    -- Check if routes exist
    IF route1_geom IS NULL OR route2_geom IS NULL THEN
        RETURN;
    END IF;
    
    -- Find points where routes are close to each other
    -- We'll sample points along route1 and find close points on route2
    RETURN QUERY
    WITH sampled_points AS (
        SELECT 
            ST_LineInterpolatePoint(route1_geom, generate_series(0.0, 1.0, 0.01)) as point
    ),
    close_points AS (
        SELECT 
            sp.point,
            ST_ClosestPoint(route2_geom, sp.point) as closest,
            ST_Distance(sp.point::geography, ST_ClosestPoint(route2_geom, sp.point)::geography) as dist
        FROM sampled_points sp
        WHERE ST_Distance(sp.point::geography, route2_geom::geography) < max_distance
    )
    SELECT DISTINCT ON (ROUND(ST_Y(point)::numeric, 5), ROUND(ST_X(point)::numeric, 5))
        ST_Y(point)::FLOAT as latitude,
        ST_X(point)::FLOAT as longitude,
        dist::FLOAT as distance_meters
    FROM close_points
    ORDER BY ROUND(ST_Y(point)::numeric, 5), ROUND(ST_X(point)::numeric, 5), dist
    LIMIT 5;  -- Return up to 5 intersection points
END;
$$;

-- Function to calculate route segment for multi-route journey
CREATE OR REPLACE FUNCTION calculate_route_segment(
    route_id UUID,
    start_lat FLOAT,
    start_lon FLOAT,
    end_lat FLOAT,
    end_lon FLOAT,
    is_forward BOOLEAN DEFAULT true
)
RETURNS TABLE (
    segment_geojson TEXT,
    distance_meters FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
    route_geom geometry;
    start_fraction FLOAT;
    end_fraction FLOAT;
    segment geometry;
BEGIN
    -- Get the route geometry
    SELECT geom_forward INTO route_geom FROM jeepney_routes WHERE id = route_id;
    
    IF route_geom IS NULL THEN
        RETURN;
    END IF;
    
    -- Find the position of start and end points on the route
    start_fraction := ST_LineLocatePoint(route_geom, ST_SetSRID(ST_MakePoint(start_lon, start_lat), 4326));
    end_fraction := ST_LineLocatePoint(route_geom, ST_SetSRID(ST_MakePoint(end_lon, end_lat), 4326));
    
    -- Extract the segment
    IF is_forward AND start_fraction <= end_fraction THEN
        -- Simple forward segment
        segment := ST_LineSubstring(route_geom, start_fraction, end_fraction);
    ELSIF is_forward AND start_fraction > end_fraction THEN
        -- Need to go around (for closed loops)
        segment := ST_LineMerge(
            ST_Collect(
                ST_LineSubstring(route_geom, start_fraction, 1.0),
                ST_LineSubstring(route_geom, 0.0, end_fraction)
            )
        );
    ELSE
        -- Backward travel (not supported for now)
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        ST_AsGeoJSON(segment) as segment_geojson,
        ST_Length(segment::geography) as distance_meters;
END;
$$;

-- Test the functions after creating them
SELECT * FROM find_routes_containing_point(10.3, 123.9, 200) LIMIT 5;