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
import { useCircles } from '../contexts/CirclesContext';
import { useContacts } from '../contexts/ContactsContext';
import { Circle, Contact, UserSearchResult } from '../types';
import { apiService } from '../services/apiService';

export const CirclesScreen: React.FC = () => {
  const { circles, createCircle, deleteCircle, addContactsToCircle, removeContactFromCircle } = useCircles();
  const { contacts, refreshContacts } = useContacts();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isAddContactModalVisible, setIsAddContactModalVisible] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [newCircleName, setNewCircleName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('👥');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    console.log('Contacts in CirclesScreen:', contacts);
    if (contacts.length === 0) {
      // Try to refresh contacts if none are loaded
      refreshContacts();
    }
  }, [contacts]);

  const emojiOptions = ['👥', '💼', '🎓', '🏋️', '🎵', '🍕', '☕', '🏠'];

  const handleCreateCircle = async () => {
    if (!newCircleName.trim()) {
      Alert.alert('Error', 'Please enter a circle name');
      return;
    }

    try {
      await createCircle(newCircleName.trim(), selectedEmoji);
      setNewCircleName('');
      setSelectedEmoji('👥');
      setIsCreateModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create circle');
    }
  };

  const handleDeleteCircle = (circle: Circle) => {
    Alert.alert(
      'Delete Circle',
      `Are you sure you want to delete "${circle.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCircle(circle.id),
        },
      ]
    );
  };

  const handleCirclePress = (circle: Circle) => {
    setSelectedCircle(circle);
    setIsDetailModalVisible(true);
  };

  const handleAddContact = (contactId: string) => {
    if (selectedCircle) {
      addContactsToCircle(selectedCircle.id, [contactId]);
      // Update local state to reflect the change
      setSelectedCircle({
        ...selectedCircle,
        contactIds: [...selectedCircle.contactIds, contactId]
      });
    }
  };

  const handleRemoveContact = (contactId: string) => {
    if (selectedCircle) {
      removeContactFromCircle(selectedCircle.id, contactId);
      // Update local state to reflect the change
      setSelectedCircle({
        ...selectedCircle,
        contactIds: selectedCircle.contactIds.filter(id => id !== contactId)
      });
    }
  };

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

  const handleAddNewContact = async (username: string) => {
    setIsSearching(true);
    try {
      const result = await apiService.addContactByUsername(username);

      if (result.success) {
        Alert.alert('Success', `Added @${username} to your contacts!`);
        // Refresh contacts to get the new contact
        await refreshContacts();
        // Remove the added user from search results
        setSearchResults(prev => prev.filter(user => user.username !== username));
        setSearchTerm('');
        
        // Auto-add to current circle if we're in circle detail view
        if (selectedCircle && result.data?.contact) {
          setTimeout(async () => {
            try {
              await addContactsToCircle(selectedCircle.id, [result.data.contact.id]);
              setSelectedCircle({
                ...selectedCircle,
                contactIds: [...selectedCircle.contactIds, result.data.contact.id]
              });
              Alert.alert('Added to Circle', `@${username} has been added to "${selectedCircle.name}"`);
            } catch (error) {
              console.error('Error adding to circle:', error);
            }
          }, 500); // Small delay to ensure contact is loaded
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to add contact');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setIsSearching(false);
    }
  };

  const getContactCount = (circle: Circle) => {
    return circle.contactIds?.length || 0; 
  };

  const renderCircle = ({ item }: { item: Circle }) => (
    <TouchableOpacity 
      style={styles.circleItem}
      onPress={() => handleCirclePress(item)}
    >
      <View style={styles.circleContent}>
        <View style={styles.circleHeader}>
          <Text style={styles.circleEmoji}>{item.emoji}</Text>
          <View style={styles.circleInfo}>
            <Text style={styles.circleName}>{item.name}</Text>
            <Text style={styles.circleCount}>
              {getContactCount(item)} contacts
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCircle(item)}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Circles</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsCreateModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

      <Text style={styles.subtitle}>
        Organize your contacts into circles to control who sees your plans
      </Text>

      <FlatList
        data={circles}
        renderItem={renderCircle}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => setIsCreateModalVisible(true)}
            >
              <Text style={styles.emptyAddButtonText}>+</Text>
            </TouchableOpacity>
            <Text style={styles.emptyTitle}>No circles yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first circle to organize your contacts
            </Text>
          </View>
        }
      />
      </View>

      <Modal
        visible={isCreateModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Circle</Text>
            <TouchableOpacity onPress={handleCreateCircle}>
              <Text style={styles.modalCreateText}>Create</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Circle Name</Text>
              <TextInput
                style={styles.input}
                value={newCircleName}
                onChangeText={setNewCircleName}
                placeholder="e.g., Close Friends, Work, Family"
                maxLength={30}
                autoFocus
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Choose an Emoji</Text>
              <View style={styles.emojiContainer}>
                {emojiOptions.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiButton,
                      selectedEmoji === emoji && styles.emojiButtonSelected,
                    ]}
                    onPress={() => setSelectedEmoji(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={isDetailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsDetailModalVisible(false)}>
              <Text style={styles.modalCancelText}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedCircle?.emoji} {selectedCircle?.name}
            </Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Members ({selectedCircle?.contactIds?.length || 0})</Text>
            
            {selectedCircle?.contactIds?.map(contactId => {
              const contact = contacts.find(c => c.id === contactId);
              return contact ? (
                <View key={contactId} style={styles.memberItem}>
                  <Text style={styles.memberName}>{contact.name}</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveContact(contactId)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : null;
            })}

            <Text style={styles.sectionTitle}>Add Contacts</Text>
            
            {/* Search for new contacts */}
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

            {/* Search results */}
            {searchResults.length > 0 && (
              <View style={styles.searchResults}>
                <Text style={styles.searchResultsTitle}>Search Results:</Text>
                {searchResults.map((user) => (
                  <View key={user.id} style={styles.searchResultItem}>
                    <View style={styles.userInfo}>
                      <Text style={styles.username}>@{user.username}</Text>
                      <Text style={styles.displayName}>{user.name}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.addNewButton, isSearching && styles.addNewButtonDisabled]}
                      onPress={() => handleAddNewContact(user.username)}
                      disabled={isSearching}
                    >
                      <Text style={styles.addNewButtonText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Existing contacts */}
            {contacts.length > 0 && (
              <>
                <Text style={styles.subsectionTitle}>
                  Your Contacts ({contacts.length})
                </Text>
                
                {/* Show registered contacts first */}
                {contacts
                  .filter(contact => contact.isRegistered && !selectedCircle?.contactIds?.includes(contact.contactId || contact.id))
                  .map(contact => (
                    <TouchableOpacity
                      key={contact.id}
                      style={styles.contactItem}
                      onPress={() => handleAddContact(contact.contactId || contact.id)}
                    >
                      <View>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        {contact.username && (
                          <Text style={styles.contactUsername}>@{contact.username}</Text>
                        )}
                        <Text style={styles.contactStatus}>✅ On Linkup</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.addToCircleButton}
                        onPress={() => handleAddContact(contact.contactId || contact.id)}
                      >
                        <Text style={styles.addToCircleButtonText}>Add to Circle</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}

                {/* Show unregistered contacts */}
                {contacts
                  .filter(contact => !contact.isRegistered && !selectedCircle?.contactIds?.includes(contact.contactId || contact.id))
                  .slice(0, 10) // Limit to first 10 to avoid overwhelming UI
                  .map(contact => (
                    <TouchableOpacity
                      key={contact.id}
                      style={[styles.contactItem, styles.unregisteredContactItem]}
                      onPress={() => handleAddContact(contact.contactId || contact.id)}
                    >
                      <View>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                        <Text style={styles.contactStatus}>📱 Not on Linkup yet</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.addToCircleButton}
                        onPress={() => handleAddContact(contact.contactId || contact.id)}
                      >
                        <Text style={styles.addToCircleButtonText}>Add to Circle</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                
                {contacts.filter(contact => !selectedCircle?.contactIds?.includes(contact.contactId || contact.id)).length === 0 && (
                  <View style={styles.allAddedContainer}>
                    <Text style={styles.allAddedText}>✅ All your contacts are already in this circle!</Text>
                  </View>
                )}
              </>
            )}

            {contacts.length === 0 && (
              <View style={styles.noContactsContainer}>
                <Text style={styles.noContactsText}>No contacts yet</Text>
                <Text style={styles.noContactsSubtext}>
                  Search for friends by username to add them to your circles
                </Text>
              </View>
            )}
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
    paddingTop: 24, // More space below SafeAreaView
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D3748',
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FDB366',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ED8936',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
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
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  circleItem: {
    marginBottom: 12,
  },
  circleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 8,
    minHeight: 72,
  },
  circleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  circleEmoji: {
    fontSize: 26,
    marginRight: 14,
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  circleCount: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyAddButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FDB366',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#ED8936',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  emptyAddButtonText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
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
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  modalCancelText: {
    fontSize: 17,
    color: '#64748B',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
  },
  modalCreateText: {
    fontSize: 17,
    color: '#ED8936',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputSection: {
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 10,
  },
  input: {
    borderWidth: 0,
    borderRadius: 20,
    padding: 18,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    color: '#2D3748',
    minHeight: 56,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emojiButton: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  emojiButtonSelected: {
    backgroundColor: '#FDB366',
    shadowOpacity: 0.12,
  },
  emojiText: {
    fontSize: 26,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginTop: 20,
    marginBottom: 12,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3748',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3748',
  },
  contactUsername: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
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
    marginBottom: 20,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
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
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginTop: 16,
    marginBottom: 8,
  },
  noContactsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noContactsText: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 4,
  },
  noContactsSubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  addToCircleButton: {
    backgroundColor: '#FDB366',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addToCircleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  allAddedContainer: {
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
  },
  allAddedText: {
    fontSize: 14,
    color: '#15803D',
    fontWeight: '500',
  },
  unregisteredContactItem: {
    opacity: 0.7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  contactPhone: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  contactStatus: {
    fontSize: 11,
    color: '#48BB78',
    fontWeight: '500',
    marginTop: 4,
  },
});
