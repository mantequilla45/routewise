import MapModalContent from '@/components/Map/LocationSelector/SelectorContent';
import NativeMap from '@/components/Map/NativeMap';
import SwipeModal from '@/components/SwipeModal';
import { MapPointsContext, MapPointsProvider } from '@/context/map-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function MapScreenContent() {
    const { isPinPlacementEnabled, setIsPinPlacementEnabled } = useContext(MapPointsContext);
    const [showBottomSheet, setShowBottomSheet] = useState(true)
    const [prevPinPlacement, setPrevPinPlacement] = useState(false)

    // Auto-reopen modal after location selection
    useEffect(() => {
        if (prevPinPlacement && !isPinPlacementEnabled) {
            // Pin placement just finished, reopen the modal
            setTimeout(() => {
                setShowBottomSheet(true);
            }, 300);
        }
        setPrevPinPlacement(isPinPlacementEnabled);
    }, [isPinPlacementEnabled, prevPinPlacement]);

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
                }}
                {...panResponder.panHandlers}
            />
            <TouchableOpacity
                style={styles.arrowButton}
                onPress={() => setShowBottomSheet(true)}
                activeOpacity={0.8}
            >
                <Ionicons name="chevron-up" size={24} color="#303030" />
            </TouchableOpacity>
            <SwipeModal
                isVisible={showBottomSheet}
                onClose={() => setShowBottomSheet(false)}
                height={'80%'}
            >
                <MapModalContent exit={() => setShowBottomSheet(false)} setShowBottomSheet={setShowBottomSheet}></MapModalContent>
            </SwipeModal>
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
    arrowButton: {
        position: 'absolute',
        bottom: 140,
        alignSelf: 'center',
        backgroundColor: '#FFCC66',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});
