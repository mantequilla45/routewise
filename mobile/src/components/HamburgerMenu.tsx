import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Text,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

export const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigation = useNavigation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  const handleNavigate = (screen: string) => {
    setIsOpen(false);
    navigation.navigate(screen as never);
  };

  return (
    <>
      <TouchableOpacity style={styles.menuButton} onPress={() => setIsOpen(true)}>
        <View style={styles.hamburgerLine} />
        <View style={styles.hamburgerLine} />
        <View style={styles.hamburgerLine} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuContainer}>
                <SafeAreaView>
                  <View style={styles.menuHeader}>
                    <Text style={styles.menuTitle}>Menu</Text>
                    <TouchableOpacity onPress={() => setIsOpen(false)}>
                      <Text style={styles.closeButton}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.menuItems}>
                    <TouchableOpacity 
                      style={styles.menuItem}
                      onPress={() => handleNavigate('Home')}
                    >
                      <Text style={styles.menuItemIcon}>🏠</Text>
                      <Text style={styles.menuItemText}>Home</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.menuItem}
                      onPress={() => handleNavigate('Profile')}
                    >
                      <Text style={styles.menuItemIcon}>👤</Text>
                      <Text style={styles.menuItemText}>Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.menuItem}
                      onPress={() => handleNavigate('Map')}
                    >
                      <Text style={styles.menuItemIcon}>🗺️</Text>
                      <Text style={styles.menuItemText}>Find Routes</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity 
                      style={styles.menuItem}
                      onPress={handleSignOut}
                    >
                      <Text style={styles.menuItemIcon}>🚪</Text>
                      <Text style={[styles.menuItemText, styles.signOutText]}>Sign Out</Text>
                    </TouchableOpacity>
                  </View>
                </SafeAreaView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerLine: {
    width: 25,
    height: 3,
    backgroundColor: '#333',
    marginVertical: 2,
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuContainer: {
    backgroundColor: '#fff',
    width: 280,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    padding: 5,
  },
  menuItems: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 30,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
    marginHorizontal: 20,
  },
  signOutText: {
    color: '#FF3B30',
  },
});