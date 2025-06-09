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
import { UserSearchResult, ApiResponse, SearchUsersResponse } from '../types';

interface AddContactScreenProps {
  onContactAdded?: () => void;
  onClose?: () => void;
}

export const AddContactScreen: React.FC<AddContactScreenProps> = ({
  onContactAdded,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Error', 'Please enter a username to search');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const result = await apiService.searchUsers(searchTerm.trim());

      if (result.success && result.data) {
        setSearchResults((result.data as SearchUsersResponse).users || []);
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

  const handleSendFriendRequest = async (username: string) => {
    setIsLoading(true);
    try {
      const result = await apiService.sendFriendRequest(username);

      if (result.success) {
        Alert.alert('Success', `Friend request sent to @${username}!`);
        // Remove the user from search results
        setSearchResults(prev => prev.filter(user => user.username !== username));
        onContactAdded?.();
      } else {
        Alert.alert('Error', result.error || 'Failed to send friend request');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Friends</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>
          Search for friends by their username
        </Text>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search username..."
            autoCapitalize="none"
            placeholderTextColor="#A0AEC0"
          />
          <TouchableOpacity
            style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={isLoading}
          >
            <Text style={styles.searchButtonText}>
              {isLoading ? '...' : '🔍'}
            </Text>
          </TouchableOpacity>
        </View>

        {hasSearched && (
          <View style={styles.resultsContainer}>
            {searchResults.length > 0 ? (
              <>
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsTitle}>
                    Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
                  </Text>
                  <TouchableOpacity onPress={clearSearch}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>

                {searchResults.map((user) => (
                  <View key={user.id} style={styles.userResult}>
                    <View style={styles.userInfo}>
                      <Text style={styles.username}>@{user.username}</Text>
                      <Text style={styles.displayName}>{user.name}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.addButton, isLoading && styles.addButtonDisabled]}
                      onPress={() => handleSendFriendRequest(user.username)}
                      disabled={isLoading}
                    >
                      <Text style={styles.addButtonText}>Send Request</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>
                  No users found for "{searchTerm}"
                </Text>
                <Text style={styles.noResultsSubtext}>
                  Make sure the username is spelled correctly
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
          <Text style={styles.tipText}>• Usernames are case-insensitive</Text>
          <Text style={styles.tipText}>• Ask your friends for their exact username</Text>
          <Text style={styles.tipText}>• Share your username: @your_username</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#4A5568',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  searchButton: {
    backgroundColor: '#FDB366',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    fontSize: 18,
  },
  resultsContainer: {
    marginBottom: 30,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  clearText: {
    fontSize: 14,
    color: '#FDB366',
    fontWeight: '600',
  },
  userResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noResults: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: '#E6FFFA',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 4,
  },
});