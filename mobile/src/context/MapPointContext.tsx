import React, { createContext, useState, useMemo, ReactNode } from 'react';

// Define our own LatLng type instead of using react-native-maps
export interface LatLng {
    latitude: number;
    longitude: number;
}

type MapPointsContextType = {
    pointA: LatLng | null;
    pointB: LatLng | null;
    setPointA: (p: LatLng | null) => void;
    setPointB: (p: LatLng | null) => void;
    isPointAB: boolean;
    setIsPointAB: (value: boolean) => void;
    isPinPlacementEnabled: boolean;
    setIsPinPlacementEnabled: (value: boolean) => void;
};

// default values
export const MapPointsContext = createContext<MapPointsContextType>({
    pointA: null,
    pointB: null,
    setPointA: () => { },
    setPointB: () => { },
    isPointAB: true,
    setIsPointAB: () => { },
    isPinPlacementEnabled: false,
    setIsPinPlacementEnabled: () => { }
});

export const MapPointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pointA, setPointA] = useState<LatLng | null>(null);
    const [pointB, setPointB] = useState<LatLng | null>(null);
    const [isPointAB, setIsPointAB] = useState<boolean>(true);
    const [isPinPlacementEnabled, setIsPinPlacementEnabled] = useState<boolean>(false);

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
        }),
        [pointA, pointB, isPointAB, isPinPlacementEnabled]
    );

    return (
        <MapPointsContext.Provider value={memoizedValue}>
            {children}
        </MapPointsContext.Provider>
    );
};
