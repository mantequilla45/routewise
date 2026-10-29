export interface LatLng {
  latitude: number;
  longitude: number;
}

/** One jeep ride within a trip. */
export interface RouteSegmentInfo {
  routeId: string;
  routeCode: string;
  routeName: string;
  coordinates: LatLng[];
  distance: number; // meters ridden
  fare: number;
  boardAt?: LatLng;
  alightAt?: LatLng;
}

/** A trip option from POST /routes/calculate: one to three jeeps, fastest first. */
export interface TripOption {
  routeId: string;
  routeCode: string; // "10H → 62B" for transfers
  routeName: string;
  legs: RouteSegmentInfo[];
  isTransfer: boolean;
  coordinates: LatLng[]; // all legs combined
  distance: number; // meters ridden, all legs
  fare: number;
  totalFare: number;
  boardingWalk: number; // start pin -> first jeep, meters
  alightingWalk: number; // last jeep -> destination pin, meters
  transferWalks: number[]; // between jeeps, meters
  /** Estimated door-to-door minutes (walk + ride + transfer waits). */
  estimatedMinutes: number;
  // Two-jeep trips also carry these (used when saving a route)
  firstRoute?: RouteSegmentInfo;
  secondRoute?: RouteSegmentInfo;
  transferPoint?: LatLng;
}
