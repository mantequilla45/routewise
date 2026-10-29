import type { AuthUser } from '@/context/auth';
import { colors, spacing, type } from '@/theme';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

const AVATAR_SIZE = 64;

type Props = {
  user: AuthUser;
};

/** Avatar, name, email and sign-in provider at the top of the profile screen. */
export default function ProfileHeader({ user }: Props) {
  return (
    <View style={styles.header}>
      {user.picture ? (
        <Image source={{ uri: user.picture }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>
            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.text}>
        <Text style={type.heading} numberOfLines={1}>
          {user.name || 'User'}
        </Text>
        <Text style={type.caption} numberOfLines={1}>
          {user.email}
        </Text>
        {user.provider && (
          <Text style={styles.provider} numberOfLines={1}>
            Signed in with {user.provider}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...type.title,
    color: colors.textSecondary,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
  provider: {
    ...type.caption,
    color: colors.textTertiary,
  },
});
