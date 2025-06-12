import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Linking,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useContacts } from '../contexts/ContactsContext';
import { supabase } from '../services/supabaseClient';
import * as Location from 'expo-location';

interface ProfileEditScreenProps {
  onClose: () => void;
}

export const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({ onClose }) => {
  const { user, refreshUser } = useAuth();
  const { hasPermission: hasContactsPermission, requestPermission: requestContactsPermission } = useContacts();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const handleContactsPermissionToggle = async () => {
    if (hasContactsPermission) {
      // If already granted, direct to settings
      Alert.alert(
        'Contacts Permission',
        'To disable contacts access, please go to Settings > Privacy & Security > Contacts > Linkup and turn off access.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
    } else {
      // Request permission
      const granted = await requestContactsPermission();
      if (!granted) {
        Alert.alert(
          'Permission Needed',
          'Contacts access helps you find friends who are already using Linkup. You can enable this later in Settings.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleLocationPermissionToggle = async () => {
    if (hasLocationPermission) {
      // If already granted, direct to settings
      Alert.alert(
        'Location Permission',
        'To disable location access, please go to Settings > Privacy & Security > Location Services > Linkup and turn off access.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
    } else {
      // Request permission
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const granted = status === 'granted';
        setHasLocationPermission(granted);
        if (!granted) {
          Alert.alert(
            'Permission Needed',
            'Location access is needed to create pins and share your location with friends. You can enable this later in Settings.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
      }
    }
  };

  const validateUsername = (text: string) => {
    if (text.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(text)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return '';
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    const error = validateUsername(text);
    setUsernameError(error);
  };

  const handleSave = async () => {
    if (!name.trim() || !username.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (usernameError) {
      Alert.alert('Error', usernameError);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          username: username.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Error', 'Username is already taken. Please choose a different one.');
          return;
        }
        throw error;
      }

      // Update Supabase user metadata
      await supabase.auth.updateUser({
        data: {
          username: username.toLowerCase(),
          name: name.trim()
        }
      });

      // Refresh user data in context
      await refreshUser();
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: onClose }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onClose}
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={isLoading || !!usernameError}
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.saveText, (isLoading || !!usernameError) && styles.saveTextDisabled]}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={styles.section}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.emailContainer}>
              <Text style={styles.emailText}>{user?.email}</Text>
              <Text style={styles.emailNote}>Email cannot be changed</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[styles.input, usernameError ? styles.inputError : null]}
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="Enter username"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {usernameError ? (
              <Text style={styles.errorText}>{usernameError}</Text>
            ) : null}
            <Text style={styles.helpText}>
              Friends use this to find and add you
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              autoCapitalize="words"
            />
            <Text style={styles.helpText}>
              This is how you appear in events and activities
            </Text>
          </View>

          {/* Permissions Section */}
          <View style={styles.permissionsSection}>
            <Text style={styles.sectionHeader}>Privacy & Permissions</Text>
            
            <View style={styles.permissionItem}>
              <View style={styles.permissionInfo}>
                <Text style={styles.permissionTitle}>Contacts Access</Text>
                <Text style={styles.permissionDescription}>
                  Find friends who are already using Linkup
                </Text>
              </View>
              <Switch
                value={hasContactsPermission}
                onValueChange={handleContactsPermissionToggle}
                trackColor={{ false: '#E2E8F0', true: '#FDB366' }}
                thumbColor={hasContactsPermission ? '#FFFFFF' : '#94A3B8'}
                ios_backgroundColor="#E2E8F0"
              />
            </View>

            <View style={styles.permissionItem}>
              <View style={styles.permissionInfo}>
                <Text style={styles.permissionTitle}>Location Access</Text>
                <Text style={styles.permissionDescription}>
                  Share your location when creating pins
                </Text>
              </View>
              <Switch
                value={hasLocationPermission}
                onValueChange={handleLocationPermissionToggle}
                trackColor={{ false: '#E2E8F0', true: '#FDB366' }}
                thumbColor={hasLocationPermission ? '#FFFFFF' : '#94A3B8'}
                ios_backgroundColor="#E2E8F0"
              />
            </View>

            <Text style={styles.permissionNote}>
              You can change these permissions anytime in your device Settings
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    minHeight: 60,
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  saveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  saveTextDisabled: {
    color: '#A0AEC0',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2D3748',
  },
  inputError: {
    borderColor: '#E53E3E',
    borderWidth: 2,
  },
  emailContainer: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
  },
  emailText: {
    fontSize: 16,
    color: '#4A5568',
    fontWeight: '500',
  },
  emailNote: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
    fontStyle: 'italic',
  },
  helpText: {
    fontSize: 12,
    color: '#718096',
    marginTop: 6,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#E53E3E',
    marginTop: 6,
  },
  permissionsSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  permissionInfo: {
    flex: 1,
    marginRight: 16,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  permissionNote: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  dangerZone: {
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  signOutButton: {
    backgroundColor: '#FED7D7',
    borderWidth: 1,
    borderColor: '#FEB2B2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    color: '#E53E3E',
    fontWeight: '600',
  },
});