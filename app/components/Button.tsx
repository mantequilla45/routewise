import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";


type Props = {
    label: string,
    onPress?: () => void;
}

export default function Button({ label, onPress }: Props) {
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
                <Ionicons name='log-in' color="#2D2D2D" size={24} />
            </Pressable>
        </View>
    );
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