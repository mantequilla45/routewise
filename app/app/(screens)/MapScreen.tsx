import MapModalContent from '@/components/Map/LocationSelector/SelectorContent';
import NativeMap, { NativeMapRef } from '@/components/Map/NativeMap';
import { MapPointsContext, MapPointsProvider } from '@/context/map-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function MapScreenContent() {
    const { isPinPlacementEnabled, setIsPinPlacementEnabled, isPointAB, pointA, pointB } = useContext(MapPointsContext);
    const [showBottomSheet, setShowBottomSheet] = useState(true)
    const [prevPinPlacement, setPrevPinPlacement] = useState(false)
    const [isSnapping, setIsSnapping] = useState(false)
    const mapRef = useRef<NativeMapRef>(null);
    const insets = useSafeAreaInsets();
    const animatedHeight = useRef(new Animated.Value(1)).current;

    // Animate minimize/maximize based on pin placement
    useEffect(() => {
        Animated.timing(animatedHeight, {
            toValue: isPinPlacementEnabled ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
        
        setPrevPinPlacement(isPinPlacementEnabled);
    }, [isPinPlacementEnabled]);


    const handleConfirmLocation = () => {
        if (mapRef.current) {
            mapRef.current.setLocationAtCenter();
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* Map in background, takes full screen */}
            <View style={styles.mapContainer}>
                <NativeMap ref={mapRef} />
            </View>

            {/* Pin placement mode indicator */}
            {isPinPlacementEnabled && (
                <View style={styles.pinPlacementIndicator}>
                    <View style={styles.pinPlacementContent}>
                        <Ionicons name="location" size={24} color="#007AFF" />
                        <Text style={styles.pinPlacementText}>
                            Move map to position crosshair at {isPointAB ?
                                (!pointA ? 'starting point' : 'starting point (updating)') :
                                (!pointB ? 'destination' : 'destination (updating)')}
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                setIsPinPlacementEnabled(false);
                                setShowBottomSheet(true);
                            }}
                            style={styles.cancelButton}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Crosshair in center of map */}
                    <View style={styles.crosshairContainer}>
                        <View style={styles.crosshairVertical} />
                        <View style={styles.crosshairHorizontal} />
                        <View style={styles.crosshairCenter} />
                    </View>

                    {/* Confirm button at the bottom */}
                    <TouchableOpacity
                        style={styles.confirmLocationButton}
                        onPress={handleConfirmLocation}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="checkmark-circle" size={32} color="white" />
                        <Text style={styles.confirmLocationText}>
                            Confirm {isPointAB ? 'Starting Point' : 'Destination'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Location selector at bottom, above tabs */}
            <Animated.View style={[
                styles.locationSelector,
                {
                    transform: [{
                        translateY: animatedHeight.interpolate({
                            inputRange: [0, 1],
                            outputRange: [500, 0] // Slide down when minimized
                        })
                    }],
                    opacity: animatedHeight
                }
            ]}>
                <MapModalContent exit={() => setShowBottomSheet(false)} setShowBottomSheet={setShowBottomSheet} />
            </Animated.View>
        </View>
    );
}

export default function MapScreen() {
    return (
        <MapPointsProvider>
            <MapScreenContent></MapScreenContent>
        </MapPointsProvider>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mapContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0, // Ensure map is in background
    },
    locationSelector: {
        position: 'absolute',
        bottom: 0, // Sit at bottom, let content push it up
        left: 0,
        right: 0,
        backgroundColor: '#303030',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 20, // Add padding for tab bar
        zIndex: 10, // Above map
        elevation: 10, // For Android
    },
    pinPlacementIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'box-none',
    },
    pinPlacementContent: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        gap: 12,
        zIndex: 100,
    },
    pinPlacementText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontFamily: 'Lexend_400Regular',
    },
    cancelButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 14,
        fontFamily: 'Lexend_500Medium',
    },
    crosshairContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 40,
        height: 40,
        marginTop: -20,
        marginLeft: -20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    crosshairVertical: {
        position: 'absolute',
        width: 2,
        height: 40,
        backgroundColor: '#007AFF',
        opacity: 0.8,
    },
    crosshairHorizontal: {
        position: 'absolute',
        width: 40,
        height: 2,
        backgroundColor: '#007AFF',
        opacity: 0.8,
    },
    crosshairCenter: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#007AFF',
        borderWidth: 2,
        borderColor: 'white',
    },
    confirmLocationButton: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        left: 20,
        right: 20,
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    confirmLocationText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Lexend_600SemiBold',
    },
    confirmLocationButtonDisabled: {
        backgroundColor: '#9E9E9E',
        opacity: 0.7,
    },
});
