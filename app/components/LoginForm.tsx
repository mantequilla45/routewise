import { View, Text, Button, StyleSheet } from "react-native";

import { useAuth } from "@/context/auth";

export default function LoginForm() {
    const { signIn } = useAuth();
    return (
        <View style={styles.container}>
            <Text>Login</Text>
            <Button title="Sign in with Google" onPress={signIn} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
})