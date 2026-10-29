import { LatLng, TripOption } from '@/types/GeoTypes';
import type { GoogleMaps } from 'expo-maps';
import React, { createContext, ReactNode, useMemo, useState } from 'react';

// expo-maps no longer exports its type files directly; derive the polyline type from the map props.
export type GoogleMapsPolyline = NonNullable<GoogleMaps.MapProps['polylines']>[number];

type MapPointsContextType = {
  pointA: LatLng | null;
  pointB: LatLng | null;
  setPointA: (p: LatLng | null) => void;
  setPointB: (p: LatLng | null) => void;
  isPointAB: boolean;
  setIsPointAB: (value: boolean) => void;
  isPinPlacementEnabled: boolean;
  setIsPinPlacementEnabled: (value: boolean) => void;
  routes: GoogleMapsPolyline[];
  setRoutes: (p: GoogleMapsPolyline[]) => void;
  allRoutes: GoogleMapsPolyline[];
  setAllRoutes: (p: GoogleMapsPolyline[]) => void;
  results: TripOption[];
  setResults: (r: TripOption[]) => void;
  selectedRouteIndex: number | null;
  setSelectedRouteIndex: (index: number | null) => void;
  isRouteFromList: boolean;
  setIsRouteFromList: (value: boolean) => void;
  selectedRouteInfo: { id: string; name: string } | null;
  setSelectedRouteInfo: (info: { id: string; name: string } | null) => void;
  /** Clear points, results and drawn routes, so the next trip or route starts clean. */
  resetTrip: () => void;
};

export const MapPointsContext = createContext<MapPointsContextType>({
  pointA: null,
  pointB: null,
  setPointA: () => {},
  setPointB: () => {},
  isPointAB: true,
  setIsPointAB: () => {},
  isPinPlacementEnabled: false,
  setIsPinPlacementEnabled: () => {},
  routes: [],
  setRoutes: () => {},
  allRoutes: [],
  setAllRoutes: () => {},
  results: [],
  setResults: () => {},
  selectedRouteIndex: null,
  setSelectedRouteIndex: () => {},
  isRouteFromList: false,
  setIsRouteFromList: () => {},
  selectedRouteInfo: null,
  setSelectedRouteInfo: () => {},
  resetTrip: () => {},
});

export const MapPointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pointA, setPointA] = useState<LatLng | null>(null);
  const [pointB, setPointB] = useState<LatLng | null>(null);
  const [isPointAB, setIsPointAB] = useState<boolean>(true);
  const [isPinPlacementEnabled, setIsPinPlacementEnabled] = useState<boolean>(false);
  const [routes, setRoutes] = useState<GoogleMapsPolyline[]>([]);
  const [allRoutes, setAllRoutes] = useState<GoogleMapsPolyline[]>([]);
  const [results, setResults] = useState<TripOption[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
  const [isRouteFromList, setIsRouteFromList] = useState<boolean>(false);
  const [selectedRouteInfo, setSelectedRouteInfo] = useState<{ id: string; name: string } | null>(
    null,
  );

  const memoizedValue = useMemo(() => {
    const resetTrip = () => {
      setResults([]);
      setRoutes([]);
      setAllRoutes([]);
      setSelectedRouteIndex(null);
      setSelectedRouteInfo(null);
      setIsRouteFromList(false);
      setIsPinPlacementEnabled(false);
      setPointA(null);
      setPointB(null);
    };
    return {
      pointA,
      pointB,
      setPointA,
      setPointB,
      isPointAB,
      setIsPointAB,
      isPinPlacementEnabled,
      setIsPinPlacementEnabled,
      routes,
      setRoutes,
      allRoutes,
      setAllRoutes,
      results,
      setResults,
      selectedRouteIndex,
      setSelectedRouteIndex,
      isRouteFromList,
      setIsRouteFromList,
      selectedRouteInfo,
      setSelectedRouteInfo,
      resetTrip,
    };
  }, [
    pointA,
    pointB,
    isPointAB,
    isPinPlacementEnabled,
    routes,
    allRoutes,
    results,
    selectedRouteIndex,
    isRouteFromList,
    selectedRouteInfo,
  ]);

  return <MapPointsContext.Provider value={memoizedValue}>{children}</MapPointsContext.Provider>;
};
