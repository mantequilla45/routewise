import AccountInfoSection from '@/components/Account/AccountInfoSection';
import ProfileHeader from '@/components/Account/ProfileHeader';
import LoginModal from '@/components/LoginModal';
import { LOGO } from '@/constants';
import { useAuth } from '@/context/auth';
import { colors, spacing, type, ui } from '@/theme';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Account() {
  const { user, signOut, isLoading } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (isLoading) {
    return (
      <View style={[ui.screen, styles.centered]}>
        <ActivityIndicator size="large" color={colors.textSecondary} />
      </View>
    );
  }

  if (user) {
    return (
      <ScrollView
        style={ui.screen}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: spacing.xxl,
        }}
      >
        <Text style={[type.title, styles.title]}>Account</Text>
        <ProfileHeader user={user} />
        <AccountInfoSection user={user} onSignOut={handleSignOut} />
      </ScrollView>
    );
  }

  // Not signed in: sign-up prompt
  return (
    <View style={[ui.screen, styles.centered, styles.signedOut]}>
      <Image source={LOGO} style={styles.logo} contentFit="contain" />
      <View style={styles.copy}>
        <Text style={[type.title, styles.centerText]}>Sign up now!</Text>
        <Text style={[type.caption, styles.centerText]}>
          Create an account to save your routes, activities, and many more.
        </Text>
      </View>
      <Pressable
        onPress={openModal}
        style={({ pressed }) => [ui.primaryButton, styles.cta, pressed && styles.ctaPressed]}
        accessibilityRole="button"
      >
        <Text style={ui.primaryButtonText}>Sign Up</Text>
      </Pressable>
      <LoginModal isVisible={isModalVisible} onClose={closeModal}></LoginModal>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    paddingHorizontal: spacing.lg,
  },
  signedOut: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  logo: {
    width: '60%',
    height: 64,
  },
  copy: {
    gap: spacing.sm,
    maxWidth: 320,
  },
  centerText: {
    textAlign: 'center',
  },
  cta: {
    alignSelf: 'stretch',
  },
  ctaPressed: {
    backgroundColor: colors.accentPressed,
  },
});
