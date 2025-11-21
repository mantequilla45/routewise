import { MappedGeoRouteResult } from "@/types/GeoTypes";
import { StyleSheet, Text, View } from "react-native";

type RouteCardProps = {
    route: MappedGeoRouteResult;
};

export default function RouteCard({ route }: Readonly<RouteCardProps>) {
    return (
        <View style={styles.routeCard}>
            <View style={styles.routeCardInnerPadding}>
                <View style={styles.routeCardType}>
                    <Text style={styles.routeCardFieldName}>Type:</Text>
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
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    routeCard: {
        width: "100%",
        borderColor: "#FFCC66",
        borderWidth: 1,
        borderRadius: 8,
    },
    routeCardInnerPadding: {
        padding: 8,
        flexDirection: "row",
    },
    routeCardType: {
        width: "20%",
        borderRightColor: "#656565",
        borderRightWidth: 2,
        borderBottomColor: "#656565",
        borderBottomWidth: 2,
        paddingBottom: 12
    },
    routeCardFieldName: {
        fontFamily: 'Lexend_400Regular',
        fontSize: 16,
        color: "#FFFFFF",
        fontWeight: "bold"
    },
    routeCardFieldOutputLarge: {
        fontFamily: 'Lexend_700Bold',
        fontSize: 24,
        color: "#FFFFFF",
    },
    routeName: {
        width: "65%",
        borderRightColor: "#656565",
        borderRightWidth: 2,
        borderBottomColor: "#656565",
        borderBottomWidth: 2,
        paddingHorizontal: 8,
        paddingBottom: 12
    },
    routeSave: {
        width: "15%",
        borderBottomColor: "#656565",
        borderBottomWidth: 2,
    },
    routeCardSmallText: {
        fontFamily: 'Lexend_400Regular',
        color: "#FFFFFF",
    }


})