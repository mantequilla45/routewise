import { useAuth } from "@/context/hybrid-auth";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Modal, PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

const { height: screenHeight } = Dimensions.get('window');


type Props = PropsWithChildren<{
    isVisible: boolean;
    onClose: () => void;
}>;

export default function LoginModal({ isVisible, onClose }: Props) {

    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
    const translateY = useRef(new Animated.Value(screenHeight)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;


    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dy > 0;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    // Fade out overlay while sliding down
                    Animated.parallel([
                        Animated.timing(translateY, {
                            toValue: screenHeight,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                        Animated.timing(overlayOpacity, {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: true,
                        })
                    ]).start(() => {
                        onClose();
                    });
                } else {
                    // Snap back
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (isVisible) {
            overlayOpacity.setValue(0);
            translateY.setValue(screenHeight);
            Animated.parallel([
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            overlayOpacity.setValue(0);
            translateY.setValue(screenHeight);
        }
    }, [isVisible]);



    const { user, isLoading, signOut } = useAuth();

    // Close modal when user signs in successfully
    useEffect(() => {
        if (user && isVisible) {
            onClose();
        }
    }, [user, isVisible, onClose]);

    return (
        <View>
            <Modal animationType="none" transparent={true} visible={isVisible}>
                <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}>
                    {/* Invisible overlay to detect taps */}
                    <TouchableOpacity
                        style={StyleSheet.absoluteFillObject}
                        activeOpacity={1}
                        onPress={() => {
                            // Same animation as your swipe dismiss
                            Animated.parallel([
                                Animated.timing(translateY, {
                                    toValue: screenHeight,
                                    duration: 300,
                                    useNativeDriver: true,
                                }),
                                Animated.timing(overlayOpacity, {
                                    toValue: 0,
                                    duration: 300,
                                    useNativeDriver: true,
                                })
                            ]).start(() => {
                                onClose();
                            });
                        }}
                    />

                    {/* Modal content - NOT wrapped in TouchableOpacity */}
                    <Animated.View
                        style={[
                            styles.loginModalContent,
                            { transform: [{ translateY }] }
                        ]}
                        {...panResponder.panHandlers}
                    >
                        <View style={styles.dragIndicator} />
                        <View style={styles.loginSelector}>
                            <TouchableOpacity style={[styles.loginSwitch, activeTab === 'login' && styles.activeSwitch]} onPress={() => setActiveTab('login')}>
                                <Text style={[styles.switchText, activeTab === 'login' && styles.activeText]}>
                                    Login
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.loginSwitch, activeTab === 'signup' && styles.activeSwitch]} onPress={() => setActiveTab('signup')}>
                                <Text style={[styles.switchText, activeTab === 'signup' && styles.activeText]}>
                                    Signup
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.contentContainer}>
                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#FFCC66" />
                                    <Text style={styles.loadingText}>Signing in...</Text>
                                </View>
                            ) : (
                                activeTab === 'login' ? (
                                    <LoginForm />
                                ) : (
                                    <SignupForm />
                                )
                            )}
                        </View>
                    </Animated.View>
                </Animated.View>
            </Modal >
        </View >
    );

}

const styles = StyleSheet.create({
    loginModalContent: {
        height: '70%',
        width: '100%',
        backgroundColor: '#303030',
        borderTopRightRadius: 59,
        borderTopLeftRadius: 59,
        overflow: 'hidden',
        position: 'absolute',
        bottom: 0,
        paddingVertical: 15,
        paddingHorizontal: 34,
    },
    loginSelector: {
        flexDirection: 'row',
        backgroundColor: '#404040',
        borderRadius: 50,
        padding: 8,
    },
    loginSwitch: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 50,
        alignItems: 'center',
    },
    activeSwitch: {
        backgroundColor: '#FFCC66',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    activeText: {
        color: '#303030',
        fontWeight: '600',
        fontFamily: 'Lexend_500Medium',

    },
    switchText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
        fontFamily: 'Lexend_400Regular'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    dragIndicator: {
        width: 80,
        height: 4,
        backgroundColor: '#ccc',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 15,
    },
    contentContainer: {
        flex: 1,
        marginTop: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 16,
        fontFamily: 'Lexend_400Regular',
    },
    signupContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    signupText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'Lexend_400Regular',
    }
});