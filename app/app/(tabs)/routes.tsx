import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useContext } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MapPointsContext } from '@/context/map-context';

interface Route {
    id: string;
    route_id: string;
    route_name: string;
    route_color: string;
    created_at: string;
    coordinates?: any;
}

export default function RoutesScreen() {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const { setRoutes: setMapRoutes, setAllRoutes, setIsRouteFromList, setSelectedRouteInfo } = useContext(MapPointsContext);

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const response = await fetch('http://10.0.2.2:3000/api/routes/all');
            if (response.ok) {
                const data = await response.json();
                setRoutes(data);
            } else {
                console.error('Failed to fetch routes');
            }
        } catch (error) {
            console.error('Error fetching routes:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchRoutes();
    };

    const handleRouteSelect = async (route: Route) => {
        try {
            // Fetch the full route details including coordinates
            const url = `http://10.0.2.2:3000/api/routes/display/${route.id}`;
            const response = await fetch(url);
            
            if (response.ok) {
                const fullRoute = await response.json();
                
                // Convert coordinates to the format expected by the map
                if (fullRoute.coordinates && fullRoute.coordinates.length > 0) {
                    const polyline = {
                        id: `route_${route.route_id}`,
                        coordinates: fullRoute.coordinates,
                        color: route.route_color || '#33ff00',
                        width: 16,
                        geodesic: true
                    };
                    
                    // Set the route on the map context
                    setMapRoutes([polyline]);
                    setAllRoutes([polyline]);
                    setIsRouteFromList(true); // Mark that this route came from the list
                    setSelectedRouteInfo({ 
                        id: fullRoute.route_id, 
                        name: fullRoute.route_name 
                    });
                    
                    // Navigate to the map screen
                    router.push('/(tabs)/');
                }
            }
        } catch (error) {
            console.error('Error fetching route details:', error);
        }
    };

    const renderRoute = ({ item }: { item: Route }) => {
        return (
            <TouchableOpacity 
                style={styles.routeCard}
                onPress={() => handleRouteSelect(item)}
                activeOpacity={0.7}
            >
                <View style={styles.routeHeader}>
                    <View style={styles.routeInfo}>
                        <Text style={styles.routeCode}>{item.route_id}</Text>
                        <Text style={styles.routeName}>{item.route_name}</Text>
                    </View>
                    <View style={styles.routeActions}>
                        <View style={[styles.colorIndicator, { backgroundColor: item.route_color || '#33ff00' }]} />
                        <Ionicons 
                            name="chevron-forward" 
                            size={24} 
                            color="#FFCC66"
                        />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FFCC66" />
                <Text style={styles.loadingText}>Loading routes...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Jeepney Routes</Text>
                <Text style={styles.subtitle}>{routes.length} routes available</Text>
            </View>

            <FlatList
                data={routes}
                renderItem={renderRoute}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#FFCC66']}
                        tintColor="#FFCC66"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="bus-outline" size={64} color="#666" />
                        <Text style={styles.emptyText}>No routes available</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#303030',
        borderBottomWidth: 1,
        borderBottomColor: '#404040',
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        color: 'white',
        fontFamily: 'Lexend_600SemiBold',
    },
    subtitle: {
        fontSize: 14,
        color: '#999',
        marginTop: 4,
        fontFamily: 'Lexend_400Regular',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    routeCard: {
        backgroundColor: '#303030',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#404040',
        overflow: 'hidden',
    },
    routeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    routeInfo: {
        flex: 1,
    },
    routeCode: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFCC66',
        fontFamily: 'Lexend_600SemiBold',
    },
    routeName: {
        fontSize: 14,
        color: '#ccc',
        marginTop: 4,
        fontFamily: 'Lexend_400Regular',
    },
    routeActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    colorIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#404040',
    },
    loadingText: {
        color: '#999',
        marginTop: 12,
        fontSize: 16,
        fontFamily: 'Lexend_400Regular',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
        marginTop: 12,
        fontFamily: 'Lexend_400Regular',
        textAlign: 'center',
    },
});