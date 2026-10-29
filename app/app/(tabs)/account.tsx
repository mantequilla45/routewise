import AccountInfoSection from '@/components/Account/AccountInfoSection';
import ProfileHeader from '@/components/Account/ProfileHeader';
import SignedOutView from '@/components/Account/SignedOutView';
import { useAuth } from '@/context/auth';
import { colors, spacing, type, ui } from '@/theme';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Account() {
  const { user, signOut, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

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

  return <SignedOutView />;
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    paddingHorizontal: spacing.lg,
  },
});
