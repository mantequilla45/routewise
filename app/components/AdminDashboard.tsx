import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';

interface UserStats {
    total_users: number;
    users_last_24h: number;
    users_last_7d: number;
    users_last_30d: number;
    active_last_24h: number;
    active_last_7d: number;
    google_users: number;
    phone_users: number;
    todays_signups: number;
}

interface RecentUser {
    id: string;
    email: string;
    full_name?: string;
    created_at: string;
    last_login?: string;
    login_count: number;
    auth_provider?: string;
    commuter_type?: string;
    is_admin: boolean;
}

interface AdminDashboardProps {
    onClose?: () => void;
}

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStatistics();
    }, []);

    async function loadStatistics() {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/stats');
            
            if (!response.ok) {
                throw new Error('Failed to load statistics');
            }
            
            const data = await response.json();
            setStats(data.statistics);
            setRecentUsers(data.recentUsers || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading statistics...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.error}>Error: {error}</Text>
                <Pressable style={styles.retryButton} onPress={loadStatistics}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>User Analytics</Text>
                {onClose && (
                    <Pressable style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </Pressable>
                )}
            </View>
            
            {stats && (
                <>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.total_users}</Text>
                            <Text style={styles.statLabel}>Total Users</Text>
                        </View>
                        
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.todays_signups}</Text>
                            <Text style={styles.statLabel}>Today</Text>
                        </View>
                        
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.users_last_7d}</Text>
                            <Text style={styles.statLabel}>Last 7 days</Text>
                        </View>
                        
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.active_last_24h}</Text>
                            <Text style={styles.statLabel}>Active (24h)</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.google_users}</Text>
                            <Text style={styles.statLabel}>Google Auth</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.phone_users}</Text>
                            <Text style={styles.statLabel}>Phone Auth</Text>
                        </View>
                    </View>

                    <Text style={styles.subtitle}>Recent Signups</Text>
                    {recentUsers.map((user) => (
                        <View key={user.id} style={styles.userCard}>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>
                                    {user.full_name || 'No name'}
                                    {user.is_admin && <Text style={styles.adminBadge}> (Admin)</Text>}
                                </Text>
                                <Text style={styles.userEmail}>{user.email}</Text>
                                <Text style={styles.userMeta}>
                                    Joined: {new Date(user.created_at).toLocaleDateString()}
                                    {' • '}
                                    Logins: {user.login_count}
                                    {user.auth_provider && ' • ' + user.auth_provider}
                                    {user.commuter_type && ' • ' + user.commuter_type}
                                </Text>
                            </View>
                        </View>
                    ))}

                    <Pressable style={styles.refreshButton} onPress={loadStatistics}>
                        <Text style={styles.refreshButtonText}>Refresh Data</Text>
                    </Pressable>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e9ecef',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 18,
        color: '#495057',
    },
    subtitle: {
        fontSize: 22,
        fontWeight: '600',
        marginTop: 30,
        marginBottom: 15,
        color: '#343a40',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    statLabel: {
        fontSize: 14,
        color: '#6c757d',
        marginTop: 5,
        textAlign: 'center',
    },
    userCard: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    adminBadge: {
        color: '#dc3545',
        fontWeight: 'bold',
    },
    userEmail: {
        fontSize: 14,
        color: '#495057',
        marginTop: 4,
    },
    userMeta: {
        fontSize: 12,
        color: '#6c757d',
        marginTop: 8,
    },
    loadingText: {
        marginTop: 10,
        color: '#6c757d',
        fontSize: 16,
    },
    error: {
        color: '#dc3545',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignSelf: 'center',
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    refreshButton: {
        backgroundColor: '#28a745',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        alignSelf: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    refreshButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});