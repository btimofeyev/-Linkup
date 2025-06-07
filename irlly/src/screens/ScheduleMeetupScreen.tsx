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
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  locationButton: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
  },
  locationButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  circleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  circleOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  circleOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  circleEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  circleName: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scheduleButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  scheduleButtonDisabled: {
    opacity: 0.6,
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});