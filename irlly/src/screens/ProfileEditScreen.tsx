import React, { useState } from 'react';
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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';

interface ProfileEditScreenProps {
  onClose: () => void;
}

export const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({ onClose }) => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');

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
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading || !!usernameError}>
            <Text style={[styles.saveText, (isLoading || !!usernameError) && styles.saveTextDisabled]}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
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