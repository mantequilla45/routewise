import Button from "@/components/Button";
import DynamicBoxes from "@/components/SavedRoute/DynamicBoxes";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/context/hybrid-auth";
import { MapPointsContext } from "@/context/map-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState, useContext } from "react";
import { StyleSheet, Text, TextInput, View, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedRoute {
    id: string;
    jeepCode: string;
    start: string;
    destination: string;
    favorite: boolean;
    totalFare?: number;
    createdAt?: string;
    // Additional data for displaying on map
    startLat?: number;
    startLng?: number;
    endLat?: number;
    endLng?: number;
    transferPoints?: any;
    routeData?: any;
}

export interface UserSavedRoute {
    id: string;
    user_id: string;
    route_name: string;
    start_location: string;
    end_location: string;
    start_lat: number;
    start_lng: number;
    end_lat: number;
    end_lng: number;
    jeepney_codes: string[];
    total_fare: number;
    transfer_points: any;
    created_at: string;
}

export async function getUserSavedRoutes(userId: string): Promise<UserSavedRoute[]> {
    if (!userId) {
        console.error("No user ID provided");
        return [];
    }

    console.log("Fetching saved routes for user:", userId);

    const { data, error } = await supabase
        .from("saved_routes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching saved routes:", error);
        return [];
    }

    console.log("Fetched saved routes:", data?.length || 0);
    return data ?? [];
}

export default function Saved() {
    const { user } = useAuth();
    const { setPointA, setPointB, setIsRouteFromList, setSelectedRouteInfo, setResults, setRoutes: setMapRoutes } = useContext(MapPointsContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [routes, setRoutes] = useState<SavedRoute[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchSavedRoutes();
        } else {
            setLoading(false);
            setRoutes([]);
        }
    }, [user]);

    const fetchSavedRoutes = async () => {
        if (!user) {
            console.log('No user found, cannot fetch saved routes');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            console.log('Fetching routes for user:', user.id);
            const savedRoutes = await getUserSavedRoutes(user.id);
            const mappedRoutes: SavedRoute[] = savedRoutes.map((route) => ({
                id: route.id,
                jeepCode: route.jeepney_codes ? route.jeepney_codes.join(' → ') : 'Direct',
                start: route.start_location,
                destination: route.end_location,
                favorite: false,
                totalFare: route.total_fare,
                createdAt: route.created_at,
                // Include additional data for map display
                startLat: route.start_lat,
                startLng: route.start_lng,
                endLat: route.end_lat,
                endLng: route.end_lng,
                transferPoints: route.transfer_points,
                routeData: route
            }));
            setRoutes(mappedRoutes);
            console.log('Mapped routes:', mappedRoutes.length);
        } catch (error) {
            console.error('Error fetching saved routes:', error);
            Alert.alert('Error', 'Failed to load saved routes');
        } finally {
            setLoading(false);
        }
    };

    const sortRecent = () => {
        // Sort logic here
    };

    const toggleFavorite = (id: string) => {
        setRoutes(prevRoutes =>
            prevRoutes.map(route =>
                route.id === id ? { ...route, favorite: !route.favorite } : route
            )
        );
    };

    const handleDeleteRoute = async (id: string) => {
        try {
            Alert.alert(
                'Delete Route',
                'Are you sure you want to delete this saved route?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                            const { error } = await supabase
                                .from('saved_routes')
                                .delete()
                                .eq('id', id);
                            
                            if (error) {
                                console.error('Error deleting route:', error);
                                Alert.alert('Error', 'Failed to delete route');
                            } else {
                                // Remove from local state
                                setRoutes(prevRoutes => prevRoutes.filter(route => route.id !== id));
                                Alert.alert('Success', 'Route deleted successfully');
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error deleting route:', error);
            Alert.alert('Error', 'Failed to delete route');
        }
    };

    const handleRouteSelect = async (route: SavedRoute) => {
        console.log('Selected saved route:', route);
        
        // Clear existing routes first
        setResults([]);
        setMapRoutes([]);
        
        // Set the start and end points
        if (route.startLat && route.startLng) {
            setPointA({
                latitude: route.startLat,
                longitude: route.startLng
            });
        }
        
        if (route.endLat && route.endLng) {
            setPointB({
                latitude: route.endLat,
                longitude: route.endLng
            });
        }
        
        // Set a flag in AsyncStorage to trigger calculation in SelectorContent
        await AsyncStorage.setItem('shouldCalculateRoute', 'true');
        
        // Navigate to home tab (which contains the map)
        router.replace('/(tabs)/');
    };

    const filteredRoutes = routes.filter(route => {
        const query = searchQuery.toLowerCase();
        return route.jeepCode.toLowerCase().includes(query) ||
            route.start.toLowerCase().includes(query) ||
            route.destination.toLowerCase().includes(query);
    });
    return (
        <View style={styles.container}>
            <View style={styles.heading}>
                <Text style={styles.headingText}>
                    Find your saved routes.
                </Text>
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color="gray" />
                    <TextInput
                        placeholder="Find destination..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchBox}
                    >
                    </TextInput>
                </View>
            </View>
            <View style={styles.recentHeading}>
                <Button label="Recent" onPress={sortRecent} theme="tags" />
                <Text style={styles.recentText}>
                    {filteredRoutes.length} Saved Routes
                </Text>
            </View>
            <View style={styles.savedContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>Loading saved routes...</Text>
                    </View>
                ) : !user ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="person-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>Please login</Text>
                        <Text style={styles.emptySubtext}>Login to see your saved routes</Text>
                    </View>
                ) : filteredRoutes.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="bookmark-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No saved routes yet</Text>
                        <Text style={styles.emptySubtext}>Calculate a route and save it to see it here</Text>
                    </View>
                ) : (
                    <DynamicBoxes
                        routes={filteredRoutes}
                        onToggleFavorite={toggleFavorite}
                        onRouteSelect={handleRouteSelect}
                        onDelete={handleDeleteRoute}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 40,
        paddingTop: 80,
    },
    heading: {
        gap: 20,
        width: '100%',
    },
    headingText: {
        fontFamily: 'Lexend_500Medium',
        fontSize: 20,
        textAlignVertical: 'center'
    },
    searchContainer: {
        backgroundColor: '#D9D9D9',
        height: 45,
        borderRadius: 10,
        paddingLeft: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchBox: {
        height: '100%',
        width: '100%',
        fontFamily: 'Lexend_300Light'
    },
    recentHeading: {
        marginVertical: 10,
        flexDirection: 'row',
        alignItems: 'center'
    },
    recentText: {
        marginLeft: 12,
        fontFamily: 'Lexend_400Regular'
    },
    savedContainer: {
        flex: 1,
        width: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontFamily: 'Lexend_300Light',
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    emptyText: {
        fontFamily: 'Lexend_500Medium',
        fontSize: 18,
        color: '#666',
        marginTop: 12,
    },
    emptySubtext: {
        fontFamily: 'Lexend_300Light',
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});