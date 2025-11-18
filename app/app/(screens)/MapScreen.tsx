import NativeMap from '@/components/Map/NativeMap';
import SwipeModal from '@/components/SwipeModal';
import { LatLng, MapPointsContext, MapPointsProvider } from '@/context/map-context';
import Ionicons from '@expo/vector-icons/Ionicons';
//import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import { useContext, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function MapScreenContent() {

    const [showBottomSheet, setShowBottomSheet] = useState(true)

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: (_, g) => {
                return Math.abs(g.dy) > 10 && g.dy < 0;
            },

            onMoveShouldSetPanResponder: (_, g) => {
                return Math.abs(g.dy) > 10 && g.dy < 0;
            },

            onPanResponderRelease: (_, g) => {
                if (g.dy < -50) {
                    setShowBottomSheet(true);
                }
            }
        })
    ).current;


    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <NativeMap />
            <View
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "20%",
                    //backgroundColor: "red"
                }}
                {...panResponder.panHandlers}
            />
            <SwipeModal
                isVisible={showBottomSheet}
                onClose={() => setShowBottomSheet(false)}
                height={'50%'}
            >
                <ModalContent exit={() => setShowBottomSheet(false)} />
            </SwipeModal>
        </SafeAreaView>
    );
}

function ModalContent({ exit }: Readonly<{ exit: () => void }>) {
    const { setIsPointAB, setIsPinPlacementEnabled, pointA, pointB, setPointA } = useContext(MapPointsContext)

    const latLongStringifier = (latLong: LatLng | null): string => {
        if (!latLong) return "No location set";
        return `${latLong.latitude.toFixed(6)}, ${latLong.longitude.toFixed(6)}`;
    };

    /* Uncoment for location
    

    const getLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Location permission not granted');
                return;
            }

            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });

            setPointA({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            });
        } catch (error) {
            console.warn('Error getting location:', error);
        }
    };*/

    return (
        <Pressable onPress={() => setIsPinPlacementEnabled(false)}>
            <View
                onStartShouldSetResponder={() => true}
            >
                <View style={styles.bottomSheetTopRow}>
                    <Text style={styles.bottomSheetTitleText}>Directions</Text>
                    <Pressable onPress={exit}>
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
                                    <View style={styles.pointInputBlock}>
                                        <View style={styles.pointInputIconLeft}>
                                            <Ionicons name={'navigate-circle-outline'} color="blue" size={18} />
                                        </View>
                                        <Text style={styles.pointInputText}
                                            numberOfLines={1}
                                            ellipsizeMode="tail">
                                            {latLongStringifier(pointA)}
                                        </Text>
                                    </View>

                                    <View style={[styles.pointInputBlock, { justifyContent: 'flex-end' }]}>
                                        <Text style={styles.pointPickerText}
                                            numberOfLines={1}>
                                            Choose on Map
                                        </Text>
                                        <View style={styles.pointInputIconRight}>
                                            <Ionicons name={'globe-outline'} color={'black'} size={16} />
                                        </View>
                                    </View>
                                </View>

                            </TouchableOpacity>

                            <View style={styles.line}></View>

                            <TouchableOpacity onPress={() => {
                                setIsPinPlacementEnabled(true);
                                setIsPointAB(false);
                            }}>
                                <View style={styles.pointInputRow}>
                                    <View style={styles.pointInputBlock}>
                                        <View style={styles.pointInputIconLeft}>
                                            <Ionicons name={'location-outline'} color="blue" size={18} />
                                        </View>
                                        <Text style={styles.pointInputText}
                                            numberOfLines={1}
                                            ellipsizeMode="tail">
                                            {latLongStringifier(pointB)}
                                        </Text>

                                    </View>
                                    <View style={[styles.pointInputBlock, { justifyContent: 'flex-end' }]}>
                                        <Text style={styles.pointPickerText}
                                            numberOfLines={1}>
                                            Choose on Map
                                        </Text>
                                        <View style={styles.pointInputIconRight}>
                                            <Ionicons name={'globe-outline'} color={'black'} size={16} />
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                <View style={styles.bottomSheetRow}>
                    <TouchableOpacity style={styles.calculateButton}>
                        <Text style={styles.calculateButtonText}>Get Location</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSheetRow}>
                    <TouchableOpacity style={styles.calculateButton}>
                        <Text style={styles.calculateButtonText}>Calculate Price</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Pressable>
    )
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
        fontFamily: 'Lexend_500Medium'
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

    pointInputContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
    },

    pointInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 8,
    },

    pointInputBlock: {
        flexDirection: 'row',
        width: '50%'
    },

    pointInputIconLeft: {
        width: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },

    pointInputIconRight: {
        width: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },

    pointInputText: {
        fontWeight: 'bold',
        color: '#000',
        fontSize: 12,
        flexShrink: 1,
        fontFamily: 'Lexend_400Regular'
    },

    pointPickerText: {
        fontWeight: 'bold',
        color: '#000',
        fontSize: 12,
        flexShrink: 1,
        fontFamily: 'Lexend_300Light'
    },

    line: {
        height: 1,
        backgroundColor: '#6C6C6C',
        width: '100%',
        marginVertical: 4,
    },

    calculateButton: {
        height: 48,
        shadowRadius: 25,
        backgroundColor: '#FFCC66',
        padding: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    },

    calculateButtonText: {
        fontFamily: 'Lexend_400Regular',
        fontSize: 16,
        color: '#2D2D2D',
        marginRight: 5,
    }
});
