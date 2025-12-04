import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useContext } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MapPointsContext } from '@/context/map-context';
import Button from '@/components/Button';

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
    const [searchQuery, setSearchQuery] = useState('');
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

    const filteredRoutes = routes.filter(route => {
        const query = searchQuery.toLowerCase();
        return route.route_id.toLowerCase().includes(query) ||
            route.route_name.toLowerCase().includes(query);
    });

    const sortAlphabetically = () => {
        const sorted = [...routes].sort((a, b) => 
            a.route_id.localeCompare(b.route_id)
        );
        setRoutes(sorted);
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
                            color="#666"
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
            <View style={styles.heading}>
                <Text style={styles.headingText}>
                    Browse all jeepney routes.
                </Text>
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color="gray" />
                    <TextInput
                        placeholder="Search routes..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchBox}
                    />
                </View>
            </View>
            
            <View style={styles.recentHeading}>
                <Button label="Sort A-Z" onPress={sortAlphabetically} theme="tags" />
                <Text style={styles.recentText}>
                    {filteredRoutes.length} Routes Available
                </Text>
            </View>

            <FlatList
                data={filteredRoutes}
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
                        <Text style={styles.emptyText}>No routes found</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 40,
        paddingTop: 80,
        backgroundColor: 'white',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    heading: {
        gap: 20,
        width: '100%',
    },
    headingText: {
        fontFamily: 'Lexend_500Medium',
        fontSize: 20,
        textAlignVertical: 'center',
        color: '#303030',
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
        flex: 1,
        fontFamily: 'Lexend_300Light',
        color: '#303030',
    },
    recentHeading: {
        marginVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    recentText: {
        marginLeft: 12,
        fontFamily: 'Lexend_400Regular',
        color: '#303030',
    },
    listContent: {
        paddingBottom: 100,
    },
    routeCard: {
        backgroundColor: '#FFCC66',
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 3,
        borderColor: '#FFCC66',
        overflow: 'hidden',
    },
    routeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    routeInfo: {
        flex: 1,
    },
    routeCode: {
        fontSize: 24,
        fontWeight: '600',
        color: '#303030',
        fontFamily: 'Lexend_600SemiBold',
    },
    routeName: {
        fontSize: 14,
        color: '#303030',
        marginTop: 2,
        fontFamily: 'Lexend_400Regular',
    },
    routeActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    colorIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#303030',
    },
    loadingText: {
        color: '#666',
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