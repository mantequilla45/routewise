import Button from "@/components/Button";
import DynamicBoxes from "@/components/SavedRoute/DynamicBoxes";
import { LOGO_ICON } from "@/constants";
import { Lexend_500Medium } from "@expo-google-fonts/lexend";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export interface SavedRoute {
    id: string;
    jeepCode: string;
    start: string;
    destination: string;
    favorite: boolean;
}

const savedRoutes: SavedRoute[] = [
    {
        id: '1',
        jeepCode: '04A',
        start: 'Marikina Station',
        destination: 'Cubao Terminal',
        favorite: true
    },
    {
        id: '2',
        jeepCode: '08H',
        start: 'SM Marikina',
        destination: 'Antipolo Church',
        favorite: false
    },
    {
        id: '3',
        jeepCode: '10M',
        start: 'Cogeo Gate 2',
        destination: 'Robinsons Metro East',
        favorite: true
    },
    {
        id: '4',
        jeepCode: '05C',
        start: 'Bayan-Bayanan',
        destination: 'Ayala Triangle',
        favorite: false
    },
    {
        id: '5',
        jeepCode: '05C',
        start: 'Bayan-Bayanan',
        destination: 'Ayala Triangle',
        favorite: false
    },
];

export default function Saved() {
    const [searchQuery, setSearchQuery] = useState('');
    const [routes, setRoutes] = useState<SavedRoute[]>(savedRoutes);

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
        marginTop: 10,
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