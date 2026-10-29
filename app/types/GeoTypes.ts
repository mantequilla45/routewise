export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RouteSegmentInfo {
  routeId: string;
  routeCode: string;
  routeName: string;
  coordinates: LatLng[];
  distance: number;
  fare: number;
  startPosition?: number;
  endPosition?: number;
}

export interface MappedGeoRouteResult {
  routeId: string;
  distanceMeters?: number;
  distance?: number;
  latLng?: LatLng[];
  coordinates?: LatLng[];
  fare: number;
  totalFare?: number;
  startingPoint?: string;
  endPoint?: string;
  shouldCrossRoad?: boolean;
  message?: string;

  // Route calculation properties
  routeCode?: string;
  routeName?: string;
  caseName?: string;
  isTransfer?: boolean;
  firstRoute?: RouteSegmentInfo;
  secondRoute?: RouteSegmentInfo;
  transferPoint?: LatLng;
  requiresLoop?: boolean;
  optimized?: boolean;
  boardingWalk?: number;
  alightingWalk?: number;
  /** Estimated door-to-door minutes (walk + ride), computed by the backend. */
  estimatedMinutes?: number;
  debugInfo?: Record<string, unknown>;
}
