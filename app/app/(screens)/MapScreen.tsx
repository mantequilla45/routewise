import MapModalContent from '@/components/Map/LocationSelector/SelectorContent';
import NativeMap, { NativeMapRef } from '@/components/Map/NativeMap';
import SwipeModal from '@/components/SwipeModal';
import { MapPointsContext, MapPointsProvider } from '@/context/map-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function MapScreenContent() {
    const { isPinPlacementEnabled, setIsPinPlacementEnabled, isPointAB, pointA, pointB } = useContext(MapPointsContext);
    const [showBottomSheet, setShowBottomSheet] = useState(true)
    const [prevPinPlacement, setPrevPinPlacement] = useState(false)
    const mapRef = useRef<NativeMapRef>(null);

    // Auto-reopen modal after location selection
    useEffect(() => {
        if (prevPinPlacement && !isPinPlacementEnabled) {
            // Pin placement just finished, reopen the modal
            setTimeout(() => {
                setShowBottomSheet(true);
            }, 300);
        }
        setPrevPinPlacement(isPinPlacementEnabled);
    }, [isPinPlacementEnabled, prevPinPlacement]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: (_, g) => {
                return Math.abs(g.dy) > 10 && g.dy < 0;
            },

            onMoveShouldSetPanResponder: (_, g) => {
                return Math.abs(g.dy) > 10 && g.dy < 0;
            },

            onPanResponderRelease: (_, g) => {
                if (g.dy < -50) {
                    setShowBottomSheet(true);
                }
            }
        })
    ).current;

    const handleConfirmLocation = () => {
        if (mapRef.current) {
            mapRef.current.setLocationAtCenter();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <NativeMap ref={mapRef} />
            
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
            
            <View
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "20%",
                }}
                {...panResponder.panHandlers}
            />
            {!isPinPlacementEnabled && (
                <TouchableOpacity
                    style={styles.arrowButton}
                    onPress={() => setShowBottomSheet(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="chevron-up" size={24} color="#303030" />
                </TouchableOpacity>
            )}
            <SwipeModal
                isVisible={showBottomSheet}
                onClose={() => setShowBottomSheet(false)}
                height={'80%'}
            >
                <MapModalContent exit={() => setShowBottomSheet(false)} setShowBottomSheet={setShowBottomSheet}></MapModalContent>
            </SwipeModal>
        </SafeAreaView>
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
        backgroundColor: '#F9F9F9',
        position: 'relative',
    },
    arrowButton: {
        position: 'absolute',
        bottom: 140,
        alignSelf: 'center',
        backgroundColor: '#FFCC66',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
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
        bottom: 120,
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
});
