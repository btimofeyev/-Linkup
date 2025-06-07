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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useCircles } from '../contexts/CirclesContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

export const ScheduleMeetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const { circles } = useCircles();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState<string>('');
  const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleCircleSelection = (circleId: string) => {
    setSelectedCircles(prev => 
      prev.includes(circleId)
        ? prev.filter(id => id !== circleId)
        : [...prev, circleId]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
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
      console.error('Error getting location:', error);
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
      console.error('Error scheduling meetup:', error);
      Alert.alert('Error', 'Failed to schedule meetup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

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
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatTime(date)}</Text>
            </TouchableOpacity>
          </View>
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

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
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
    paddingTop: 8, // Additional space below SafeAreaView
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
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
    color: '#0F172A',
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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    color: '#0F172A',
    minHeight: 56,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    minHeight: 60,
    justifyContent: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#0F172A',
    textAlign: 'center',
    fontWeight: '600',
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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
    minHeight: 68,
  },
  circleOptionSelected: {
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#8B5CF6',
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
    color: '#0F172A',
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
    borderColor: '#8B5CF6',
    backgroundColor: '#8B5CF6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scheduleButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
    minHeight: 56,
    shadowColor: '#8B5CF6',
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
});
