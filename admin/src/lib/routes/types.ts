export interface Coordinate {
  lat: number;
  lng: number;
  label?: string;
}

/** GeoJSON-style [longitude, latitude] pair. */
export type LngLatPair = [number, number];

export interface Contribution {
  id: string;
  route_code: string;
  contributor_name: string;
  contributor_email?: string;
  forward_geojson: {
    type: string;
    coordinates: LngLatPair[];
  };
  status: string;
  created_at: string;
  review_notes?: string;
}

export type ReviewAction = 'approve' | 'reject';

export type RouteManagementTab = 'add' | 'list' | 'review';
