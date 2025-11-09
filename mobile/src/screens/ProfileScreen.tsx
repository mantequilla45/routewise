import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Text } from '../components/Text';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
}

const ProfileScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Profile form states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setInitialLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If user doesn't exist in users table, create one
        if (error.code === 'PGRST116') {
          await createUserProfile();
        }
        return;
      }

      if (data) {
        setFullName(data.full_name || '');
        setPhoneNumber(data.phone_number || '');
        setAvatarUrl(data.avatar_url);
        setIsAdmin(data.is_admin || false);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const createUserProfile = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .insert([
          {
            id: user?.id,
            email: user?.email,
            full_name: null,
            phone_number: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_admin: false,
          }
        ]);
      
      if (error && error.code !== '23505') {
        console.error('Error creating user profile:', error);
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName || null,
          phone_number: phoneNumber || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      Alert.alert('Success', 'Password changed successfully!');
      setShowPasswordChange(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text weight="600" style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 45 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text weight="600" style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity 
            onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
            style={styles.editButton}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.editButtonText}>
                {isEditing ? 'Save' : 'Edit'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileHeader}>
            {avatarUrl ? (
              <Image 
                source={{ uri: avatarUrl }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileIcon}>
                <Text style={styles.profileInitial}>
                  {fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.changePhotoButton}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledInputText}>{user?.email}</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.disabledTextInput]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                editable={isEditing}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.disabledTextInput]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setShowPasswordChange(!showPasswordChange)}
            >
              <Text style={styles.sectionTitle}>Security</Text>
              <Text style={styles.expandIcon}>
                {showPasswordChange ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {showPasswordChange && (
              <View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password (min 6 characters)"
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity 
                  style={styles.changePasswordButton}
                  onPress={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.changePasswordButtonText}>
                      Change Password
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <TouchableOpacity style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Notifications</Text>
              <Text style={styles.preferenceValue}>Enabled →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Language</Text>
              <Text style={styles.preferenceValue}>English →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Privacy Settings</Text>
              <Text style={styles.preferenceValue}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dangerZone}>
            <TouchableOpacity 
              style={styles.deleteAccountButton}
              onPress={() => {
                Alert.alert(
                  'Delete Account',
                  'Are you sure you want to delete your account? This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive',
                      onPress: () => Alert.alert('Contact Support', 'Please contact support to delete your account.')
                    },
                  ]
                );
              }}
            >
              <Text style={styles.deleteAccountText}>Delete Account</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'Lexend-Regular',
  },
  editButton: {
    padding: 5,
    minWidth: 45,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontFamily: 'Lexend-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    marginBottom: 10,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  profileIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileInitial: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    color: '#007AFF',
    fontSize: 14,
    fontFamily: 'Lexend-Regular',
  },
  adminBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Lexend-Regular',
  },
  formSection: {
    backgroundColor: '#fff',
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  expandIcon: {
    fontSize: 12,
    color: '#666',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Lexend-Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  disabledInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F5F5F5',
  },
  disabledInputText: {
    fontSize: 14,
    color: '#666',
  },
  disabledTextInput: {
    backgroundColor: '#F5F5F5',
    color: '#666',
  },
  changePasswordButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  changePasswordButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Lexend-Regular',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Lexend-Regular',
  },
  preferenceValue: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Lexend-Light',
  },
  dangerZone: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  deleteAccountButton: {
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteAccountText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Lexend-Regular',
  },
});

export default ProfileScreen;