import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useCircles } from '../contexts/CirclesContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { logger } from '../utils/logger';

export const ScheduleMeetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const { circles } = useCircles();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📅');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState<string>('');
  const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const emojiOptions = ['📅', '☕', '🍕', '🍻', '🎬', '🏃', '🎵', '🛍️'];

  const toggleCircleSelection = (circleId: string) => {
    setSelectedCircles(prev => 
      prev.includes(circleId)
        ? prev.filter(id => id !== circleId)
        : [...prev, circleId]
    );
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (addressResult) {
        const formattedAddress = [
          addressResult.name,
          addressResult.street,
          addressResult.city,
        ]
          .filter(Boolean)
          .join(', ');
        setLocation(formattedAddress);
      }
    } catch (error) {
      logger.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location');
    }
  };

  const handleScheduleMeetup = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your meetup');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    if (selectedCircles.length === 0) {
      Alert.alert('Error', 'Please select at least one circle to invite');
      return;
    }

    if (date <= new Date()) {
      Alert.alert('Error', 'Please select a future date and time');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.createMeetup({
        title,
        description,
        emoji,
        latitude: 0, // TODO: Get actual coordinates from location string
        longitude: 0,
        address: location,
        scheduledFor: date.toISOString(),
        circleIds: selectedCircles,
      });
      
      if (response.success) {
        Alert.alert('Success', 'Meetup scheduled!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        throw new Error(response.error || 'Failed to create meetup');
      }
    } catch (error) {
      logger.error('Error scheduling meetup:', error);
      Alert.alert('Error', 'Failed to schedule meetup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Quick preset options for scheduling
  const getPresetDates = () => {
    const now = new Date();
    const presets = [
      { label: 'In 1 hour', date: new Date(now.getTime() + 60 * 60 * 1000) },
      { label: 'In 2 hours', date: new Date(now.getTime() + 2 * 60 * 60 * 1000) },
      { label: 'Tonight at 7 PM', date: (() => {
        const tonight = new Date();
        tonight.setHours(19, 0, 0, 0);
        if (tonight <= now) tonight.setDate(tonight.getDate() + 1);
        return tonight;
      })() },
      { label: 'Tomorrow at 12 PM', date: (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);
        return tomorrow;
      })() },
      { label: 'Tomorrow at 6 PM', date: (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(18, 0, 0, 0);
        return tomorrow;
      })() },
      { label: 'This weekend', date: (() => {
        const weekend = new Date();
        const daysUntilSaturday = (6 - weekend.getDay()) % 7;
        weekend.setDate(weekend.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday));
        weekend.setHours(14, 0, 0, 0);
        return weekend;
      })() },
    ];
    return presets.filter(preset => preset.date > now);
  };

  const CustomDatePicker = () => (
    <Modal
      visible={showDatePicker}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDatePicker(false)}
    >
      <SafeAreaView style={styles.pickerModal}>
        <View style={styles.pickerHeader}>
          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
            <Text style={styles.pickerCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.pickerTitle}>Select Date & Time</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
            <Text style={styles.pickerDone}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.pickerContent}>
          <Text style={styles.presetLabel}>Quick Options</Text>
          {getPresetDates().map((preset, index) => (
            <TouchableOpacity
              key={index}
              style={styles.presetOption}
              onPress={() => {
                setDate(preset.date);
                setShowDatePicker(false);
              }}
            >
              <Text style={styles.presetText}>{preset.label}</Text>
              <Text style={styles.presetDate}>{formatDateTime(preset.date)}</Text>
            </TouchableOpacity>
          ))}
          
          <Text style={styles.customLabel}>Custom Date & Time</Text>
          <Text style={styles.customNote}>
            Current selection: {formatDateTime(date)}
          </Text>
          
          {/* Simple custom time inputs */}
          <View style={styles.customInputs}>
            <Text style={styles.inputNote}>
              For custom times, you can edit the date above or contact support for advanced scheduling options.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrapper}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Plan Something</Text>
        <Text style={styles.subtitle}>
          Schedule a meetup for later and invite your circles
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>What's the plan?</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Dinner at Chez Laurent"
            maxLength={100}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Choose an emoji</Text>
          <View style={styles.emojiContainer}>
            {emojiOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.emojiButton,
                  emoji === option && styles.emojiButtonSelected,
                ]}
                onPress={() => setEmoji(option)}
              >
                <Text style={styles.emojiText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add more details about the plan..."
            multiline
            numberOfLines={3}
            maxLength={300}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>When</Text>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateTimeText}>{formatDateTime(date)}</Text>
            <Text style={styles.dateTimeIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Where</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter location or address"
            maxLength={200}
          />
          <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
            <Text style={styles.locationButtonText}>📍 Use Current Location</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Invite circles</Text>
          <Text style={styles.sublabel}>Select which circles to invite</Text>
          {circles.map(circle => (
            <TouchableOpacity
              key={circle.id}
              style={[
                styles.circleOption,
                selectedCircles.includes(circle.id) && styles.circleOptionSelected,
              ]}
              onPress={() => toggleCircleSelection(circle.id)}
            >
              <View style={styles.circleOptionContent}>
                <Text style={styles.circleEmoji}>{circle.emoji}</Text>
                <Text style={styles.circleName}>{circle.name}</Text>
              </View>
              <View style={[
                styles.checkbox,
                selectedCircles.includes(circle.id) && styles.checkboxSelected,
              ]}>
                {selectedCircles.includes(circle.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.scheduleButton, isLoading && styles.scheduleButtonDisabled]}
          onPress={handleScheduleMeetup}
          disabled={isLoading}
        >
          <Text style={styles.scheduleButtonText}>
            {isLoading ? 'Scheduling...' : 'Schedule Meetup'}
          </Text>
        </TouchableOpacity>
        </ScrollView>
      </View>

      <CustomDatePicker />
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
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 17,
    color: '#64748B',
    marginBottom: 24,
    fontWeight: '400',
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 10,
  },
  sublabel: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 14,
    fontWeight: '400',
  },
  input: {
    borderWidth: 0,
    borderRadius: 20,
    padding: 18,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#2D3748',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    color: '#2D3748',
    minHeight: 56,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#2D3748',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    minHeight: 60,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '600',
    flex: 1,
  },
  dateTimeIcon: {
    fontSize: 20,
  },
  locationButton: {
    marginTop: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    minHeight: 48,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  locationButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  circleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    marginBottom: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#2D3748',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
    minHeight: 68,
  },
  circleOptionSelected: {
    backgroundColor: '#FFF2E8',
    borderWidth: 2,
    borderColor: '#ED8936',
    shadowOpacity: 0.08,
  },
  circleOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  circleEmoji: {
    fontSize: 22,
    marginRight: 14,
  },
  circleName: {
    fontSize: 17,
    color: '#2D3748',
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    borderColor: '#ED8936',
    backgroundColor: '#FDB366',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scheduleButton: {
    backgroundColor: '#FDB366',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
    minHeight: 56,
    shadowColor: '#ED8936',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  scheduleButtonDisabled: {
    opacity: 0.6,
  },
  scheduleButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  emojiButton: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#2D3748',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
  },
  emojiButtonSelected: {
    backgroundColor: '#FDB366',
    shadowOpacity: 0.12,
  },
  emojiText: {
    fontSize: 26,
  },
  // Custom date picker styles
  pickerModal: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pickerCancel: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  pickerDone: {
    fontSize: 16,
    color: '#ED8936',
    fontWeight: '600',
  },
  pickerContent: {
    flex: 1,
    padding: 20,
  },
  presetLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  presetOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  presetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
  },
  presetDate: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'right',
  },
  customLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginTop: 24,
    marginBottom: 16,
  },
  customNote: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  customInputs: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
  },
  inputNote: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },

});