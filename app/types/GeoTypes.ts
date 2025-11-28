export interface LatLng {
    latitude: number;
    longitude: number;
}

export interface MappedGeoRouteResult {
  routeId: string;
  distanceMeters: number;
  latLng: LatLng[];
  fare: number;
  startingPoint: string;
  endPoint: string;
  shouldCrossRoad?: boolean;
  message?: string;
}