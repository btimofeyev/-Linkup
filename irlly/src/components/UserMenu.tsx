import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ProfileEditScreen } from '../screens/ProfileEditScreen';

interface UserMenuProps {
  style?: any;
}

export const UserMenu: React.FC<UserMenuProps> = ({ style }) => {
  const { user, logout } = useAuth();
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isProfileEditVisible, setIsProfileEditVisible] = useState(false);

  const handleProfileEdit = () => {
    setIsDropdownVisible(false);
    setIsProfileEditVisible(true);
  };

  const closeProfileEdit = () => {
    setIsProfileEditVisible(false);
  };

  const handleSignOut = () => {
    setIsDropdownVisible(false);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => setIsDropdownVisible(true)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getUserInitials()}</Text>
        </View>
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={isDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsDropdownVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdown}>
                <View style={styles.userInfo}>
                  <View style={styles.avatarLarge}>
                    <Text style={styles.avatarTextLarge}>{getUserInitials()}</Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user?.name}</Text>
                    <Text style={styles.userUsername}>@{user?.username}</Text>
                  </View>
                </View>

                <View style={styles.separator} />

                <TouchableOpacity style={styles.menuItem} onPress={handleProfileEdit}>
                  <Text style={styles.menuIcon}>✏️</Text>
                  <Text style={styles.menuText}>Edit Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleSignOut}
                >
                  <Text style={styles.menuIcon}>🚪</Text>
                  <Text style={styles.menuText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Profile Edit Modal */}
      <Modal
        visible={isProfileEditVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ProfileEditScreen onClose={closeProfileEdit} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatarButton: {
    padding: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 20,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTextLarge: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  userUsername: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  menuIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
  },
});