import { LOCATION_ICON } from "@/constants";
import { MappedGeoRouteResult } from "@/types/GeoTypes";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type RouteCardProps = {
    route: MappedGeoRouteResult;
    isSelected?: boolean;
    onSelect?: () => void;
};

export default function RouteCard({ route, isSelected = false, onSelect }: Readonly<RouteCardProps>) {
    return (
        <TouchableOpacity onPress={onSelect} activeOpacity={0.7}>
            <View style={[
                styles.routeCard,
                isSelected && styles.selectedCard
            ]}>
                <View style={styles.column1}>
                    <View>
                        <Text style={styles.routeCode}>
                            {route.routeId}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    </View>
                </View>
                <View style={styles.column2}>
                    <Text style={styles.fare}>P{route.fare}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    routeCard: {
        borderWidth: 3,
        width: "100%",
        backgroundColor: "#FFCC66",
        borderRadius: 10,
        flexDirection: "row",
        paddingHorizontal: 25,
        paddingVertical: 15,
        position: 'relative',
        borderColor: "#FFCC66",
    },
    selectedCard: {
        borderColor: "#4CAF50",
        backgroundColor: "#E8F5E9",
    },
    selectedIndicator: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    column1: {
        width: '50%',
    },
    column2: {
        width: '50%',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    routeCode: {
        fontFamily: 'Lexend_600SemiBold',
        fontSize: 32,
        color: "#2D2D2D",
    },
    fare: {
        fontFamily: 'Lexend_600SemiBold',
        fontSize: 30,
        color: "#2D2D2D",
    },
    route: {
        fontFamily: 'Lexend_400Regular',
        fontSize: 16,
        color: "#2D2D2D",
    },
    icon: {
        width: 20,
        height: 20
    },
    routeSave: {
        width: "15%",
    },
    routeCardSmallText: {
        fontFamily: 'Lexend_400Regular',
        color: "#FFFFFF",
    }


})