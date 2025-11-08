import React, { useContext, useState } from 'react';
import {
    StyleSheet,
    Pressable,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Map component will be implemented later
// import { MapComponent } from '../components/Map/MapComponent';
import { MapPointsProvider, MapPointsContext } from '../context/MapPointContext';
import { latLongStringifier } from '../lib/helper/latLongStringifier';
// Temporarily commenting out the import to avoid the react-native-maps type error
// import { findJeepneyPath } from '../services/supabase/DistanceRPC';
import { useNavigation } from '@react-navigation/native';

const MapScreenContent = () => {
    const navigation = useNavigation();
    const { setIsPointAB, setIsPinPlacementEnabled, pointA, pointB, setPointA, setPointB } = useContext(MapPointsContext);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [locationSearch, setLocationSearch] = useState('');
    const [destinationSearch, setDestinationSearch] = useState('');
    const [isSelectingLocation, setIsSelectingLocation] = useState<'location' | 'destination' | null>(null);
    const [showRouteDetails, setShowRouteDetails] = useState(false);
    const [routeInfo, setRouteInfo] = useState<any>(null);
    const [loadingRoute, setLoadingRoute] = useState(false);

    const handleCalculateRoute = async () => {
        console.log('Calculate route called', { pointA, pointB });
        
        if (!pointA || !pointB) {
            Alert.alert('Missing Information', 'Please select both location and destination');
            return;
        }
        
        setLoadingRoute(true);
        setShowRouteDetails(false); // Reset first
        
        // Small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            // Calculate distance using Haversine formula
            console.log('Calculating distance between points');
            const R = 6371; // Earth's radius in km
            const dLat = (pointB.latitude - pointA.latitude) * Math.PI / 180;
            const dLon = (pointB.longitude - pointA.longitude) * Math.PI / 180;
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(pointA.latitude * Math.PI / 180) * Math.cos(pointB.latitude * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;
            
            // Calculate fare based on Cebu jeepney matrix
            let fare = 13; // Base fare
            if (distance > 4) {
                fare += Math.ceil((distance - 4) * 2);
            }
            
            const routeData = {
                distance: distance.toFixed(2),
                fare: fare,
                fareRange: `₱${fare} - ₱${fare + 5}`,
                time: `${Math.ceil(distance * 3)} - ${Math.ceil(distance * 4)} mins`
            };
            
            console.log('Setting route info:', routeData);
            setRouteInfo(routeData);
            setShowRouteDetails(true);
        } catch (error) {
            console.error('Error calculating route:', error);
            Alert.alert('Route Calculation', 'Using estimated calculations');
            
            // Fallback calculation
            const R = 6371;
            const dLat = (pointB.latitude - pointA.latitude) * Math.PI / 180;
            const dLon = (pointB.longitude - pointA.longitude) * Math.PI / 180;
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(pointA.latitude * Math.PI / 180) * Math.cos(pointB.latitude * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;
            
            let fare = 13;
            if (distance > 4) {
                fare += Math.ceil((distance - 4) * 2);
            }
            
            const fallbackRoute = {
                distance: distance.toFixed(2),
                fare: fare,
                fareRange: `₱${fare} - ₱${fare + 5}`,
                time: `${Math.ceil(distance * 3)} - ${Math.ceil(distance * 4)} mins`
            };
            console.log('Setting fallback route info:', fallbackRoute);
            setRouteInfo(fallbackRoute);
            setShowRouteDetails(true);
        } finally {
            setLoadingRoute(false);
        }
    };

    const handleLocationSelect = (type: 'location' | 'destination') => {
        setIsSelectingLocation(type);
        setIsPinPlacementEnabled(true);
        setIsPointAB(type === 'location');
        setIsExpanded(false);
    };

    const handleUseCurrentLocation = () => {
        // For now, set a default location (Cebu area)
        // In production, this would use actual GPS
        setPointA({ latitude: 10.3157, longitude: 123.8854 });
        setLocationSearch('Current Location');
        Alert.alert('Location Set', 'Using current location (Demo)');
    };

    const clearLocation = () => {
        setPointA(null);
        setLocationSearch('');
        setShowRouteDetails(false);
        setRouteInfo(null);
    };

    const clearDestination = () => {
        setPointB(null);
        setDestinationSearch('');
        setShowRouteDetails(false);
        setRouteInfo(null);
    };

    const swapLocations = () => {
        const tempPoint = pointA;
        const tempSearch = locationSearch;
        
        setPointA(pointB);
        setPointB(tempPoint);
        setLocationSearch(destinationSearch);
        setDestinationSearch(tempSearch);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Find Routes</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Map Container */}
                <View style={styles.mapContainer}>
                    {/* Map will be implemented here */}
                    <View style={{ flex: 1, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#666' }}>Map View</Text>
                    </View>
                    
                    {/* Pin placement indicator */}
                    {isSelectingLocation && (
                        <View style={styles.pinIndicator}>
                            <Text style={styles.pinIndicatorText}>
                                Tap on map to select {isSelectingLocation}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    setIsSelectingLocation(null);
                                    setIsPinPlacementEnabled(false);
                                }}
                                style={styles.cancelButton}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Bottom Sheet - Hidden for now to focus on map */}
                {/* Will be re-enabled once map is working */}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const MapScreen = () => {
    return (
        <MapPointsProvider>
            <MapScreenContent />
        </MapPointsProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        elevation: 2,
    },
    backButton: {
        padding: 5,
    },
    backButtonText: {
        fontSize: 24,
        color: '#007AFF',
    },
    headerTitle: {
        fontSize: 18,
        color: '#333',
        fontWeight: '600',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    pinIndicator: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 5,
    },
    pinIndicatorText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    cancelButton: {
        paddingHorizontal: 15,
        paddingVertical: 5,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 5,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
        maxHeight: '40%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    bottomSheetExpanded: {
        maxHeight: '60%',
    },
    bottomSheetMinimized: {
        maxHeight: 50,
    },
    bottomSheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    minimizeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    minimizeButtonText: {
        fontSize: 20,
        color: '#666',
        fontWeight: 'bold',
    },
    handleBar: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#DDD',
        borderRadius: 2,
    },
    bottomSheetContent: {
        paddingHorizontal: 20,
    },
    bottomSheetTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    inputIcon: {
        width: 30,
        alignItems: 'center',
    },
    dotIcon: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#007AFF',
    },
    destinationDot: {
        backgroundColor: '#FF3B30',
    },
    inputField: {
        flex: 1,
        marginLeft: 10,
    },
    inputLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    inputValue: {
        fontSize: 15,
        color: '#333',
    },
    inputPlaceholder: {
        color: '#999',
    },
    locationButton: {
        padding: 10,
    },
    locationButtonText: {
        fontSize: 20,
    },
    clearButton: {
        padding: 10,
    },
    clearButtonText: {
        fontSize: 18,
        color: '#666',
    },
    swapButton: {
        alignSelf: 'center',
        padding: 5,
        marginVertical: -10,
        zIndex: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    swapButtonText: {
        fontSize: 18,
    },
    quickDestinations: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 10,
    },
    quickChip: {
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
    },
    quickChipText: {
        fontSize: 13,
        color: '#333',
    },
    calculateButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginBottom: 15,
    },
    calculateButtonDisabled: {
        backgroundColor: '#CCC',
    },
    calculateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    routeDetails: {
        marginTop: 20,
        marginBottom: 20,
    },
    routeCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        padding: 15,
    },
    routeInfo: {
        alignItems: 'center',
    },
    routeLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    routeValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    routesList: {
        marginTop: 15,
    },
    jeepneyRoute: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    jeepneyIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFE4B5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    jeepneyIconText: {
        fontSize: 20,
    },
    jeepneyDetails: {
        flex: 1,
    },
    jeepneyCode: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    jeepneyPath: {
        fontSize: 12,
        color: '#666',
    },
    jeepneyFare: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
});

export default MapScreen;