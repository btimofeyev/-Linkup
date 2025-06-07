import React, { useState } from 'react';
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
} from 'react-native';
import { useCircles } from '../contexts/CirclesContext';
import { useContacts } from '../contexts/ContactsContext';
import { Circle } from '../types';

export const CirclesScreen: React.FC = () => {
  const { circles, createCircle, deleteCircle } = useCircles();
  const { contacts } = useContacts();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('👥');

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

  const getContactCount = (circle: Circle) => {
    return circle.contactIds?.length || 0; 
  };

  const renderCircle = ({ item }: { item: Circle }) => (
    <TouchableOpacity style={styles.circleItem}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Soft Cream background
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600', // SemiBold
    color: '#2E2F45', // Charcoal Gray
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B5A', // Warm Coral
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    padding: 20,
    paddingTop: 8,
    lineHeight: 22,
    fontWeight: '400',
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  circleItem: {
    marginBottom: 16,
  },
  circleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 72,
  },
  circleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  circleEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: 18,
    fontWeight: '500', // Medium
    color: '#2E2F45',
    marginBottom: 4,
  },
  circleCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF4C4C', // Watermelon Red
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyAddButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B5A', // Warm Coral
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyAddButtonText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2E2F45',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Soft Cream background
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  modalCancelText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '400',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2E2F45',
  },
  modalCreateText: {
    fontSize: 18,
    color: '#FF6B5A', // Warm Coral
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    marginBottom: 36,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '500', // Medium
    color: '#2E2F45',
    marginBottom: 12,
  },
  input: {
    borderWidth: 0,
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    color: '#2E2F45',
    minHeight: 56,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  emojiButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emojiButtonSelected: {
    backgroundColor: '#FF6B5A', // Warm Coral
    shadowOpacity: 0.1,
  },
  emojiText: {
    fontSize: 28,
  },
});
