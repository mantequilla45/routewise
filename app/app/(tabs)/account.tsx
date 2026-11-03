import AccountInfoSection from '@/components/Account/AccountInfoSection';
import ProfileHeader from '@/components/Account/ProfileHeader';
import SettingsButton from '@/components/Account/SettingsButton';
import SignedOutView from '@/components/Account/SignedOutView';
import { useAuth } from '@/context/auth';
import { colors, spacing, ui } from '@/theme';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Account() {
  const { user, signOut, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    await signOut();
  };

  // This screen ends at the tab bar; padding the top by the bar's height puts the spinner at the
  // middle of the whole phone screen rather than of the area above the tabs
  const tabBarHeight = useBottomTabBarHeight();

  if (isLoading) {
    return (
      <View style={[ui.screen, styles.centered, { paddingTop: tabBarHeight }]}>
        <ActivityIndicator size="large" color={colors.textSecondary} />
      </View>
    );
  }

  if (user) {
    return (
      <View style={ui.screen}>
        <SettingsButton />
        <ScrollView
          style={ui.screen}
          contentContainerStyle={{
            paddingTop: insets.top + spacing.xxl,
            paddingBottom: spacing.xxl,
          }}
        >
          <ProfileHeader user={user} />
          <AccountInfoSection onSignOut={handleSignOut} />
        </ScrollView>
      </View>
    );
  }

  return <SignedOutView />;
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
