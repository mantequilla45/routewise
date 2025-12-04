import Button from "@/components/Button";
import DynamicBoxes from "@/components/SavedRoute/DynamicBoxes";
import { supabase } from "@/lib/supabase-client";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export interface SavedRoute {
    id: string;
    jeepCode: string;
    start: string;
    destination: string;
    favorite: boolean;
}

export interface JeepneyRoute {
    id: string;
    route_code: string;
    name: string | null;
    geom_forward: any;
    geom_reverse: any;
    start_point_name: string | null;
    end_point_name: string | null;
    created_at: string;
}


export async function getAllRoutes(): Promise<JeepneyRoute[]> {
    const { data, error } = await supabase
        .from("jeepney_routes")
        .select("*");

    if (error) {
        console.error("Error fetching routes:", error);
        return [];
    }

    return data ?? [];
}

const savedRoutes: SavedRoute[] = [
    {
        id: '1',
        jeepCode: '04A',
        start: 'Marikina Station',
        destination: 'Cubao Terminal',
        favorite: true
    },
];

export default function Saved() {
    const [searchQuery, setSearchQuery] = useState('');
    const [routes, setRoutes] = useState<SavedRoute[]>(savedRoutes);

    useEffect(() => {
        getAllRoutes().then((fetchedRoutes: JeepneyRoute[]) => {
            const mappedRoutes: SavedRoute[] = fetchedRoutes.map((route) => ({
                id: route.id,
                jeepCode: route.route_code,
                start: route.start_point_name ?? "Unknown",
                destination: route.end_point_name ?? "Unknown",
                favorite: false,
            }));

            setRoutes((prev) => [...prev, ...mappedRoutes]);
        });
    }, []);

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
                <DynamicBoxes
                    routes={filteredRoutes}
                    onToggleFavorite={toggleFavorite}
                />
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
});