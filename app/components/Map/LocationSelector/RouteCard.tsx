import { LOCATION_ICON } from "@/constants";
import { MappedGeoRouteResult } from "@/types/GeoTypes";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

type RouteCardProps = {
    route: MappedGeoRouteResult;
};

export default function RouteCard({ route }: Readonly<RouteCardProps>) {
    const isCrossRoadSuggestion = route.shouldCrossRoad || route.routeId.endsWith('_CROSS');
    
    return (
        <Pressable>
            <View style={[styles.routeCard, isCrossRoadSuggestion && styles.crossRoadCard]}>
                <View style={styles.column1}>
                    <Text style={styles.routeCode}>
                        {isCrossRoadSuggestion ? '⚠️ Cross Road' : route.routeId}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                        <Ionicons 
                            name={isCrossRoadSuggestion ? "walk-outline" : "compass-outline"} 
                            size={25} 
                            color={isCrossRoadSuggestion ? "#FF6B6B" : "#2D2D2D"}
                        />
                        <Text style={[styles.route, isCrossRoadSuggestion && styles.crossRoadText]} numberOfLines={2}>
                            {isCrossRoadSuggestion 
                                ? (route.message || "Cross to the other side for a shorter route") 
                                : `${route.startingPoint} - ${route.endPoint}`}
                        </Text>
                    </View>
                </View>
                <View style={styles.column2}>
                    {!isCrossRoadSuggestion && (
                        <>
                            <Ionicons name="bookmark-outline" size={25} />
                            <Text style={styles.fare}>P{route.fare}</Text>
                        </>
                    )}
                    {isCrossRoadSuggestion && (
                        <View style={styles.crossDistance}>
                            <Text style={styles.distanceText}>
                                {(route.distanceMeters || 0).toFixed(0)}m
                            </Text>
                            <Text style={styles.distanceLabel}>to cross</Text>
                        </View>
                    )}
                </View>
                <View style={styles.routeSave} />

                {/*<View style={styles.routeCardInnerPadding}>
                <View style={styles.routeCardType}>
                    <Text style={styles.routeCardFieldOutputLarge}>{route.routeId}</Text>
                </View>
                <View style={styles.routeName}>
                    <Text style={styles.routeCardFieldName}>Route:</Text>
                    <Text style={styles.routeCardFieldOutputLarge} numberOfLines={1}>
                        {route.startingPoint} - {route.endPoint}
                    </Text>
                </View>
                <View style={styles.routeSave}></View>
            </View>
            <View style={styles.routeCardInnerPadding}>
                <View>
                    <Text style={styles.routeCardFieldName}>Fare Rate:</Text>
                    <Text style={styles.routeCardSmallText}>Distance: {route.distanceMeters.toFixed(2)} meters </Text>
                    <Text style={styles.routeCardSmallText}>PWD / Senior / Student: {route.fare - (route.fare * 0.2)}</Text>
                    <Text style={styles.routeCardSmallText}>Reg: {route.fare}</Text>
                </View>
            </View> */}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    routeCard: {
        width: "100%",
        backgroundColor: "#FFCC66",
        borderRadius: 15,
        flexDirection: "row",
        padding: 25,
        gap: '5%',
    },
    crossRoadCard: {
        backgroundColor: "#FFE5E5",
        borderWidth: 2,
        borderColor: "#FF6B6B",
    },
    column1: {
        width: '75%',
        gap: 10,
        overflow: 'hidden',
    },
    column2: {
        width: '20%',
        alignItems: 'flex-end',
        paddingRight: 5,
        gap: 10,
        justifyContent: 'space-between',
    },
    routeCode: {
        fontFamily: 'Lexend_600SemiBold',
        fontSize: 24,
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
    crossRoadText: {
        color: "#FF6B6B",
        fontFamily: 'Lexend_500Medium',
    },
    crossDistance: {
        alignItems: 'center',
    },
    distanceText: {
        fontFamily: 'Lexend_600SemiBold',
        fontSize: 20,
        color: "#FF6B6B",
    },
    distanceLabel: {
        fontFamily: 'Lexend_400Regular',
        fontSize: 12,
        color: "#FF6B6B",
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