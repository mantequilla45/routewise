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
    results: MappedGeoRouteResult[];
    setResults: (r: MappedGeoRouteResult[]) => void;
    selectedRouteIndex: number | null;
    setSelectedRouteIndex: (index: number | null) => void;
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
    results: [],
    setResults: () => { },
    selectedRouteIndex: null,
    setSelectedRouteIndex: () => { }
});

export const MapPointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pointA, setPointA] = useState<LatLng | null>(null);
    const [pointB, setPointB] = useState<LatLng | null>(null);
    const [isPointAB, setIsPointAB] = useState<boolean>(true);
    const [isPinPlacementEnabled, setIsPinPlacementEnabled] = useState<boolean>(false);
    const [routes, setRoutes] = useState<GoogleMapsPolyline[]>([]);
    const [results, setResults] = useState<MappedGeoRouteResult[]>([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);

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
            results,
            setResults,
            selectedRouteIndex,
            setSelectedRouteIndex
        }),
        [pointA, pointB, isPointAB, isPinPlacementEnabled, routes, results, selectedRouteIndex]
    );

    return (
        <MapPointsContext.Provider value={memoizedValue}>
            {children}
        </MapPointsContext.Provider>
    );
};

