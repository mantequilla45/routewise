import MapModalContent from '@/components/Map/Modal/MapModalContent';
import NativeMap from '@/components/Map/NativeMap';
import SwipeModal from '@/components/SwipeModal';
import { MapPointsProvider } from '@/context/map-context';
import { Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
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
                }}
                {...panResponder.panHandlers}
            />
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
});
