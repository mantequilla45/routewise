import { useAuth } from "@/context/hybrid-auth";
import React, { useState } from "react";
import { View, Text, Button, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // install with expo: expo install @expo/vector-icons
export default function LoginForm() {
    const { signIn } = useAuth();
    const [passwordVisible, setPasswordVisible] = useState(false); // toggle password visibility
    const [checked, setChecked] = useState(false);

    return (
        <View style={styles.container}>
            {/* // EMAIL CONTAINER
                // EMAIL RELATED STUFF IS HERE */}
            <View style={styles.emailcontainer} >
                <Text style={styles.text}> Email </Text>
                <TextInput style={styles.emailtextbox} placeholder="email@example.com" placeholderTextColor="#585756" />
            </View>

            {/* // PASSWORD CONTAINER
                // PASSWORD RELATED STUFF IS HERE */}
            <View style={styles.passwordcontainer}>
                <Text style={styles.text}> Password </Text>
                <View style={styles.passwordWrapper}>
                    <TextInput
                        style={styles.passwordtextbox}       // <- your existing style
                        placeholder="Password"
                        placeholderTextColor="#585756"
                        secureTextEntry={!passwordVisible}  // hide/show
                    />
                    <TouchableOpacity
                        onPress={() => setPasswordVisible(!passwordVisible)}
                        style={styles.eyeButton}
                    >
                        <Ionicons
                            name={passwordVisible ? "eye" : "eye-off"}
                            size={24}
                            color="#585756"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* // THIRD CONTAINER 
                // CONTAINS REMEMBER ME AND FORGOT PASSWORD */}
            <View style={styles.thirdcontainer}>
                <View style={styles.firsthalf}>
                    <TouchableOpacity onPress={() => setChecked(!checked)}>
                        <Ionicons
                            name={checked ? "checkbox" : "square-outline"}
                            size={24}
                            color={checked ? "#FFFFFF" : "#585756"} 
                        />
                    </TouchableOpacity>

                    <Text style={styles.rememberText}>
                        Remember me
                    </Text>
                </View>

                <View style={styles.secondhalf}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                </View>
            </View>
            
            {/* // LOGIN BUTTON */}
            <TouchableOpacity style={styles.loginbutton}>
                <Text style={styles.loginbuttonText}>Log In</Text>
            </TouchableOpacity>

            {/* // divider rani para sa or login with */}
            <View style={styles.dividerContainer}>
                <Text style={styles.dividerText}>or login with</Text>
            </View>

            {/* // GOOGLE LOGIN BUTTON */}
            <TouchableOpacity style={styles.googlebutton} onPress={signIn}>
                <Text style={styles.googlebuttonText}>Google</Text>
            </TouchableOpacity>

            {/* // TERMS OF SERVICE AND DATA PROCESSING AGREEMENT */}
            <Text style={styles.dividersText}>
                By signing up, you agree to the{' '}
            <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                <Text style={styles.linkText}>Data Processing Agreement</Text>
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    emailcontainer: {
        flexDirection: 'column',       // stack children vertically
        justifyContent: 'flex-start',  // start content from top
        alignItems: 'stretch',         // stretch inputs to full width (or use 'flex-start' to align left)
        paddingBottom: 10,             // space at the bottom
    },
    passwordcontainer: {
        flexDirection: 'column',       // stack children vertically
        justifyContent: 'flex-start',  // start content from top
        alignItems: 'stretch',         // stretch inputs to full width (or use 'flex-start' to align left)
        paddingBottom: 10,             // space at the bottom
    },
    text: {
        fontFamily: 'Lexend_400Regular',
        fontSize: 16,
        fontWeight: '400', // normal
        lineHeight: 12 * 1.6,   // 160% → React Native needs a number, not %
        letterSpacing: -0.02 * 12, // -2% of font size
        color: '#FFFFFF',
        paddingBottom: 10,
    },
    emailtextbox: {
        fontSize: 16,
        fontFamily: 'Lexend_400Regular',
        paddingLeft: 10,        // 10px padding to the left
        borderWidth: 2,         // 2px border thickness
        borderColor: '#585756',    // default black border, change if you want
        borderRadius: 8,        // 8px corner radius
        height: 40,             // optional: keeps the box nicely sized
    },
    passwordWrapper: {
        flexDirection: 'row',      // input and eye icon in a row
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#585756',
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    passwordtextbox: {
        flex: 1,                   // fills the remaining space
        fontSize: 16,
        fontFamily: 'Lexend_400Regular',
        paddingVertical: 8,        // adjust instead of fixed height
    },
    eyeButton: {
        marginLeft: 10,
    },
    thirdcontainer: {
        flexDirection: 'row',       // side by side
        justifyContent: 'space-between', // optional: space between them
        alignItems: 'center',       // center vertically
        //  backgroundColor: '#FFFFFF', // white background
        paddingBottom: 10,
    },
    firsthalf: {
        flex: 1,                    // takes 50% of width
        // backgroundColor: '#f0f0f0', // optional: to see the box
        flexDirection: 'row',       // checkbox + text in a row
        alignItems: 'center',
    },
    rememberText: {
        fontFamily: 'Lexend_400Regular',
        fontSize: 16,
        color: '#FFFFFF',
        marginLeft: 4,              // spacing between icon and text
    },
    secondhalf: {
        flex: 1,                    // takes the other 50%
        // backgroundColor: '#d0d0d0', // optional: to see the box
    },
    forgotText: {
        fontFamily: 'Lexend_400Regular',
        fontSize: 16,
        color: '#FFCC66',       // golden color
        alignSelf: 'flex-end',  // right-aligned
        fontWeight: '700',      // bold
    },
    loginbutton: {
        paddingVertical: 10,
        paddingHorizontal: 40,
        borderRadius: 8,
        backgroundColor: '#4C4C4C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginbuttonText: {
        paddingVertical: 10,
        paddingHorizontal: 40,
        color: 'white',
        fontFamily: 'Lexend_400Regular',
        fontSize: 16,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 15,
    },
    dividerText: {
        fontFamily: 'Lexend_400Regular',
        fontSize: 12,
        color: '#FFFFFF',
    },
    dividersText: {
        fontFamily: 'Lexend_400Regular',
        fontSize: 12,
        color: '#FFFFFF',
        marginTop: 10,
        textAlign: 'center',
    },
    linkText: {
    color: '#888888',   // grey for links
    textDecorationLine: 'underline', // optional: makes it look clickable
    },
    googlebutton: {
    paddingVertical: 10,        // same height as login button
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',               // 50% of parent container width
    alignSelf: 'center',        // centers it horizontally
},
    googlebuttonText: {
        paddingVertical: 10,
        paddingHorizontal: 40,
        color: 'black',
        fontFamily: 'Lexend_400Regular',
        fontSize: 16,
    },
})
