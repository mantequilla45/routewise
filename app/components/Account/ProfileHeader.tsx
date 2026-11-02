import type { AuthUser } from '@/context/auth';
import { colors, fonts, radius, spacing, type } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

const AVATAR_SIZE = 84;

type Props = {
  user: AuthUser;
};

/** Centered photo (or initial), name, email, and how the account signs in. */
export default function ProfileHeader({ user }: Props) {
  const initial = (user.name || user.email || '?').charAt(0).toUpperCase();
  const isGoogle = user.provider === 'google';

  return (
    <View style={styles.header}>
      {user.picture ? (
        <Image source={{ uri: user.picture }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      )}

      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {user.name || 'RouteWise rider'}
        </Text>
        <Text style={type.caption} numberOfLines={1}>
          {user.email}
        </Text>
      </View>

      {!!user.provider && (
        <View style={styles.badge}>
          <Ionicons
            name={isGoogle ? 'logo-google' : 'mail-outline'}
            size={12}
            color={colors.textSecondary}
          />
          <Text style={styles.badgeText}>{isGoogle ? 'Google account' : 'Email account'}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    backgroundColor: colors.accentSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: fonts.semibold,
    fontSize: 32,
    color: colors.textOnAccent,
  },
  text: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  name: {
    ...type.title,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  badgeText: {
    ...type.caption,
    fontSize: 12,
    lineHeight: 16,
  },
});
