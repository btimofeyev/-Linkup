import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const BackgroundImage = require('../../assets/nybackground.png');
const LogoImage = require('../../assets/link_logo.png');

export const OnboardingProfileScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  
  const { completeProfileSetup, supabaseUser } = useAuth();

  const validateUsername = (text: string) => {
    if (text.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(text)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return '';
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    const error = validateUsername(text);
    setUsernameError(error);
  };

  const handleCompleteSetup = async () => {
    if (!username.trim() || !name.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (usernameError) {
      Alert.alert('Error', usernameError);
      return;
    }

    setIsLoading(true);
    try {
      await completeProfileSetup(username.trim(), name.trim());
      // Navigation will be handled by AuthContext state change
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-fill name from email if available
  React.useEffect(() => {
    if (supabaseUser?.email && !name) {
      const emailName = supabaseUser.email.split('@')[0];
      setName(emailName);
    }
  }, [supabaseUser?.email]);

  return (
    <ImageBackground source={BackgroundImage} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Image source={LogoImage} style={styles.logo} />
              <Text style={styles.title}>Welcome to Linkup!</Text>
              <Text style={styles.subtitle}>
                Let's set up your profile to get started
              </Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Choose a Username</Text>
                <TextInput
                  style={[styles.input, usernameError ? styles.inputError : null]}
                  placeholder="e.g., john_doe"
                  placeholderTextColor="#666"
                  value={username}
                  onChangeText={handleUsernameChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                {usernameError ? (
                  <Text style={styles.errorText}>{usernameError}</Text>
                ) : null}
                <Text style={styles.helpText}>
                  Friends will use this to add you to their circles
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Your Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., John Doe"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
                <Text style={styles.helpText}>
                  This is how you'll appear in events and activities
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleCompleteSetup}
                disabled={isLoading || !!usernameError || !username.trim() || !name.trim()}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Creating Profile...' : 'Continue to Linkup'}
                </Text>
              </TouchableOpacity>

              <View style={styles.infoContainer}>
                <Text style={styles.infoTitle}>What's next?</Text>
                <Text style={styles.infoText}>• Add friends from your contacts</Text>
                <Text style={styles.infoText}>• Create circles to organize your friends</Text>
                <Text style={styles.infoText}>• Start making real plans together!</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  formContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 10,
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    color: '#000',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  helpText: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 5,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#ff4444',
    marginTop: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#004085',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#ccc',
    marginBottom: 4,
  },
});