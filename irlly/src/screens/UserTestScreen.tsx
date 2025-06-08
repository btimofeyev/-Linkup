import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { apiService } from '../services/apiService';
import { UserSearchResult } from '../types';

export const UserTestScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !name.trim()) {
      Alert.alert('Error', 'Please fill in username and name');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.registerWithUsername({
        username: username.trim(),
        name: name.trim(),
        email: email.trim() || undefined,
      });

      if (result.success && result.data) {
        apiService.setAccessToken(result.data.accessToken);
        Alert.alert('Success', 'Account created successfully!');
        setUsername('');
        setName('');
        setEmail('');
      } else {
        Alert.alert('Error', result.error || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.loginWithUsername(username.trim());

      if (result.success && result.data) {
        apiService.setAccessToken(result.data.accessToken);
        Alert.alert('Success', 'Logged in successfully!');
        setUsername('');
      } else {
        Alert.alert('Error', result.error || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.searchUsers(searchTerm.trim());

      if (result.success && result.data) {
        setSearchResults(result.data.users || []);
      } else {
        Alert.alert('Error', result.error || 'Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async (username: string) => {
    setIsLoading(true);
    try {
      const result = await apiService.addContactByUsername(username);

      if (result.success) {
        Alert.alert('Success', `Added ${username} to your contacts!`);
      } else {
        Alert.alert('Error', result.error || 'Failed to add contact');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Username System Test</Text>

        {/* Registration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Register New Account</Text>
          <TextInput
            style={styles.input}
            placeholder="Username (required)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Name (required)"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email (optional)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* Login Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Login with Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>

        {/* Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Users</Text>
          <TextInput
            style={styles.input}
            placeholder="Search for users..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleSearch}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Search</Text>
          </TouchableOpacity>

          {searchResults.length > 0 && (
            <View style={styles.results}>
              <Text style={styles.resultsTitle}>Search Results:</Text>
              {searchResults.map((user) => (
                <View key={user.id} style={styles.userResult}>
                  <View style={styles.userInfo}>
                    <Text style={styles.username}>@{user.username}</Text>
                    <Text style={styles.displayName}>{user.name}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddContact(user.username)}
                    disabled={isLoading}
                  >
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#2D3748',
  },
  section: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#2D3748',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#F7FAFC',
  },
  button: {
    backgroundColor: '#FDB366',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2D3748',
  },
  userResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  displayName: {
    fontSize: 14,
    color: '#4A5568',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#48BB78',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});