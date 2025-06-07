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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    color: '#0F172A',
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
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
    color: '#0F172A',
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
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#8B5CF6',
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
    color: '#0F172A',
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
    backgroundColor: '#F8FAFC',
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
    color: '#0F172A',
  },
  modalCreateText: {
    fontSize: 17,
    color: '#8B5CF6',
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
    color: '#0F172A',
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
    color: '#0F172A',
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
    backgroundColor: '#8B5CF6',
    shadowOpacity: 0.12,
  },
  emojiText: {
    fontSize: 26,
  },
});
