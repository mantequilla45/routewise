import Button from "@/components/Button";
import LoginModal from "@/components/LoginModal";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const LogoImage = require('@/assets/logo/logo.svg');

export default function Account() {

    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

    const openModal = () => {
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <Image source={LogoImage} style={styles.logo} contentFit="contain" />
            <Text style={styles.heading}>
                Sign up now!
            </Text>
            <Text style={styles.paragraph}>
                Create an account to save your routes, activities, and many more.
            </Text>
            <View>
                <Button label="Sign Up" onPress={openModal} />
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
    }
});