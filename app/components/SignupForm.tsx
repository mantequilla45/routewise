import { useAuth } from "@/context/hybrid-auth";
import React, { useState } from "react";
import { View, Text, Button, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // install with expo: expo install @expo/vector-icons
import { AntDesign } from '@expo/vector-icons';
import { supabase } from "@/lib/supabase-client";
import * as SecureStore from 'expo-secure-store';
export default function SignupForm() {

    const { signIn } = useAuth();
    const [passwordVisible, setPasswordVisible] = useState(false); // toggle password visibility

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    // Load saved credentials if user previously chose "Remember me"
    React.useEffect(() => {
        const loadSaved = async () => {
            try {
                const saved = await SecureStore.getItemAsync('saved_credentials');
                if (saved) {
                    const obj = JSON.parse(saved);
                    setEmail(obj.email || '');
                    setPassword(obj.password || '');
                    setRememberMe(true);
                }
            } catch (e) {
                console.warn('Failed to load saved credentials', e);
            }
        };

        loadSaved();
    }, []);

    const handleSignUp = async () => {
        if (!email || !password) {
            Alert.alert('Validation', 'Please provide email and password');
            return;
        }

        try {
            setLoading(true);

            // Sign up with Supabase Auth
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) {
                console.error('Sign up error:', error);
                // Detect rate limiting and provide actionable guidance
                const msg = (error.message || '').toString();
                if (error.status === 429 || /rate limit/i.test(msg)) {
                    Alert.alert(
                        'Email rate limit exceeded',
                        'Supabase rejected the confirmation email due to rate limits.\n\nOptions:\n• Wait a few minutes and try again.\n• Configure an SMTP provider in the Supabase Dashboard (Authentication → Settings → Email) so emails are sent from your own provider and not subject to the project demo quota.\n• For testing, create users server-side with a service-role key or temporarily disable email confirmations in your Auth settings.\n\nCheck Supabase logs for more details.'
                    );
                } else {
                    Alert.alert('Sign up failed', error.message || 'An error occurred');
                }
                return;
            }

            // Optionally, insert a user record into `users` table (if your DB table isn't populated by an auth trigger)
            try {
                const { error: insertError } = await supabase
                    .from('users')
                    .insert({
                        email,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    });

                if (insertError) {
                    console.warn('Could not insert user row:', insertError.message);
                }
            } catch (e) {
                console.warn('Insert users table error:', e);
            }

            // Remember credentials securely on device if requested
            if (rememberMe) {
                await SecureStore.setItemAsync('saved_credentials', JSON.stringify({ email, password }));
            } else {
                await SecureStore.deleteItemAsync('saved_credentials');
            }

            
        } catch (e) {
            console.error('Unexpected sign up error:', e);
            Alert.alert('Sign up failed', 'Unexpected error');
        } finally {
            setLoading(false);
        }
    };
    const [selectedType, setSelectedType] = useState("");
    const [openDropdown, setOpenDropdown] = useState(false);
    const commuterTypes = ["Regular", "Student", "PWD", "Senior"];

    return (
        <View style={styles.container}>
            {/* // EMAIL CONTAINER
                // EMAIL RELATED STUFF IS HERE */}
            <View style={styles.emailcontainer} >
                <Text style={styles.text}> Email </Text>
                <TextInput
                    style={styles.emailtextbox}
                    placeholder="email@example.com"
                    placeholderTextColor="#585756"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            {/* // PASSWORD CONTAINER
                // PASSWORD RELATED STUFF IS HERE */}
            <View style={styles.passwordcontainer}>
                <Text style={styles.text}> Password </Text>
                <View style={styles.passwordWrapper}>
                    <TextInput
                        style={styles.passwordtextbox}
                        placeholder="Password"
                        placeholderTextColor="#585756"
                        secureTextEntry={!passwordVisible}
                        value={password}
                        onChangeText={setPassword}
                        autoCapitalize="none"
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

            {/* Commuter Type */}
            <View style={styles.passwordcontainer}>
                <Text style={styles.text}> Commuter Type </Text>

                <TouchableOpacity
                style={styles.passwordWrapper}
                onPress={() => setOpenDropdown(!openDropdown)}
                activeOpacity={0.8}
            >
                    <Text style={[styles.passwordtextbox, { color: selectedType ? "#FFFFFF" : "#585756" }]}>
                        {selectedType || "(e.g., Student)"}
                    </Text>

                {/* ▼ arrow */}
                    <Text style={{ color: "#FFFFFF", fontSize: 18 }}>
                        {openDropdown ? "▲" : "▼"}
                    </Text>
                </TouchableOpacity>

                {/* Dropdown List */}
                {openDropdown && (
                <View style={styles.dropdown}>
                    {commuterTypes.map((type, index) => (
                        <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => {
                            setSelectedType(type);
                            setOpenDropdown(false);
                        }}
                    >
                        <Text style={styles.dropdownText}>{type}</Text>
                    </TouchableOpacity>
                ))}
                </View>
                )}
            </View>

            {/* Remember Me + Sign Up Button */}
            <View style={styles.thirdcontainer}>
                <TouchableOpacity style={styles.firsthalf} onPress={() => setRememberMe(!rememberMe)}>
                    <Text style={{ color: '#FFFFFF', fontSize: 18 }}>{rememberMe ? '☑' : '☐'}</Text>
                    <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>
                <View style={styles.secondhalf}>
                    <TouchableOpacity onPress={() => Alert.alert('Forgot password', 'Use the login screen to reset your password.') }>
                        <Text style={styles.forgotText}>Forgot?</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity style={styles.loginbutton} onPress={handleSignUp}>
                <Text style={styles.loginbuttonText}>Sign Up</Text>
            </TouchableOpacity>
            {/* // divider rani para sa or signup with */}
            <View style={styles.dividerContainer}>
                <Text style={styles.dividerText}>or signup with</Text>
            </View>

            {/* // GOOGLE Signin BUTTON */}
            <TouchableOpacity style={styles.googlebutton} onPress={signIn}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AntDesign name="google" size={20} color="#DB4437" style={{ marginRight: 4 }} />
                    <Text style={styles.googlebuttonText}>Google</Text>
                </View>
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
        color: 'white',
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
        color: '#FFFFFF'
    },
    dropdown: {
        backgroundColor: "#4c4c4c",
        borderWidth: 2,
        borderColor: "#585756",
        borderRadius: 8,
        marginTop: 4,
        overflow: "hidden",
    },

    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#585756",
    },
    dropdownText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontFamily: "Lexend_400Regular",
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
        marginVertical: 10,
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
        alignSelf: 'center',        // center horizontally
    },
    googlebuttonContent: {
        flexDirection: 'row',       // logo + text in a row
        alignItems: 'center',
        justifyContent: 'center',
    },

    googlebuttonText: {
        color: 'black',
        fontFamily: 'Lexend_400Regular',
        fontSize: 16,
    },
})
