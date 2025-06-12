import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  FlatList,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useCircles } from '../contexts/CirclesContext';
import { useAuth } from '../contexts/AuthContext';
import { Circle } from '../types';
import { apiService } from '../services/apiService';
import { logger } from '../utils/logger';

export const CreatePinScreen: React.FC = () => {
  const navigation = useNavigation();
  const { circles } = useCircles();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [emoji, setEmoji] = useState('📍');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState('');
  const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const emojiOptions = ['📍', '☕', '🍕', '🍻', '🎬', '🏃', '🎵', '🛍️'];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      // First check if we already have permission
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        // Request permission with user-friendly messaging
        const { status: requestStatus } = await Location.requestForegroundPermissionsAsync();
        status = requestStatus;
        
        if (status !== 'granted') {
          Alert.alert(
            'Location Access Needed',
            'To drop a pin at your current location, please enable location access in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return;
        }
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

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
        setAddress(formattedAddress);
      }
    } catch (error) {
      logger.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location');
    }
  };

  const toggleCircleSelection = (circleId: string) => {
    setSelectedCircles(prev => 
      prev.includes(circleId)
        ? prev.filter(id => id !== circleId)
        : [...prev, circleId]
    );
  };

  const handleCreatePin = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your pin');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location is required to drop a pin');
      return;
    }

    if (selectedCircles.length === 0) {
      Alert.alert('Error', 'Please select at least one circle to share with');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.createPin({
        title,
        note,
        emoji,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address,
        circleIds: selectedCircles,
      });
      
      if (response.success) {
        Alert.alert('Success', 'Pin dropped!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        throw new Error(response.error || 'Failed to create pin');
      }
    } catch (error) {
      logger.error('Error creating pin:', error);
      Alert.alert('Error', 'Failed to drop pin. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrapper}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Drop a Pin</Text>
        <Text style={styles.subtitle}>
          Let your friends know what you're up to right now
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>What are you doing?</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Coffee at Blue Bottle"
            maxLength={50}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Add a note (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={note}
            onChangeText={setNote}
            placeholder="Add more details..."
            multiline
            numberOfLines={3}
            maxLength={200}
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
          <Text style={styles.label}>Location</Text>
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>
              {address || 'Getting your location...'}
            </Text>
            <TouchableOpacity onPress={getCurrentLocation}>
              <Text style={styles.refreshButton}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Share with</Text>
          <Text style={styles.sublabel}>Select which circles can see this pin</Text>
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
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreatePin}
          disabled={isLoading}
        >
          <Text style={styles.createButtonText}>
            {isLoading ? 'Dropping Pin...' : 'Drop Pin'}
          </Text>
        </TouchableOpacity>
        </ScrollView>
      </View>
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
    shadowColor: '#2D3748',
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
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#2D3748',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '400',
  },
  refreshButton: {
    color: '#ED8936',
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  createButton: {
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
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sublabel: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 14,
    fontWeight: '400',
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
});
