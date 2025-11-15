import NativeMap from '@/components/Map/NativeMap';
import { LatLng, MapPointsContext, MapPointsProvider } from '@/context/map-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useContext, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function MapScreenContent () {

    const { setIsPointAB, setIsPinPlacementEnabled, pointA, pointB } = useContext(MapPointsContext)
    const [showBottomSheet, setShowBottomSheet] = useState(true)

    const latLongStringifier = (latLong: LatLng | null): string => {
        if (!latLong) return "No location set";
        return `${latLong.latitude.toFixed(6)}, ${latLong.longitude.toFixed(6)}`;
    };

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy < -50) {
                    setShowBottomSheet(true);
                }
            },
        })
    ).current;

    return (
        <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
            <Stack.Screen options={{ headerShown: false }} />
            <NativeMap/>
            {showBottomSheet && (
                <Pressable style={styles.bottomSheet} onPress={() => setIsPinPlacementEnabled(false)}>
                    <View
                        onStartShouldSetResponder={() => true}
                    >
                        <View style={styles.bottomSheetTopRow}>
                            <Text style={styles.bottomSheetTitleText}>Directions</Text>
                            <Pressable onPress={() => setShowBottomSheet(false)}>
                                <Ionicons name={'close-circle'} color={'white'} size={30}></Ionicons>
                            </Pressable>
                        </View>

                        <View style={styles.bottomSheetRow}>
                            <View style={styles.pointInputBox}>
                                <View style={styles.pointInputContainer}>
                                    <TouchableOpacity onPress={() => {
                                        setIsPinPlacementEnabled(true);
                                        setIsPointAB(true);
                                    }}>
                                        <View style={styles.pointInputRow}>
                                            <View style={styles.pointInputIcon}>
                                                <Ionicons name={'navigate-circle-outline'} color="blue" size={18} />
                                            </View>
                                            <Text style={styles.pointInputText}>{latLongStringifier(pointA)}</Text>
                                        </View>
                                    </TouchableOpacity>

                                    <View style={styles.line}></View>

                                    <TouchableOpacity onPress={() => {
                                        setIsPinPlacementEnabled(true);
                                        setIsPointAB(false);
                                    }}>
                                        <View style={styles.pointInputRow}>
                                            <View style={styles.pointInputIcon}>
                                                <Ionicons name={'location-outline'} color="blue" size={18} />
                                            </View>
                                            <Text style={styles.pointInputText}>{latLongStringifier(pointB)}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                        <View style={styles.bottomSheetRow}>
                            <TouchableOpacity style={styles.calculateButton}>
                                <Text>Calculate Price</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Pressable>
            )}
        </SafeAreaView>
    );
}

export default function MapScreen() {
    return (
        <MapPointsProvider>
            <MapScreenContent></MapScreenContent>
        </MapPointsProvider>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
        position: 'relative',
    },
    map: {
        flex: 1,
        position: 'relative',
    },

    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '48%',
        backgroundColor: '#303030',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: -2 },
        elevation: 5,
    },

    bottomSheetTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },

    bottomSheetTitleText: {
        color: 'white',
        textAlign: 'left',
        fontSize: 24,
        fontWeight: '600',
    },

    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#919191ff',
        justifyContent: 'center',
        alignItems: 'center',
    },

    bottomSheetRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 12,
    },

    pointInputBox: {
        backgroundColor: '#D9D9D9',
        padding: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'stretch',
    },

    pointInputIcon: {
        width: '10%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    pointInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },

    pointInputContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
    },

    pointInputText: {
        fontWeight: 'bold',
        color: '#000',
        fontSize: 16,
        width: "90%"
    },

    calculateButton: {
        backgroundColor: '#FFCC66',
        padding: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    },

    line: {
        height: 1,
        backgroundColor: '#6C6C6C',
        width: '100%',
        marginVertical: 4,
    },
});
