export interface RouteRecord {
    id: string;
    route_code: string;
    start_point_name: string;
    end_point_name: string;
    horizontal_or_vertical_road?: string;
    forward_geojson?: unknown;
}

export type QueryResult<T = unknown> = T[];