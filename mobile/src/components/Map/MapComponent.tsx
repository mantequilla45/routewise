import React, { useContext, useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { MapPressEvent, Marker, Region } from 'react-native-maps';
import { MapPointsContext } from '../../context/MapPointContext';

export const MapComponent = () => {
    const [region, setRegion] = useState<Region>({
        latitude: 10.2,
        longitude: 123.9,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
    });

    const { pointA, pointB, setPointA, setPointB, isPointAB, isPinPlacementEnabled } = useContext(MapPointsContext);

    useEffect(() => {
        console.log("Pin placement changed:", isPinPlacementEnabled);
    }, [isPinPlacementEnabled]);

    const handleMapPress = (e: MapPressEvent) => {
        console.log(isPinPlacementEnabled)
        if (isPinPlacementEnabled) {
            const { coordinate } = e.nativeEvent;
            if (isPointAB) {
                setPointA(coordinate);
            }
            else {
                setPointB(coordinate);
            }
        }
    };

    const handleRegionChangeComplete = (newRegion: Region) => {
        const baseMinLat = 9.8;
        const baseMaxLat = 11.3;
        const baseMinLng = 123.4;
        const baseMaxLng = 124.1;

        const marginLat = 0.135;
        const marginLng = 0.138;

        const minLat = baseMinLat - marginLat;
        const maxLat = baseMaxLat + marginLat;
        const minLng = baseMinLng - marginLng;
        const maxLng = baseMaxLng + marginLng;

        let clampedLat = Math.min(Math.max(newRegion.latitude, minLat), maxLat);
        let clampedLng = Math.min(Math.max(newRegion.longitude, minLng), maxLng);

        if (
            clampedLat !== newRegion.latitude ||
            clampedLng !== newRegion.longitude
        ) {
            setRegion({
                ...region,
                latitude: clampedLat,
                longitude: clampedLng,
            });
        } else {
            setRegion(newRegion);
        }
    };

    return (
        <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={handleRegionChangeComplete}
            onPress={handleMapPress}
        >
            {pointA && (
                <Marker
                    coordinate={pointA}
                    title="Pin A"
                    description={`Lat: ${pointA.latitude.toFixed(5)}, Lng: ${pointA.longitude.toFixed(5)}`}
                    pinColor='#FFCC66'
                />
            )}
            {pointB && (
                <Marker
                    coordinate={pointB}
                    title="Pin B"
                    description={`Lat: ${pointB.latitude.toFixed(5)}, Lng: ${pointB.longitude.toFixed(5)}`}
                    pinColor='#343C3E'
                />
            )}
        </MapView>
    );
};

const styles = StyleSheet.create({
    map: { flex: 1 },
});