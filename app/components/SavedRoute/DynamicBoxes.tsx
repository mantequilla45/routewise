import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SavedRoute } from '@/app/(tabs)/saved';

interface DynamicBoxesProps {
    routes: SavedRoute[];
    onToggleFavorite: (id: string) => void;
    onRouteSelect?: (route: SavedRoute) => void;
    onDelete?: (id: string) => void;
}

export default function DynamicBoxes({ routes, onToggleFavorite, onRouteSelect, onDelete }: DynamicBoxesProps) {
    const renderRoute = ({ item }: { item: SavedRoute }) => (
        <TouchableOpacity 
            onPress={() => onRouteSelect && onRouteSelect(item)}
            activeOpacity={0.7}
        >
            <View style={styles.routeBox}>
                <View style={styles.routeHeader}>
                    <View style={styles.jeepCodeContainer}>
                        <Text style={styles.jeepCode}>{item.jeepCode}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        {item.totalFare && (
                            <View style={styles.fareContainer}>
                                <Text style={styles.fareText}>₱{item.totalFare}</Text>
                            </View>
                        )}
                        <TouchableOpacity 
                            onPress={(e) => {
                                e.stopPropagation(); // Prevent triggering route selection
                                onDelete && onDelete(item.id);
                            }}
                        >
                            <Ionicons
                                name="trash-outline"
                                size={24}
                                color="#FF6B6B"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.routeDetails}>
                    <View style={styles.locationRow}>
                        <Ionicons name="location" size={16} color="#4CAF50" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {item.start}
                        </Text>
                    </View>

                    <View style={styles.divider}>
                        <Ionicons name="arrow-down" size={16} color="#999" />
                    </View>

                    <View style={styles.locationRow}>
                        <Ionicons name="flag" size={16} color="#FF5722" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {item.destination}
                        </Text>
                    </View>
                </View>
                <View style={styles.tapHint}>
                    <Text style={styles.tapHintText}>Tap to view on map</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (routes.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="bookmark-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No saved routes yet</Text>
                <Text style={styles.emptySubtext}>Start saving your favorite routes!</Text>
            </View>
        );
    }

    return (
        <FlatList<SavedRoute>
            data={routes}
            renderItem={renderRoute}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
        />
    );
};

const styles = StyleSheet.create({
    listContent: {
    },
    routeBox: {
        backgroundColor: '#fff',
        marginBottom: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
        width: '100%',
    },
    routeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    fareContainer: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    fareText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2E7D32',
        fontFamily: 'Lexend_500Medium',
    },
    jeepCodeContainer: {
        backgroundColor: '#FFCC66',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    jeepCode: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        fontFamily: 'Lexend_500Medium',
    },
    routeDetails: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        fontFamily: 'Lexend_400Regular',
    },
    divider: {
        paddingLeft: 20,
        paddingVertical: 4,
    },
    tapHint: {
        backgroundColor: '#F5F5F5',
        paddingVertical: 8,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    tapHintText: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'Lexend_300Light',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        marginTop: 16,
        fontFamily: 'Lexend_500Medium',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        fontFamily: 'Lexend_300Light',
    },
});