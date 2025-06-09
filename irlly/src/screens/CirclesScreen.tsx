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
import { useNavigation } from '@react-navigation/native';
import { useCircles } from '../contexts/CirclesContext';
import { useContacts } from '../contexts/ContactsContext';
import { Circle, Contact, UserSearchResult } from '../types';
import { apiService } from '../services/apiService';
import { UserMenu } from '../components/UserMenu';

export const CirclesScreen: React.FC = () => {
  const navigation = useNavigation();
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
  const [friends, setFriends] = useState<Contact[]>([]);
  const [showNonAppContacts, setShowNonAppContacts] = useState(false);

  useEffect(() => {
    console.log(`CirclesScreen: received ${contacts.length} contacts from ContactsContext`);
    if (contacts.length === 0) {
      // Try to refresh contacts if none are loaded
      refreshContacts();
    }
    loadFriends();
  }, [contacts]);

  const loadFriends = async () => {
    try {
      const result = await apiService.getFriends();
      if (result.success && result.data) {
        console.log(`CirclesScreen: loaded ${result.data.friends?.length || 0} friends from API`);
        const friendsData = result.data.friends || [];
        setFriends(friendsData.map((friend: any) => ({
          id: friend.id, // This should be the contacts.id, not contact_user_id
          userId: friend.user_id,
          contactId: friend.contact_user_id,
          name: friend.name,
          username: friend.username,
          phoneNumber: friend.phone_number,
          isRegistered: friend.is_registered,
          createdAt: new Date(friend.created_at),
        })));
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

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

  const handleAddContact = async (contactId: string) => {
    if (selectedCircle) {
      try {
        await addContactsToCircle(selectedCircle.id, [contactId]);
        // Update local state to reflect the change
        setSelectedCircle({
          ...selectedCircle,
          contactIds: [...selectedCircle.contactIds, contactId]
        });
      } catch (error) {
        console.error('Error adding contact to circle:', error);
        Alert.alert('Error', 'Failed to add contact to circle');
      }
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
        // Refresh contacts and friends to get the new contact
        await refreshContacts();
        await loadFriends();
        // Remove the added user from search results
        setSearchResults(prev => prev.filter(user => user.username !== username));
        setSearchTerm('');
        
        // Auto-add to current circle if we're in circle detail view
        if (selectedCircle && result.data?.contact) {
          setTimeout(async () => {
            try {
              console.log('CirclesScreen: Adding contact to circle:', {
                contactId: result.data.contact.id,
                contactData: result.data.contact,
                circleId: selectedCircle.id
              });
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
          <TouchableOpacity
            style={styles.contactsButton}
            onPress={() => navigation.navigate('ContactsManagement' as never)}
          >
            <Text style={styles.contactsButtonText}>👥 Contacts</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Circles</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsCreateModalVisible(true)}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
            <UserMenu style={styles.userMenu} />
          </View>
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
            
            {selectedCircle?.contactIds?.length === 0 ? (
              <View style={styles.noMembersContainer}>
                <Text style={styles.noMembersText}>No members yet</Text>
                <Text style={styles.noMembersSubtext}>Add contacts below to get started</Text>
              </View>
            ) : (
              <View style={styles.membersGrid}>
                {selectedCircle?.contactIds?.map(contactId => {
                  const contact = contacts.find(c => c.id === contactId);
                  const friend = friends.find(f => f.id === contactId);
                  const displayContact = contact || friend;
                  
                  return displayContact ? (
                    <View key={contactId} style={styles.memberCard}>
                      <View style={styles.memberHeader}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>
                            {(displayContact.name || displayContact.username || '?')[0].toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{displayContact.name}</Text>
                          {displayContact.username && (
                            <Text style={styles.memberUsername}>@{displayContact.username}</Text>
                          )}
                          {displayContact.isRegistered && (
                            <Text style={styles.memberStatus}>✅ Active</Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveContact(contactId)}
                      >
                        <Text style={styles.removeButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null;
                })}
              </View>
            )}

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

            {/* Friends on the app */}
            {friends.length > 0 && (
              <>
                <Text style={styles.subsectionTitle}>
                  Friends on Linkup ({friends.filter(friend => !selectedCircle?.contactIds?.includes(friend.id)).length})
                </Text>
                
                {friends
                  .filter(friend => !selectedCircle?.contactIds?.includes(friend.id))
                  .map(friend => (
                    <TouchableOpacity
                      key={friend.id}
                      style={styles.friendItem}
                      onPress={() => handleAddContact(friend.id)}
                    >
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{friend.name}</Text>
                        {friend.username && (
                          <Text style={styles.friendUsername}>@{friend.username}</Text>
                        )}
                        <Text style={styles.friendStatus}>✅ Active on Linkup</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.addFriendButton}
                        onPress={() => handleAddContact(friend.id)}
                      >
                        <Text style={styles.addFriendButtonText}>Add</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                
                {friends.filter(friend => !selectedCircle?.contactIds?.includes(friend.id)).length === 0 && (
                  <View style={styles.allFriendsAddedContainer}>
                    <Text style={styles.allFriendsAddedText}>✅ All your friends are already in this circle!</Text>
                  </View>
                )}
              </>
            )}

            {/* Collapsible section for non-app contacts */}
            {contacts.filter(contact => !contact.isRegistered).length > 0 && (
              <>
                <TouchableOpacity 
                  style={styles.collapsibleHeader}
                  onPress={() => setShowNonAppContacts(!showNonAppContacts)}
                >
                  <Text style={styles.collapsibleTitle}>
                    Contacts not on Linkup ({contacts.filter(contact => !contact.isRegistered && !selectedCircle?.contactIds?.includes(contact.id)).length})
                  </Text>
                  <Text style={styles.collapsibleArrow}>
                    {showNonAppContacts ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>
                
                {showNonAppContacts && contacts
                  .filter(contact => !contact.isRegistered && !selectedCircle?.contactIds?.includes(contact.id))
                  .map(contact => (
                    <TouchableOpacity
                      key={contact.id}
                      style={styles.nonAppContactItem}
                      onPress={() => handleAddContact(contact.id)}
                    >
                      <View>
                        <Text style={styles.nonAppContactName}>{contact.name}</Text>
                        <Text style={styles.nonAppContactPhone}>{contact.phoneNumber}</Text>
                        <Text style={styles.nonAppContactStatus}>📱 Not on Linkup yet</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.addNonAppContactButton}
                        onPress={() => handleAddContact(contact.id)}
                      >
                        <Text style={styles.addNonAppContactButtonText}>Add</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
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
  contactsButton: {
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  contactsButtonText: {
    color: '#4A5568',
    fontSize: 14,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  userMenu: {
    marginLeft: 4,
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
  noMembersContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  noMembersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  noMembersSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  membersGrid: {
    marginBottom: 20,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDB366',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#ED8936',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  memberUsername: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  memberStatus: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  removeButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
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
  // New friend item styles
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#E6FFFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#81E6D9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  friendUsername: {
    fontSize: 14,
    color: '#4A5568',
    marginTop: 2,
  },
  friendStatus: {
    fontSize: 11,
    color: '#48BB78',
    fontWeight: '600',
    marginTop: 4,
  },
  addFriendButton: {
    backgroundColor: '#48BB78',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#48BB78',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addFriendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  allFriendsAddedContainer: {
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    marginBottom: 8,
  },
  allFriendsAddedText: {
    fontSize: 14,
    color: '#15803D',
    fontWeight: '500',
  },
  // Collapsible section styles
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 16,
    marginBottom: 8,
  },
  collapsibleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },
  collapsibleArrow: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  nonAppContactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    opacity: 0.8,
  },
  nonAppContactName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#475569',
  },
  nonAppContactPhone: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  nonAppContactStatus: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 3,
  },
  addNonAppContactButton: {
    backgroundColor: '#94A3B8',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addNonAppContactButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
