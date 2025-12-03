import { LOCATION_ICON } from "@/constants";
import { MappedGeoRouteResult } from "@/types/GeoTypes";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MultiRouteResult } from "@/app/services/routes/calculateMultiRoutes";

type RouteCardProps = {
    route: MappedGeoRouteResult | MultiRouteResult;
    isSelected?: boolean;
    onSelect?: () => void;
};

export default function RouteCard({ route, isSelected = false, onSelect }: Readonly<RouteCardProps>) {
    const isTransfer = 'isTransfer' in route && route.isTransfer;
    
    return (
        <TouchableOpacity onPress={onSelect} activeOpacity={0.7}>
            <View style={[
                styles.routeCard,
                isSelected && styles.selectedCard,
                isTransfer && styles.transferCard
            ]}>
                <View style={styles.column1}>
                    <View>
                        {isTransfer ? (
                            <View>
                                <Text style={[styles.routeCode, styles.transferRouteCode]}>
                                    {route.firstRoute?.routeId}
                                </Text>
                                <View style={styles.transferIndicator}>
                                    <Ionicons name="arrow-down" size={16} color="#666" />
                                    <Text style={styles.transferText}>Transfer</Text>
                                </View>
                                <Text style={[styles.routeCode, styles.transferRouteCode]}>
                                    {route.secondRoute?.routeId}
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.routeCode}>
                                {route.routeId}
                            </Text>
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    </View>
                </View>
                <View style={styles.column2}>
                    <Text style={styles.fare}>
                        P{isTransfer && route.totalFare ? route.totalFare : route.fare}
                    </Text>
                    {isTransfer && (
                        <Text style={styles.fareBreakdown}>
                            P{route.firstRoute?.fare} + P{route.secondRoute?.fare}
                        </Text>
                    )}
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
    transferCard: {
        backgroundColor: "#FFE5E5",
        borderColor: "#FF6B6B",
    },
    selectedIndicator: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    transferIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 2,
    },
    transferText: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'Lexend_400Regular',
    },
    transferRouteCode: {
        fontSize: 18,
    },
    fareBreakdown: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'Lexend_400Regular',
        marginTop: 4,
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