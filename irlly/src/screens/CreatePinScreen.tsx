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
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useCircles } from '../contexts/CirclesContext';
import { useAuth } from '../contexts/AuthContext';
import { Circle } from '../types';
import { apiService } from '../services/apiService';

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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to drop a pin');
        return;
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
      console.error('Error getting location:', error);
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
      console.error('Error creating pin:', error);
      Alert.alert('Error', 'Failed to drop pin. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Soft Cream background
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '600', // SemiBold
    color: '#2E2F45', // Charcoal Gray
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 32,
    fontWeight: '400',
    lineHeight: 24,
  },
  section: {
    marginBottom: 28,
  },
  label: {
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
  textArea: {
    height: 120,
    textAlignVertical: 'top',
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
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: '#2E2F45',
    fontWeight: '400',
  },
  refreshButton: {
    color: '#FF6B5A', // Warm Coral
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  createButton: {
    backgroundColor: '#FF6B5A', // Warm Coral
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    minHeight: 56,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  sublabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '400',
  },
  circleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 72,
  },
  circleOptionSelected: {
    backgroundColor: '#A4F1C5', // Mint Green
    shadowOpacity: 0.1,
  },
  circleOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  circleEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  circleName: {
    fontSize: 18,
    color: '#2E2F45',
    fontWeight: '500',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    borderColor: '#FF6B5A',
    backgroundColor: '#FF6B5A',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
