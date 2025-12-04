import { calculatePossibleRoutes } from "@/app/services/routes/calculatePossibleRoutes";
import { MapPointsContext } from "@/context/map-context";
import { latLongStringifier } from "@/lib/util/latLngStringifier";
import { Ionicons } from "@expo/vector-icons";
import { GoogleMapsPolyline } from "expo-maps/build/google/GoogleMaps.types";
import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import RouteCard from "./RouteCard";

export default function MapModalContent({ exit, setShowBottomSheet, enterPinPlacementMode, hideModal }: Readonly<{ exit: () => void, setShowBottomSheet: (value: boolean) => void, enterPinPlacementMode?: (isPointA: boolean) => void, hideModal?: () => void }>) {
    const { setIsPointAB, setIsPinPlacementEnabled, pointA, pointB, setPointA, setPointB, setRoutes, allRoutes, setAllRoutes, results, setResults, isPinPlacementEnabled, selectedRouteIndex, setSelectedRouteIndex, setSelectedRouteInfo } = useContext(MapPointsContext)
    const [wasSelectingFirstLocation, setWasSelectingFirstLocation] = useState(false)
    const [isCalculating, setIsCalculating] = useState(false)

    // Auto-open second location selection after first location is selected
    useEffect(() => {
        if (wasSelectingFirstLocation && pointA && !isPinPlacementEnabled) {
            // First location was just selected, now open second location selection
            setWasSelectingFirstLocation(false);
            setTimeout(() => {
                setIsPinPlacementEnabled(true);
                setIsPointAB(false);
                setShowBottomSheet(false);
            }, 100);
        }
    }, [pointA, isPinPlacementEnabled, wasSelectingFirstLocation]);

    // Monitor allRoutes changes
    useEffect(() => {
        console.log(`allRoutes updated: now contains ${allRoutes.length} polylines`);
        if (allRoutes.length > 0) {
            console.log(`allRoutes polyline IDs:`, allRoutes.map(r => r.id || 'no-id'));
        }
    }, [allRoutes]);

    // Handle route selection
    const handleRouteSelect = (index: number) => {
        console.log(`Route card clicked: index ${index}, current selected: ${selectedRouteIndex}`);
        console.log(`Current allRoutes array length: ${allRoutes.length}`);

        // Find the corresponding route in results
        const selectedResult: any = results[index];
        if (!selectedResult) {
            console.warn(`No result found at index ${index}`);
            return;
        }

        setSelectedRouteIndex(index);
        
        // Set the route info to display in header
        setSelectedRouteInfo({
            id: selectedResult.routeId,
            name: selectedResult.routeName || selectedResult.routeId
        });

        // Check if it's a transfer route
        if ('isTransfer' in selectedResult && selectedResult.isTransfer) {
            // Find polylines for both segments
            const polylinesToShow = allRoutes.filter(r =>
                r.id && r.id.startsWith(`route_${index}_`)
            );

            console.log(`Selected transfer route ${index}: ${selectedResult.routeId}, showing ${polylinesToShow.length} polylines`);
            setRoutes(polylinesToShow);
        } else {
            // Single route - find the matching polyline
            const polylineToShow = allRoutes.find(r => r.id === `route_${index}`);
            if (polylineToShow) {
                console.log(`Selected single route ${index}: ${selectedResult.routeId}`);
                setRoutes([polylineToShow]);
            } else {
                console.warn(`No polyline found for route ${selectedResult.routeId} at index ${index}`);
                setRoutes([]);
            }
        }
        
        // Hide the modal smoothly after selecting a route
        if (hideModal) {
            hideModal();
        } else {
            setShowBottomSheet(false);
        }
    };

    const onCalculate = async () => {
        try {
            if (!pointA || !pointB) {
                console.warn("Both points must be set");
                return;
            }

            setIsCalculating(true);
            const routes = await calculatePossibleRoutes(pointA, pointB);

            if (Array.isArray(routes) && routes.length > 0) {
                setResults(routes);

                // Build polylines for ALL routes to maintain consistent indexing
                const googlePolylineRoutes: GoogleMapsPolyline[] = [];

                routes.forEach((r: any, resultIndex) => {
                    // Check if it's a transfer route by checking for the isTransfer property
                    const isTransfer = 'isTransfer' in r && r.isTransfer === true;

                    if (isTransfer && r.firstRoute && r.secondRoute) {
                        // Create two polylines for transfer routes with different colors
                        if (r.firstRoute.coordinates && r.firstRoute.coordinates.length > 0) {
                            const firstPolyline: GoogleMapsPolyline = {
                                id: `route_${resultIndex}_first`,
                                coordinates: r.firstRoute.coordinates.map((coord: any) => ({
                                    latitude: coord.latitude,
                                    longitude: coord.longitude
                                })),
                                color: '#4CAF50', // Green for first segment
                                width: 16,
                                geodesic: true
                            };
                            googlePolylineRoutes.push(firstPolyline);
                        }

                        if (r.secondRoute.coordinates && r.secondRoute.coordinates.length > 0) {
                            const secondPolyline: GoogleMapsPolyline = {
                                id: `route_${resultIndex}_second`,
                                coordinates: r.secondRoute.coordinates.map((coord: any) => ({
                                    latitude: coord.latitude,
                                    longitude: coord.longitude
                                })),
                                color: '#FF6B6B', // Red for second segment
                                width: 16,
                                geodesic: true
                            };
                            googlePolylineRoutes.push(secondPolyline);
                        }

                        console.log(`Created transfer polylines for result ${resultIndex} (${r.routeId})`);
                    } else if (r.latLng && r.latLng.length > 0) {
                        // Single route polyline
                        const polyline: GoogleMapsPolyline = {
                            id: `route_${resultIndex}`,
                            coordinates: r.latLng.map((coord: any) => ({
                                latitude: coord.latitude,
                                longitude: coord.longitude
                            })),
                            color: '#33ff00', // Default green
                            width: 16,
                            geodesic: true
                        };

                        googlePolylineRoutes.push(polyline);
                        console.log(`Created polyline for result ${resultIndex} (${r.routeId})`);
                    } else {
                        // Push empty polyline to maintain index consistency
                        const emptyPolyline: GoogleMapsPolyline = {
                            id: `route_${resultIndex}_empty`,
                            coordinates: [],
                            color: '#33ff00',
                            width: 16,
                            geodesic: true
                        };
                        googlePolylineRoutes.push(emptyPolyline);
                        console.log(`Created empty polyline for result ${resultIndex} (${r.routeId})`);
                    }
                });

                console.log(`Created ${googlePolylineRoutes.length} polylines from ${routes.length} results`);

                // Store all routes (no need for index map anymore since indices match directly)
                console.log(`Setting allRoutes with ${googlePolylineRoutes.length} polylines`);
                setAllRoutes(googlePolylineRoutes);

                // Don't display any route initially - wait for user selection
                if (googlePolylineRoutes.length > 0 && routes.length > 0) {
                    // Clear any previous route display
                    setRoutes([]);
                    setSelectedRouteIndex(null);
                    setSelectedRouteInfo(null);
                } else {
                    setRoutes([]);
                    setSelectedRouteIndex(null);
                    setSelectedRouteInfo(null);
                }
            } else if (routes && "error" in routes) {
                console.warn("Server error:", routes.error);
                // Show error message to user
                Alert.alert(
                    "Route Not Available",
                    routes.error,
                    [{ text: "OK", style: "default" }]
                );
                setRoutes([]);
                setSelectedRouteIndex(null);
            } else {
                console.warn("No routes returned");
                Alert.alert(
                    "No Routes Found",
                    "No jeepney routes available between these locations.",
                    [{ text: "OK", style: "default" }]
                );
            }
        } catch (error) {
            console.error("Error calculating routes:", error);
            Alert.alert(
                "Connection Error",
                "Unable to calculate routes. Please check your connection and try again.",
                [{ text: "OK", style: "default" }]
            );
        } finally {
            setIsCalculating(false);
        }
    };

    const onClear = () => {
        // Clear all points and routes
        console.log("Clearing map... (onClear called)");
        console.trace("onClear call stack"); // This will show what called onClear
        setResults([]); // Clear route results first
        setRoutes([]); // Clear polylines from map
        setAllRoutes([]); // Clear stored routes
        setSelectedRouteIndex(null); // Clear selection
        setSelectedRouteInfo(null); // Clear route info header

        // Use a small delay to ensure routes are cleared before points
        setTimeout(() => {
            setPointA(null);
            setPointB(null);
            setIsPinPlacementEnabled(false);
            console.log("Map cleared - all points and routes removed");
        }, 50);
    };

    return (
        <View style={styles.container}>
            <View style={styles.bottomSheetTopRow}>
                <Text style={styles.bottomSheetTitleText}>
                    {!pointA ? "Select your first location" :
                        !pointB ? "Select your second location" :
                            "Directions"}
                </Text>
                {(pointA || pointB) && (
                    <TouchableOpacity onPress={onClear} style={styles.clearButton}>
                        <Ionicons name="refresh-outline" color="white" size={20} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.bottomSheetRow}>
                <View style={styles.pointInputBox}>
                    <View style={styles.pointInputContainer}>
                        <TouchableOpacity onPress={() => {
                            if (enterPinPlacementMode) {
                                enterPinPlacementMode(true);
                            } else {
                                setIsPinPlacementEnabled(true);
                                setIsPointAB(true);
                                setWasSelectingFirstLocation(true);
                                setShowBottomSheet(false);
                            }
                        }}>
                            <View style={styles.pointInputRow}>
                                <View style={styles.pointInputBlock}>
                                    <View style={styles.pointInputIconLeft}>
                                        <Ionicons name={'navigate-circle-outline'} color="blue" size={18} />
                                    </View>
                                    <Text style={styles.pointInputText}
                                        numberOfLines={1}
                                        ellipsizeMode="tail">
                                        {pointA ? latLongStringifier(pointA) : "Select starting point"}
                                    </Text>
                                </View>

                                <View style={[styles.pointInputBlock, { justifyContent: 'flex-end' }]}>
                                    <Text style={styles.pointPickerText}
                                        numberOfLines={1}>
                                        Select on Map
                                    </Text>
                                    <View style={styles.pointInputIconRight}>
                                        <Ionicons name={'globe-outline'} color={'black'} size={16} />
                                    </View>
                                </View>
                            </View>

                        </TouchableOpacity>

                        <View style={styles.line}></View>

                        <TouchableOpacity onPress={() => {
                            if (enterPinPlacementMode) {
                                enterPinPlacementMode(false);
                            } else {
                                setIsPinPlacementEnabled(true);
                                setIsPointAB(false);
                                setShowBottomSheet(false);
                            }
                        }}>
                            <View style={styles.pointInputRow}>
                                <View style={styles.pointInputBlock}>
                                    <View style={styles.pointInputIconLeft}>
                                        <Ionicons name={'location-outline'} color="blue" size={18} />
                                    </View>
                                    <Text style={styles.pointInputText}
                                        numberOfLines={1}
                                        ellipsizeMode="tail">
                                        {pointB ? latLongStringifier(pointB) : "Select destination"}
                                    </Text>

                                </View>
                                <View style={[styles.pointInputBlock, { justifyContent: 'flex-end' }]}>
                                    <Text style={styles.pointPickerText}
                                        numberOfLines={1}>
                                        Select on Map
                                    </Text>
                                    <View style={styles.pointInputIconRight}>
                                        <Ionicons name={'globe-outline'} color={'black'} size={16} />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.bottomSheetRow}>
                <TouchableOpacity
                    style={[styles.calculateButton, isCalculating && styles.calculateButtonDisabled]}
                    onPress={onCalculate}
                    disabled={isCalculating || !pointA || !pointB}
                >
                    {isCalculating ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="white" />
                            <Text style={styles.calculateButtonText}>Finding Routes...</Text>
                        </View>
                    ) : (
                        <Text style={styles.calculateButtonText}>Find Jeeps</Text>
                    )}
                </TouchableOpacity>
            </View>

            {results && results.length > 0 && (
                <View style={styles.routeList}>
                    <Text style={{ color: 'white', fontFamily: 'Lexend_400Regular', marginBottom: 10 }}>Results</Text>
                    <ScrollView
                        style={{ maxHeight: 400 }}
                        contentContainerStyle={styles.routeCardContainer}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                        scrollEnabled={true}
                    >
                        {results.map((route, index) => {
                            console.log(`Rendering route card ${index}: ${route.routeId}`);
                            return (
                                <RouteCard
                                    key={`route-${index}-${route.routeId}`}
                                    route={route}
                                    isSelected={selectedRouteIndex === index}
                                    onSelect={() => handleRouteSelect(index)}
                                />
                            );
                        })}
                    </ScrollView>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 5
    },
    bottomSheetTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },

    bottomSheetTitleText: {
        color: 'white',
        textAlign: 'left',
        fontSize: 20,
        fontWeight: '600',
        fontFamily: 'Lexend_500Medium',
        flex: 1,
    },

    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        borderRadius: 16,
        gap: 4,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#919191ff',
        justifyContent: 'center',
        alignItems: 'center',
    },

    bottomSheetRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 10,
    },

    pointInputBox: {
        backgroundColor: '#D9D9D9',
        padding: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'stretch',
    },

    pointInputContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
    },

    pointInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 8,
    },

    pointInputBlock: {
        flexDirection: 'row',
        width: '50%'
    },

    pointInputIconLeft: {
        width: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },

    pointInputIconRight: {
        width: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },

    pointInputText: {
        fontWeight: 'bold',
        color: '#000',
        fontSize: 14,
        flexShrink: 1,
        fontFamily: 'Lexend_400Regular'
    },

    pointPickerText: {
        color: '#000',
        fontSize: 12,
        flexShrink: 1,
        fontFamily: 'Lexend_300Light'
    },

    line: {
        height: 1,
        backgroundColor: '#6C6C6C',
        width: '100%',
        marginVertical: 4,
    },

    calculateButton: {
        height: 48,
        shadowRadius: 25,
        backgroundColor: '#FFCC66',
        padding: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    },

    calculateButtonText: {
        fontFamily: 'Lexend_400Regular',
        fontSize: 16,
        color: '#2D2D2D',
        marginRight: 5,
    },

    calculateButtonDisabled: {
        opacity: 0.7,
        backgroundColor: '#E0B050',
    },

    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },

    routeList: {
        marginTop: 10,
        width: '100%',
        minHeight: 400,
        maxHeight: 800,
    },

    routeCardContainer: {
        paddingBottom: 10,
        gap: 15,
    }
});
