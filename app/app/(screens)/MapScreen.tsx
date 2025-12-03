import MapModalContent from '@/components/Map/LocationSelector/SelectorContent';
import NativeMap, { NativeMapRef } from '@/components/Map/NativeMap';
import { MapPointsContext, MapPointsProvider } from '@/context/map-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function MapScreenContent() {
    const { isPinPlacementEnabled, setIsPinPlacementEnabled, isPointAB, setIsPointAB, pointA, pointB } = useContext(MapPointsContext);
    const [isSelectingLocations, setIsSelectingLocations] = useState(false) // Track if we're in location selection flow
    const mapRef = useRef<NativeMapRef>(null);
    const insets = useSafeAreaInsets();

    // Single animation value to control modal position (0 = visible, 600 = hidden)
    const modalPosition = useRef(new Animated.Value(0)).current;
    const indicatorOpacity = useRef(new Animated.Value(0)).current;

    // Helper functions for modal visibility
    const showModal = (callback?: () => void) => {
        Animated.parallel([
            Animated.spring(modalPosition, {
                toValue: 0,
                tension: 65,
                friction: 11,
                useNativeDriver: true,
            }),
            Animated.timing(indicatorOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start(callback);
    };

    const hideModal = (callback?: () => void) => {
        Animated.parallel([
            Animated.timing(modalPosition, {
                toValue: 600,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(indicatorOpacity, {
                toValue: 1,
                duration: 200,
                delay: 100,
                useNativeDriver: true,
            })
        ]).start(callback);
    };

    // Create pan responder for swipe down gesture
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only respond to vertical swipes
                return Math.abs(gestureState.dy) > 5 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
            },
            onPanResponderGrant: () => {
                // Set the initial value when gesture starts
                modalPosition.extractOffset();
            },
            onPanResponderMove: (_, gestureState) => {
                // Allow movement with some resistance at the top
                const translation = gestureState.dy < 0 ? gestureState.dy * 0.3 : gestureState.dy;
                modalPosition.setValue(translation);
            },
            onPanResponderRelease: (_, gestureState) => {
                modalPosition.flattenOffset();

                // If swiped down more than 100 pixels or with velocity, dismiss
                if (gestureState.dy > 100 || gestureState.vy > 0.3) {
                    hideModal();
                } else {
                    // Smooth snap back
                    showModal();
                }
            },
        })
    ).current;

    const handleConfirmLocation = () => {
        console.log('handleConfirmLocation called', { isPointAB, isSelectingLocations, isPinPlacementEnabled });

        if (mapRef.current) {
            // If we're in the selection flow
            if (isSelectingLocations) {
                if (isPointAB) {
                    // First location - set it and continue to destination
                    console.log('Setting first location, will continue to destination...');
                    mapRef.current.setLocationAtCenter();

                    // Immediately switch to destination selection
                    setIsPointAB(false);
                    // Stay in pin placement mode
                    setIsPinPlacementEnabled(true);
                } else {
                    // Second location - complete the flow
                    console.log('Setting destination, completing flow...');
                    mapRef.current.setLocationAtCenter();

                    // Exit pin placement and show modal
                    setIsSelectingLocations(false);
                    setIsPinPlacementEnabled(false);

                    // Animate modal back up
                    showModal();
                }
            } else {
                // Normal single location selection (not in flow)
                mapRef.current.setLocationAtCenter();
                setIsPinPlacementEnabled(false);
                showModal();
            }
        }
    };

    // Smooth transition to pin placement mode
    const enterPinPlacementMode = (isPointA: boolean) => {
        console.log('Starting location selection flow...');
        setIsSelectingLocations(true); // Mark that we're in selection flow

        // Animate modal down smoothly, then enable pin placement
        hideModal(() => {
            setIsPinPlacementEnabled(true);
            setIsPointAB(isPointA);
        });
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
                                setIsSelectingLocations(false);
                                setIsPinPlacementEnabled(false);
                                showModal();
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

            {/* Location selector - always rendered, controlled by animation */}
            <Animated.View
                {...panResponder.panHandlers}
                style={[
                    styles.locationSelector,
                    {
                        transform: [
                            {
                                translateY: modalPosition
                            }
                        ],
                        pointerEvents: isPinPlacementEnabled ? 'none' : 'auto'
                    }
                ]}>
                {/* Drag handle indicator */}
                <View style={styles.dragHandle} />
                <MapModalContent
                    exit={() => hideModal()}
                    setShowBottomSheet={(value) => value ? showModal() : hideModal()}
                    enterPinPlacementMode={enterPinPlacementMode}
                />
            </Animated.View>

            {/* Swipe up indicator - shown when modal is hidden */}
            <Animated.View
                style={[
                    styles.swipeUpIndicator,
                    {
                        opacity: indicatorOpacity,
                        pointerEvents: isPinPlacementEnabled ? 'none' : 'auto'
                    }
                ]}
            >
                <TouchableOpacity
                    onPress={() => showModal()}
                    activeOpacity={0.9}
                    style={{ width: '100%', alignItems: 'center' }}
                >
                    <View style={styles.dragHandle} />
                    <Text style={styles.swipeUpText}>Tap to select location</Text>
                </TouchableOpacity>
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
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#666',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 10,
        marginTop: -5,
    },
    swipeUpIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#303030',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingBottom: 15,
        alignItems: 'center',
        zIndex: 10,
        elevation: 10,
    },
    swipeUpText: {
        color: '#999',
        fontSize: 14,
        marginBottom: 5,
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
        bottom: 80,
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
