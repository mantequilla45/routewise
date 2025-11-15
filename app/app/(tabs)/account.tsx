import Button from "@/components/Button";
import LoginModal from "@/components/LoginModal";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "@/context/hybrid-auth";
import { LOGO } from "@/constants";


export default function Account() {
    const { user, signOut, isLoading } = useAuth();
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

    const openModal = () => {
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
    };

    const handleSignOut = async () => {
        await signOut();
    };

    // Show loading state
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    // Show profile if user is signed in
    if (user) {
        return (
            <ScrollView style={styles.profileContainer}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {user.picture ? (
                            <Image
                                source={{ uri: user.picture }}
                                style={styles.avatar}
                                contentFit="cover"
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.userName}>{user.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    {user.provider && (
                        <View style={styles.providerBadge}>
                            <Text style={styles.providerText}>Signed in with {user.provider}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.profileSection}>
                    <Text style={styles.sectionTitle}>Account Information</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{user.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Name</Text>
                        <Text style={styles.infoValue}>{user.name || 'Not provided'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email Verified</Text>
                        <Text style={styles.infoValue}>
                            {user.email_verified ? 'Yes' : 'No'}
                        </Text>
                    </View>
                </View>

                <View style={styles.actionSection}>
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    // Show sign up screen if user is not signed in
    return (
        <View style={styles.container}>
            <Image source={LOGO} style={styles.logo} contentFit="contain" />
            <Text style={styles.heading}>
                Sign up now!
            </Text>
            <Text style={styles.paragraph}>
                Create an account to save your routes, activities, and many more.
            </Text>
            <View>
                <Button label="Sign Up" onPress={openModal} theme="primary" />
            </View>
            <LoginModal isVisible={isModalVisible} onClose={closeModal}>

            </LoginModal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'flex-start',
        paddingHorizontal: 40,
        paddingTop: 100,
        gap: 12,
    },
    logo: {
        width: '100%',
        height: 90,
    },
    heading: {
        fontSize: 24,
        fontFamily: 'Lexend_400Regular',
    },
    paragraph: {
        fontSize: 18,
        fontFamily: 'Lexend_300Light',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    profileHeader: {
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingVertical: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    avatarContainer: {
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 40,
        color: '#fff',
        fontFamily: 'Lexend_600SemiBold',
    },
    userName: {
        fontSize: 24,
        fontFamily: 'Lexend_600SemiBold',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 16,
        fontFamily: 'Lexend_300Light',
        color: '#666',
    },
    providerBadge: {
        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: '#e8f5e9',
        borderRadius: 12,
    },
    providerText: {
        fontSize: 12,
        fontFamily: 'Lexend_400Regular',
        color: '#4CAF50',
    },
    profileSection: {
        backgroundColor: '#fff',
        marginTop: 20,
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Lexend_600SemiBold',
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoLabel: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: '#666',
    },
    infoValue: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: '#333',
    },
    actionSection: {
        paddingHorizontal: 20,
        paddingVertical: 30,
    },
    signOutButton: {
        backgroundColor: '#f44336',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    signOutText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Lexend_600SemiBold',
    },
});