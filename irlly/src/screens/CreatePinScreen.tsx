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
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emojiButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  emojiButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  emojiText: {
    fontSize: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#495057',
  },
  refreshButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sublabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
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
});