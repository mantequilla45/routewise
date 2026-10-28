import AccountInfoSection from '@/components/Account/AccountInfoSection';
import ProfileHeader from '@/components/Account/ProfileHeader';
import Button from '@/components/Button';
import LoginModal from '@/components/LoginModal';
import { LOGO } from '@/constants';
import { useAuth } from '@/context/auth';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function Account() {
  const { user, signOut, isLoading } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (user) {
    return (
      <ScrollView style={styles.profileContainer}>
        <ProfileHeader user={user} />
        <AccountInfoSection user={user} onSignOut={handleSignOut} />
      </ScrollView>
    );
  }

  // Not signed in: sign-up prompt
  return (
    <View style={styles.container}>
      <Image source={LOGO} style={styles.logo} contentFit="contain" />
      <Text style={styles.heading}>Sign up now!</Text>
      <Text style={styles.paragraph}>
        Create an account to save your routes, activities, and many more.
      </Text>
      <View>
        <Button label="Sign Up" onPress={openModal} theme="primary" />
      </View>
      <LoginModal isVisible={isModalVisible} onClose={closeModal}></LoginModal>
    </View>
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
    marginTop: 50,
  },
});
