import { LatLng, MappedGeoRouteResult } from '@/types/GeoTypes';
import { GoogleMapsPolyline } from 'expo-maps/build/google/GoogleMaps.types';
import React, { createContext, ReactNode, useMemo, useState } from 'react';

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
    results: MappedGeoRouteResult[];
    setResults: (r: MappedGeoRouteResult[]) => void;
    selectedRouteIndex: number | null;
    setSelectedRouteIndex: (index: number | null) => void;
    isRouteFromList: boolean;
    setIsRouteFromList: (value: boolean) => void;
    selectedRouteInfo: { id: string; name: string } | null;
    setSelectedRouteInfo: (info: { id: string; name: string } | null) => void;
};

export const MapPointsContext = createContext<MapPointsContextType>({
    pointA: null,
    pointB: null,
    setPointA: () => { },
    setPointB: () => { },
    isPointAB: true,
    setIsPointAB: () => { },
    isPinPlacementEnabled: false,
    setIsPinPlacementEnabled: () => { },
    routes: [],
    setRoutes: () => { },
    allRoutes: [],
    setAllRoutes: () => { },
    results: [],
    setResults: () => { },
    selectedRouteIndex: null,
    setSelectedRouteIndex: () => { },
    isRouteFromList: false,
    setIsRouteFromList: () => { },
    selectedRouteInfo: null,
    setSelectedRouteInfo: () => { }
});

export const MapPointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pointA, setPointA] = useState<LatLng | null>(null);
    const [pointB, setPointB] = useState<LatLng | null>(null);
    const [isPointAB, setIsPointAB] = useState<boolean>(true);
    const [isPinPlacementEnabled, setIsPinPlacementEnabled] = useState<boolean>(false);
    const [routes, setRoutes] = useState<GoogleMapsPolyline[]>([]);
    const [allRoutes, setAllRoutes] = useState<GoogleMapsPolyline[]>([]);
    const [results, setResults] = useState<MappedGeoRouteResult[]>([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
    const [isRouteFromList, setIsRouteFromList] = useState<boolean>(false);
    const [selectedRouteInfo, setSelectedRouteInfo] = useState<{ id: string; name: string } | null>(null);

    const memoizedValue = useMemo(
        () => ({
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
            setSelectedRouteInfo
        }),
        [pointA, pointB, isPointAB, isPinPlacementEnabled, routes, allRoutes, results, selectedRouteIndex, isRouteFromList, selectedRouteInfo]
    );

    return (
        <MapPointsContext.Provider value={memoizedValue}>
            {children}
        </MapPointsContext.Provider>
    );
};

