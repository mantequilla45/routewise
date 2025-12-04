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
    onSave?: () => void;
    isSaved?: boolean;
};

export default function RouteCard({ route, isSelected = false, onSelect, onSave, isSaved = false }: Readonly<RouteCardProps>) {
    const isTransfer = 'isTransfer' in route && route.isTransfer;
    
    return (
        <TouchableOpacity onPress={onSelect} activeOpacity={0.7}>
            <View style={[
                styles.routeCard,
                isSelected && styles.selectedCard
            ]}>
                <View style={[
                    styles.contentWrapper,
                    isTransfer && styles.contentWrapperTransfer
                ]}>
                    <View style={styles.routeInfo}>
                        {isTransfer ? (
                            <View style={styles.transferRoutesContainer}>
                                <View style={styles.transferRouteRow}>
                                    <Text style={styles.routeCode}>
                                        {route.firstRoute?.routeId}
                                    </Text>
                                    <Ionicons name="arrow-forward" size={20} color="#2D2D2D" style={styles.transferArrow} />
                                    <Text style={styles.routeCode}>
                                        {route.secondRoute?.routeId}
                                    </Text>
                                </View>
                                <Text style={styles.transferLabel}>2 Jeeps Required</Text>
                            </View>
                        ) : (
                            <Text style={styles.routeCode}>
                                {route.routeId}
                            </Text>
                        )}
                    </View>
                </View>
                <View style={[
                    styles.priceBox,
                    isTransfer && styles.priceBoxTransfer
                ]}>
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
        width: "100%",
        backgroundColor: "#FFCC66",
        borderRadius: 10,
        flexDirection: "row",
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: "#FFCC66",
        minHeight: 80,
    },
    selectedCard: {
        borderColor: "#4CAF50",
        backgroundColor: "#E8F5E9",
    },
    contentWrapper: {
        flex: 1,
        paddingHorizontal: 25,
        paddingVertical: 15,
        justifyContent: 'center',
    },
    contentWrapperTransfer: {
        paddingVertical: 20,
    },
    routeInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    priceBox: {
        aspectRatio: 1,
        backgroundColor: '#E6B85C',  // Darker shade of yellow
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 80,
    },
    priceBoxTransfer: {
        minWidth: 100,
    },
    transferRoutesContainer: {
        gap: 8,
    },
    transferRouteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    transferArrow: {
        marginHorizontal: 5,
    },
    transferLabel: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'Lexend_400Regular',
        marginTop: 4,
    },
    fareBreakdown: {
        fontSize: 12,
        color: '#2D2D2D',
        fontFamily: 'Lexend_400Regular',
        marginTop: 4,
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