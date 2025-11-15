import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";


type Props = {
    label: string,
    onPress?: () => void;
    theme?: 'primary' | 'secondary' | 'tags';
}

export default function Button({ label, onPress, theme }: Props) {
    if (theme === 'primary') {
        return (
            <View style={[styles.buttonContainer, {
                borderRadius: 25,
            }]}>
                <Pressable
                    style={[
                        styles.button,
                        { backgroundColor: '#FFCC66', borderRadius: 25, }
                    ]}
                    onPress={onPress}
                >
                    <Text style={styles.buttonLabel}>{label}</Text>
                </Pressable>
            </View>
        );
    }

    else if (theme === 'secondary') {
    }

    else if (theme === 'tags') {
        return (
            <View style={[styles.buttonContainer, {
                borderRadius: 25,
                width: 'auto',
                height: 'auto'
            }]}>
                <Pressable
                    style={[
                        styles.button,
                        { backgroundColor: '#FFCC66', borderRadius: 25, width: 'auto', height: 'auto', paddingHorizontal: 25, paddingVertical: 10, }
                    ]}
                    onPress={onPress}
                >
                    <Text style={[styles.buttonLabel, { fontSize: 14, fontFamily: 'Lexend_400Regular' }]}>{label}</Text>
                </Pressable>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    buttonContainer: {
        width: 240,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        shadowRadius: 25,
    },
    button: {
        borderRadius: 10,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    buttonLabel: {
        fontFamily: 'Lexend_400Regular',
        fontSize: 16,
        color: '#2D2D2D',
        marginRight: 5,
    }
});