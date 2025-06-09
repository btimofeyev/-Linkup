import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useContacts } from '../contexts/ContactsContext';
import { Contact, UserSearchResult } from '../types';
import { apiService } from '../services/apiService';

interface ContactsManagementScreenProps {
  onClose?: () => void; // Optional prop for modal usage
}

export const ContactsManagementScreen: React.FC<ContactsManagementScreenProps> = ({ onClose }) => {
  const { contacts, refreshContacts } = useContacts();
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    refreshContacts();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Error', 'Please enter a username to search');
      return;
    }

    setIsSearching(true);
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
      setIsSearching(false);
    }
  };

  const handleAddContact = async (username: string) => {
    setIsSearching(true);
    try {
      const result = await apiService.addContactByUsername(username);

      if (result.success) {
        Alert.alert('Success', `Added @${username} to your contacts!`);
        console.log('ContactsManagement: Successfully added contact, refreshing...');
        await refreshContacts();
        console.log('ContactsManagement: Contacts after refresh:', contacts.length);
        setSearchResults(prev => prev.filter(user => user.username !== username));
        setSearchTerm('');
      } else {
        Alert.alert('Error', result.error || 'Failed to add contact');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  const registeredContacts = contacts.filter(contact => contact.isRegistered);
  
  console.log('ContactsManagement: Total contacts:', contacts.length, 'Registered contacts:', registeredContacts.length);

  const renderContact = ({ item }: { item: Contact }) => (
    <View style={styles.contactItem}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        {item.username && (
          <Text style={styles.contactUsername}>@{item.username}</Text>
        )}
        {item.phoneNumber && (
          <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
        )}
      </View>
      <View style={styles.contactStatus}>
        <Text style={styles.statusText}>✅ Connected</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrapper}>
        <View style={styles.header}>
        {onClose ? (
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Done</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
        <Text style={styles.title}>My Contacts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        {registeredContacts.length} contacts on Linkup
      </Text>

      <FlatList
        data={registeredContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No contacts yet</Text>
            <Text style={styles.emptySubtitle}>
              Add friends by searching their username
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => setIsAddModalVisible(true)}
            >
              <Text style={styles.emptyAddButtonText}>Add First Contact</Text>
            </TouchableOpacity>
          </View>
        }
      />
      </View>

      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
              <Text style={styles.modalCancelText}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Contact</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Search for friends</Text>
            
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
                style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
                onPress={handleSearch}
                disabled={isSearching}
              >
                <Text style={styles.searchButtonText}>
                  {isSearching ? '...' : '🔍'}
                </Text>
              </TouchableOpacity>
            </View>

            {searchResults.length > 0 && (
              <View style={styles.searchResults}>
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsTitle}>
                    Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
                  </Text>
                  <TouchableOpacity onPress={clearSearch}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>

                {searchResults.map((user) => (
                  <View key={user.id} style={styles.searchResultItem}>
                    <View style={styles.userInfo}>
                      <Text style={styles.username}>@{user.username}</Text>
                      <Text style={styles.displayName}>{user.name}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.addNewButton, isSearching && styles.addNewButtonDisabled]}
                      onPress={() => handleAddContact(user.username)}
                      disabled={isSearching}
                    >
                      <Text style={styles.addNewButtonText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>💡 Tips</Text>
              <Text style={styles.tipText}>• Ask friends for their exact username</Text>
              <Text style={styles.tipText}>• Usernames are case-insensitive</Text>
              <Text style={styles.tipText}>• When you add someone, they'll be notified</Text>
              <Text style={styles.tipText}>• They can add you back to become mutual contacts</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  wrapper: {
    flex: 1,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D3748',
  },
  cancelText: {
    fontSize: 16,
    color: '#4A5568',
    fontWeight: '500',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDB366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    padding: 16,
    paddingTop: 6,
    lineHeight: 22,
    fontWeight: '400',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  contactItem: {
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
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  contactUsername: {
    fontSize: 14,
    color: '#FDB366',
    marginTop: 2,
    fontWeight: '500',
  },
  contactPhone: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  contactStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    color: '#48BB78',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyAddButton: {
    backgroundColor: '#FDB366',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyAddButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#4A5568',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
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
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  searchButton: {
    backgroundColor: '#FDB366',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    fontSize: 18,
  },
  searchResults: {
    marginBottom: 24,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E6FFFA',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#81E6D9',
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
  addNewButton: {
    backgroundColor: '#48BB78',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addNewButtonDisabled: {
    opacity: 0.6,
  },
  addNewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: '#EDF2F7',
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