import { calculatePossibleRoutes } from "@/app/services/routes/calculatePossibleRoutes";
import { MapPointsContext } from "@/context/map-context";
import { latLongStringifier } from "@/lib/util/latLngStringifier";
import { Ionicons } from "@expo/vector-icons";
import { GoogleMapsPolyline } from "expo-maps/build/google/GoogleMaps.types";
import { useContext, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import RouteCard from "./RouteCard";

export default function MapModalContent({ exit, setShowBottomSheet }: Readonly<{ exit: () => void, setShowBottomSheet: (value: boolean) => void }>) {
    const { setIsPointAB, setIsPinPlacementEnabled, pointA, pointB, setPointA, setPointB, setRoutes, results, setResults, isPinPlacementEnabled } = useContext(MapPointsContext)
    const [wasSelectingFirstLocation, setWasSelectingFirstLocation] = useState(false)

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

    const onCalculate = async () => {
        try {
            if (!pointA || !pointB) {
                console.warn("Both points must be set");
                return;
            }

            const routes = await calculatePossibleRoutes(pointA, pointB);

            if (Array.isArray(routes) && routes.length > 0) {
                setResults(routes);
                
                // Filter and transform routes for display on map
                const validRoutes = routes.filter(r => 
                    r.latLng && 
                    r.latLng.length > 0 && 
                    !r.shouldCrossRoad && 
                    !r.routeId.endsWith('_CROSS')
                );
                
                console.log(`Filtered ${routes.length} routes to ${validRoutes.length} valid polylines`);
                
                const googlePolylineRoutes: GoogleMapsPolyline[] = validRoutes.map((r, index) => {
                    // Ensure coordinates are in the correct format
                    const polyline: GoogleMapsPolyline = {
                        id: `route_${index}`, // Simple numeric string ID
                        coordinates: r.latLng.map(coord => ({
                            latitude: coord.latitude,
                            longitude: coord.longitude
                        })),
                        color: '#33ff00', // Green color without alpha
                        width: 16,
                        geodesic: true
                    };
                    console.log(`Created polyline ${polyline.id} with ${polyline.coordinates.length} points`);
                    return polyline;
                });
                
                console.log('Setting routes:', googlePolylineRoutes.length);
                setRoutes(googlePolylineRoutes);
            } else if (routes && "error" in routes) {
                console.warn("Server error:", routes.error);
            } else {
                console.warn("No routes returned");
            }
        } catch (error) {
            console.error("Error calculating routes:", error);
        }
    };

    const onClear = () => {
        // Clear all points and routes
        console.log("Clearing map...");
        setResults([]); // Clear route results first
        setRoutes([]); // Clear polylines from map
        
        // Use a small delay to ensure routes are cleared before points
        setTimeout(() => {
            setPointA(null);
            setPointB(null);
            setIsPinPlacementEnabled(false);
            setWasSelectingFirstLocation(false);
            console.log("Map cleared - all points and routes removed");
        }, 50);
    };

    return (
        <Pressable onPress={() => setIsPinPlacementEnabled(false)}>
            <View
                onStartShouldSetResponder={() => true}
            >
                <View style={styles.bottomSheetTopRow}>
                    <Text style={styles.bottomSheetTitleText}>
                        {!pointA ? "Select your first location" : 
                         !pointB ? "Select your second location" : 
                         "Directions"}
                    </Text>
                    {(pointA || pointB) && (
                        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
                            <Ionicons name="refresh-outline" color="#007AFF" size={20} />
                            <Text style={styles.clearButtonText}>Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.bottomSheetRow}>
                    <View style={styles.pointInputBox}>
                        <View style={styles.pointInputContainer}>
                            <TouchableOpacity onPress={() => {
                                setIsPinPlacementEnabled(true);
                                setIsPointAB(true);
                                setWasSelectingFirstLocation(true);
                                setShowBottomSheet(false);
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
                                setIsPinPlacementEnabled(true);
                                setIsPointAB(false);
                                setShowBottomSheet(false);
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
                    <TouchableOpacity style={styles.calculateButton} onPress={onCalculate}>
                        <Text style={styles.calculateButtonText}>Calculate Price</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.routeList}>
                    <ScrollView
                        style={{ flex: 1 }}  // Add this
                        contentContainerStyle={styles.routeCard}
                        showsVerticalScrollIndicator={true}  // Add this to debug
                    >
                        {results?.map((route, index) => (
                            <RouteCard key={route.routeId || index} route={route} />
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    bottomSheetTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },

    bottomSheetTitleText: {
        color: 'white',
        textAlign: 'left',
        fontSize: 24,
        fontWeight: '600',
        fontFamily: 'Lexend_500Medium',
        flex: 1,
    },

    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },

    clearButtonText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Lexend_500Medium'
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
        marginBottom: 12,

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

    routeList: {
        minHeight: '80%',
        marginBottom: 12,
        width: '100%',
    },

    routeCard: {
        paddingVertical: 10,
        gap: 20,
    }
});
