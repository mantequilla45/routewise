import type { AuthUser } from '@/context/auth';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  user: AuthUser;
};

/** Avatar, name, email and sign-in provider badge at the top of the profile screen. */
export default function ProfileHeader({ user }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.avatarContainer}>
        {user.picture ? (
          <Image source={{ uri: user.picture }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.userName}>{user.name || 'User'}</Text>
      <Text style={styles.userEmail}>{user.email}</Text>
      {user.provider && (
        <View style={styles.providerBadge}>
          <Text style={styles.providerText}>Signed in with {user.provider}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    borderRadius: 12,
    width: '90%',
    alignSelf: 'center',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: '#fff',
    fontFamily: 'Lexend_600SemiBold',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Lexend_600SemiBold',
    marginBottom: 5,
    backgroundColor: '#FFCC66',
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  userEmail: {
    fontSize: 16,
    fontFamily: 'Lexend_300Light',
    color: '#666',
  },
  providerBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
  },
  providerText: {
    fontSize: 12,
    fontFamily: 'Lexend_400Regular',
    color: '#4CAF50',
  },
});
