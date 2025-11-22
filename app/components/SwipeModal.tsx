import { useEffect, useRef } from "react";
import { Animated, Dimensions, Modal, PanResponder, StyleSheet, TouchableOpacity, View } from "react-native";

const { height: screenHeight } = Dimensions.get("window");

type Props = {
    isVisible: boolean;
    onClose: () => void;
    height: number | `${number}%` | "auto";
    children?: React.ReactNode;
};

export default function SwipeModal({ isVisible, onClose, children, height }: Readonly<Props>) {
    const translateY = useRef(new Animated.Value(screenHeight)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, g) => g.dy > 0,
            onPanResponderMove: (_, g) => {
                if (g.dy > 0) translateY.setValue(g.dy);
            },
            onPanResponderRelease: (_, g) => {
                if (g.dy > 100) {
                    Animated.parallel([
                        Animated.timing(translateY, {
                            toValue: screenHeight,
                            duration: 300,
                            useNativeDriver: true
                        }),
                        Animated.timing(overlayOpacity, {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: true
                        })
                    ]).start(onClose);
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true
                    }).start();
                }
            }
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
                    useNativeDriver: true
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true
                })
            ]).start();
        } else {
            overlayOpacity.setValue(0);
            translateY.setValue(screenHeight);
        }
    }, [isVisible]);

    return (
        <Modal transparent visible={isVisible} animationType="none">
            <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFillObject}
                    activeOpacity={1}
                    onPress={() => {
                        Animated.parallel([
                            Animated.timing(translateY, {
                                toValue: screenHeight,
                                duration: 300,
                                useNativeDriver: true
                            }),
                            Animated.timing(overlayOpacity, {
                                toValue: 0,
                                duration: 300,
                                useNativeDriver: true
                            })
                        ]).start(onClose);
                    }}
                />

                <Animated.View
                    style={[
                        styles.modalContent,
                        { height, transform: [{ translateY }] }
                    ]}
                    {...panResponder.panHandlers}
                >

                    <View style={styles.dragIndicator} />
                    {children}
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end"
    },
    modalContent: {
        height: "50%",
        width: "100%",
        backgroundColor: "#303030",
        borderTopLeftRadius: 59,
        borderTopRightRadius: 59,
        paddingHorizontal: 30,
        paddingVertical: 15
    },
    dragIndicator: {
        width: 80,
        height: 4,
        backgroundColor: "#ccc",
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 15
    }
});
