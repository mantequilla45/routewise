import Button from "@/components/Button";
import LoginModal from "@/components/LoginModal";
import { Image } from "expo-image";
import { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/hybrid-auth";
import { supabase } from "@/lib/supabase-client";
import * as SecureStore from 'expo-secure-store';
import { LOGO } from "@/constants";


export default function Account() {
    const { user, signOut, isLoading, updateUser, refreshProfile } = useAuth();
    const isVerified = !!(
        (user as any)?.email_confirmed_at ||
        // some auth providers use different field names
        (user as any)?.email_confirmed ||
        (user as any)?.confirmed_at ||
        (user as any)?.email_verified
    );
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [isEditingName, setIsEditingName] = useState<boolean>(false);
    const [nameValue, setNameValue] = useState<string>((user as any)?.name || '');
    const [isSavingName, setIsSavingName] = useState<boolean>(false);
    const nameInputRef = useRef<any>(null);
    const [isEditingCommuter, setIsEditingCommuter] = useState<boolean>(false);
    const [commuterValue, setCommuterValue] = useState<string>((user as any)?.commuter || '');
    const [isSavingCommuter, setIsSavingCommuter] = useState<boolean>(false);
    const commuterInputRef = useRef<any>(null);
    const [isEditingSection, setIsEditingSection] = useState<boolean>(false);
    const [isCommuterModalVisible, setIsCommuterModalVisible] = useState<boolean>(false);
    const commuterOptions = ['Regular', 'Student', 'PWD', 'Senior'];

    const openModal = () => {
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
    };

    const handleSignOut = async () => {
        await signOut();
    };

    const handleSaveAll = async () => {
        const originalName = (user as any)?.name || '';
        const originalCommuter = (user as any)?.commuter || '';
        
        // Save name if it changed
        if (nameValue !== originalName) {
            await saveName(nameValue);
        }
        
        // Save commuter if it changed
        if (commuterValue !== originalCommuter) {
            await saveCommuter(commuterValue);
        }
        
        setIsEditingName(false);
        setIsEditingCommuter(false);
        setIsEditingSection(false);
    };

    // Keep local nameValue in sync when user changes externally
    useEffect(() => {
        setNameValue((user as any)?.name || '');
    }, [user]);

    // Focus the input when entering edit mode
    useEffect(() => {
        if (isEditingName) {
            setTimeout(() => nameInputRef.current?.focus?.(), 100);
        }
    }, [isEditingName]);

    // Debounced auto-save when typing stops
    useEffect(() => {
        if (!isEditingName || !isEditingSection) return;
        // No auto-save - only save on button click
    }, [nameValue]);

    // Keep local commuterValue in sync when user changes externally
    useEffect(() => {
        setCommuterValue((user as any)?.commuter || '');
    }, [user]);

    // Focus the input when entering commuter edit mode
    useEffect(() => {
        if (isEditingCommuter) {
            setTimeout(() => commuterInputRef.current?.focus?.(), 100);
        }
    }, [isEditingCommuter]);

    // Debounced auto-save for commuter when typing stops
    useEffect(() => {
        if (!isEditingCommuter || !isEditingSection) return;
        // No auto-save - only save on button click
    }, [commuterValue]);

    async function saveName(newName: string) {
        try {
            if (!user) return;
            const currentName = (user as any)?.name || '';
            if (newName === currentName) return;
            setIsSavingName(true);

            const userId = (user as any)?.id;
            let query = supabase.from('users').update({ full_name: newName });
            if (userId) {
                query = query.eq('id', userId);
            } else if ((user as any)?.email) {
                query = query.eq('email', (user as any).email);
            }

            const { data, error } = await query.select().maybeSingle();
            if (error) {
                console.warn('Failed saving name:', error);
            } else {
                // Update stored user_data so other app parts that read it later see the change
                try {
                    const stored = await SecureStore.getItemAsync('user_data');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        parsed.name = newName;
                        await SecureStore.setItemAsync('user_data', JSON.stringify(parsed));
                    }
                } catch (e) {
                    console.warn('Failed updating SecureStore user_data:', e);
                }

                // Update auth context so app-wide `user` reflects the new name
                try {
                    await (updateUser?.({ name: newName }));
                    // Re-fetch authoritative profile from DB to capture other fields
                    await refreshProfile?.();
                } catch (e) {
                    // ignore
                }
            }
        } catch (e) {
            console.warn('saveName error', e);
        } finally {
            setIsSavingName(false);
        }
    }

    async function saveCommuter(newCommuter: string) {
        try {
            if (!user) return;
            const current = (user as any)?.commuter || '';
            if (newCommuter === current) return;
            setIsSavingCommuter(true);

            const userId = (user as any)?.id;
            let query = supabase.from('users').update({ commuter: newCommuter });
            if (userId) {
                query = query.eq('id', userId);
            } else if ((user as any)?.email) {
                query = query.eq('email', (user as any).email);
            }

            const { data, error } = await query.select().maybeSingle();
            if (error) {
                console.warn('Failed saving commuter:', error);
            } else {
                try {
                    const stored = await SecureStore.getItemAsync('user_data');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        parsed.commuter = newCommuter;
                        await SecureStore.setItemAsync('user_data', JSON.stringify(parsed));
                    }
                } catch (e) {
                    console.warn('Failed updating SecureStore commuter:', e);
                }

                // Update auth context so app-wide `user` reflects the new commuter
                try {
                    await (updateUser?.({ commuter: newCommuter }));
                    // Re-fetch authoritative profile from DB to capture other fields
                    await refreshProfile?.();
                } catch (e) {
                    // ignore
                }
            }
        } catch (e) {
            console.warn('saveCommuter error', e);
        } finally {
            setIsSavingCommuter(false);
        }
    }

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
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Account Information</Text>
                        <TouchableOpacity onPress={() => isEditingSection ? handleSaveAll() : setIsEditingSection(true)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 }}>
                            <Ionicons name="pencil" size={16} color="#4CAF50" />
                            <Text style={{ marginLeft: 4, fontSize: 12, color: '#4CAF50', fontFamily: 'Lexend_600SemiBold' }}>{isEditingSection ? 'Save' : 'Edit'}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{user.email}</Text>
                    </View>
                    <View style={[styles.infoRow, isEditingSection && styles.infoRowActive]}>
                        <Text style={styles.infoLabel}>Name</Text>
                        {isEditingSection && isEditingName ? (
                            <TextInput
                                ref={nameInputRef}
                                value={nameValue}
                                onChangeText={setNameValue}
                                onBlur={() => { setIsEditingName(false); saveName(nameValue); }}
                                onSubmitEditing={() => { setIsEditingName(false); saveName(nameValue); }}
                                style={[styles.infoValue, styles.nameInput]}
                                returnKeyType="done"
                            />
                        ) : isEditingSection ? (
                            <TouchableOpacity onPress={() => setIsEditingName(true)} style={{ flex: 1, alignItems: 'flex-end' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.infoValue}>{nameValue || 'Not provided'}</Text>
                                    {isSavingName && <ActivityIndicator size="small" style={{ marginLeft: 8 }} />}
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.infoValue}>{nameValue || 'Not provided'}</Text>
                                {isSavingName && <ActivityIndicator size="small" style={{ marginLeft: 8 }} />}
                            </View>
                        )}
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email Verified</Text>
                        <Text style={styles.infoValue}>{isVerified ? 'Yes' : 'No'}</Text>
                    </View>
                    <View style={[styles.infoRow, isEditingSection && styles.infoRowActive]}>
                        <Text style={styles.infoLabel}>Commuter Type</Text>
                        {isEditingSection ? (
                            <TouchableOpacity onPress={() => setIsCommuterModalVisible(true)} style={{ flex: 1, alignItems: 'flex-end' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.infoValue}>{commuterValue || 'Not provided'}</Text>
                                    {isSavingCommuter && <ActivityIndicator size="small" style={{ marginLeft: 8 }} />}
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.infoValue}>{commuterValue || 'Not provided'}</Text>
                                {isSavingCommuter && <ActivityIndicator size="small" style={{ marginLeft: 8 }} />}
                            </View>
                        )}
                    </View>

                    <Modal
                        visible={isCommuterModalVisible}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setIsCommuterModalVisible(false)}
                    >
                        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '80%' }}>
                                <Text style={{ fontSize: 18, fontFamily: 'Lexend_600SemiBold', marginBottom: 20, textAlign: 'center' }}>Select Commuter Type</Text>
                                {commuterOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        onPress={() => {
                                            setCommuterValue(option);
                                            setIsCommuterModalVisible(false);
                                        }}
                                        style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}
                                    >
                                        <Text style={{ fontSize: 16, fontFamily: 'Lexend_400Regular', color: commuterValue === option ? '#4CAF50' : '#333' }}>
                                            {option}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    onPress={() => setIsCommuterModalVisible(false)}
                                    style={{ paddingVertical: 12, marginTop: 12 }}
                                >
                                    <Text style={{ fontSize: 16, fontFamily: 'Lexend_600SemiBold', color: '#f44336', textAlign: 'center' }}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
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
        marginTop: 50
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
    infoRowActive: {
        backgroundColor: '#f0f8f0',
        borderBottomColor: '#4CAF50',
        borderBottomWidth: 2,
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
    nameInput: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: '#333',
        textAlign: 'right',
        minWidth: 120,
        padding: 0,
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