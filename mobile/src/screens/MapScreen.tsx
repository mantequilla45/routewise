import React, { useContext } from 'react';
import {
    StyleSheet,
    Pressable,
    Text,
    View,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapComponent } from '../components/Map/MapComponent';
import { MapPointsProvider, MapPointsContext } from '../context/MapPointContext';
import { latLongStringifier } from '../lib/helper/latLongStringifier';
import { findJeepneyPath } from '../services/supabase/DistanceRPC';

const MapScreenContent = () => {

    const { setIsPointAB, setIsPinPlacementEnabled, pointA, pointB } = useContext(MapPointsContext)

    const handleCalculateDistance = () => {
        findJeepneyPath(pointA, pointB);
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.mapContainer}>
                <MapComponent />
                <Pressable style={styles.bottomSheet} onPress={() => setIsPinPlacementEnabled(false)}>
                    <View
                        onStartShouldSetResponder={() => true}
                    >
                        <View style={styles.bottomSheetTopRow}>
                            <Text style={styles.bottomSheetTitleText}>Directions</Text>
                            <View style={styles.closeButton}>
                                <Text style={{ color: 'white', fontWeight: '700' }}>X</Text>
                            </View>
                        </View>

                        <View style={styles.bottomSheetRow}>
                            <View style={styles.pointInputBox}>
                                <View style={styles.pointInputIcon}>
                                    {/* Icon */}
                                </View>
                                <View style={styles.pointInputContainer}>
                                    <TouchableOpacity onPress={() => {
                                        setIsPinPlacementEnabled(true);
                                        setIsPointAB(true);
                                    }}>
                                        <Text style={styles.pointInputText}> {latLongStringifier(pointA)}</Text>
                                    </TouchableOpacity>

                                    <View style={styles.line}></View>

                                    <TouchableOpacity onPress={() => {
                                        setIsPinPlacementEnabled(true);
                                        setIsPointAB(false);
                                    }}>
                                        <Text style={styles.pointInputText}> {latLongStringifier(pointB)}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                        <View style={styles.bottomSheetRow}>
                            <TouchableOpacity style={styles.calculateButton} onPress={handleCalculateDistance}>
                                <Text>Calculate Price</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Pressable>
            </View>
        </SafeAreaView>
    );
};

const MapScreen = () => {
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
    },
    button: {
        padding: 10,
        margin: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
    },
    mapContainer: {
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

export default MapScreen;