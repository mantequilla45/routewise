export interface LatLng {
    latitude: number;
    longitude: number;
}

export interface RouteSnap {
  id: string;
  route_code: string;
  start_point_name: string;
  end_point_name: string;
  distance_forward: number;
  distance_reverse: number;
  snapped_forward_lon: number;
  snapped_forward_lat: number;
  snapped_reverse_lon: number;
  snapped_reverse_lat: number;
};