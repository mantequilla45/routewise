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
    const [showBottomSheet, setShowBottomSheet] = useState(true)
    const [prevPinPlacement, setPrevPinPlacement] = useState(false)
    const [isSnapping, setIsSnapping] = useState(false)
    const [isSelectingLocations, setIsSelectingLocations] = useState(false) // Track if we're in location selection flow
    const [isAnimatingOut, setIsAnimatingOut] = useState(false) // Track animation state
    const mapRef = useRef<NativeMapRef>(null);
    const insets = useSafeAreaInsets();
    const animatedHeight = useRef(new Animated.Value(1)).current;
    const swipeTranslateY = useRef(new Animated.Value(0)).current; // Start at visible position
    const modalOpacity = useRef(new Animated.Value(1)).current;
    const indicatorTranslateY = useRef(new Animated.Value(100)).current;

    // Smooth animation when showing/hiding bottom sheet
    useEffect(() => {
        if (showBottomSheet && !isAnimatingOut) {
            // Animate modal in from bottom
            Animated.parallel([
                Animated.spring(swipeTranslateY, {
                    toValue: 0,
                    tension: 65,
                    friction: 11,
                    useNativeDriver: true,
                }),
                Animated.timing(modalOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(indicatorTranslateY, {
                    toValue: 100,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();
        } else if (!showBottomSheet && !isAnimatingOut) {
            // Show indicator when modal is hidden
            Animated.spring(indicatorTranslateY, {
                toValue: 0,
                tension: 65,
                friction: 11,
                useNativeDriver: true,
            }).start();
        }
    }, [showBottomSheet, isAnimatingOut]);

    // Animate minimize/maximize based on pin placement
    useEffect(() => {
        Animated.timing(animatedHeight, {
            toValue: isPinPlacementEnabled ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
        
        setPrevPinPlacement(isPinPlacementEnabled);
    }, [isPinPlacementEnabled]);

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
                swipeTranslateY.setOffset(swipeTranslateY._value);
                swipeTranslateY.setValue(0);
            },
            onPanResponderMove: (_, gestureState) => {
                // Allow movement with some resistance at the top
                const translation = gestureState.dy < 0 ? gestureState.dy * 0.3 : gestureState.dy;
                swipeTranslateY.setValue(translation);
                
                // Fade out as we swipe down
                const opacity = Math.max(0, Math.min(1, 1 - (gestureState.dy / 400)));
                modalOpacity.setValue(opacity);
            },
            onPanResponderRelease: (_, gestureState) => {
                swipeTranslateY.flattenOffset();
                
                // If swiped down more than 100 pixels or with velocity, dismiss
                if (gestureState.dy > 100 || gestureState.vy > 0.3) {
                    Animated.parallel([
                        Animated.timing(swipeTranslateY, {
                            toValue: 600,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                        Animated.timing(modalOpacity, {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: true,
                        })
                    ]).start(() => {
                        setShowBottomSheet(false);
                    });
                } else {
                    // Smooth snap back
                    Animated.parallel([
                        Animated.spring(swipeTranslateY, {
                            toValue: 0,
                            tension: 65,
                            friction: 11,
                            useNativeDriver: true,
                        }),
                        Animated.timing(modalOpacity, {
                            toValue: 1,
                            duration: 200,
                            useNativeDriver: true,
                        })
                    ]).start();
                }
            },
        })
    ).current;

    // Pan responder for swipe up gesture
    const swipeUpPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only respond to significant upward swipes
                return gestureState.dy < -10 && Math.abs(gestureState.dx) < 20;
            },
            onPanResponderRelease: (_, gestureState) => {
                // If swiped up, show the location selector
                if (gestureState.dy < -50 || gestureState.vy < -0.5) {
                    setShowBottomSheet(true);
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
                    // First location - don't exit pin placement
                    console.log('Setting first location, will continue to destination...');
                    mapRef.current.setLocationAtCenter();
                    
                    // Continue to destination selection after a brief delay
                    setTimeout(() => {
                        console.log('Switching to destination selection');
                        console.log('Current states before switch:', { isPinPlacementEnabled, isSelectingLocations });
                        setIsPointAB(false); // Now select destination
                        // Ensure we stay in pin placement mode
                        setIsPinPlacementEnabled(true);
                        console.log('Should now be selecting destination...');
                    }, 500);
                } else {
                    // Second location - complete the flow
                    console.log('Setting destination, completing flow...');
                    mapRef.current.setLocationAtCenter();
                    
                    // Delay to allow the location to be set
                    setTimeout(() => {
                        setIsSelectingLocations(false);
                        setIsPinPlacementEnabled(false);
                        // Don't set showBottomSheet immediately - let the animation handle it
                        
                        // Start animation to show modal
                        swipeTranslateY.setValue(600);
                        modalOpacity.setValue(0);
                        setShowBottomSheet(true);
                    }, 300);
                }
            } else {
                // Normal single location selection (not in flow)
                mapRef.current.setLocationAtCenter();
                setIsPinPlacementEnabled(false);
                setShowBottomSheet(true);
            }
        }
    };

    // Smooth transition to pin placement mode
    const enterPinPlacementMode = (isPointA: boolean) => {
        console.log('Starting location selection flow...');
        setIsSelectingLocations(true); // Mark that we're in selection flow
        setIsAnimatingOut(true); // Mark that we're animating
        
        // Animate modal out smoothly (same as swipe down)
        Animated.parallel([
            Animated.timing(swipeTranslateY, {
                toValue: 600,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(modalOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => {
            // Only hide after animation completes
            setShowBottomSheet(false);
            setIsAnimatingOut(false);
            setIsPinPlacementEnabled(true);
            setIsPointAB(isPointA);
            // Reset animation values for next time
            swipeTranslateY.setValue(0);
            modalOpacity.setValue(1);
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

            {/* Location selector - always rendered, controlled by animation */}
            <Animated.View 
                {...panResponder.panHandlers}
                style={[
                    styles.locationSelector,
                    {
                        transform: [
                            {
                                translateY: swipeTranslateY
                            }
                        ],
                        opacity: modalOpacity,
                        pointerEvents: (showBottomSheet && !isPinPlacementEnabled) ? 'auto' : 'none'
                    }
                ]}>
                {/* Drag handle indicator */}
                <View style={styles.dragHandle} />
                <MapModalContent 
                    exit={() => setShowBottomSheet(false)} 
                    setShowBottomSheet={setShowBottomSheet}
                    enterPinPlacementMode={enterPinPlacementMode}
                />
            </Animated.View>
            
            {/* Swipe up indicator - always rendered but animated in/out */}
            {!isPinPlacementEnabled && (
                <Animated.View 
                    style={[
                        styles.swipeUpIndicator,
                        {
                            transform: [{
                                translateY: indicatorTranslateY
                            }]
                        }
                    ]}
                >
                    <TouchableOpacity 
                        {...swipeUpPanResponder.panHandlers}
                        onPress={() => setShowBottomSheet(true)}
                        activeOpacity={0.9}
                        style={{ width: '100%', alignItems: 'center' }}
                    >
                        <View style={styles.dragHandle} />
                        <Text style={styles.swipeUpText}>Tap to select location</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
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
