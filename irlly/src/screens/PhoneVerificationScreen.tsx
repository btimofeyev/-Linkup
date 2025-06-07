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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const BackgroundImage = require('../../assets/background.png');
const LogoImage = require('../../assets/linkuplogo.png');

export const PhoneVerificationScreen: React.FC = () => {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { sendVerificationCode, verifyCodeAndLogin } = useAuth();

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setIsLoading(true);
    try {
      await sendVerificationCode(phoneNumber);
      setStep('code');
      Alert.alert('Success', 'Verification code sent to your phone');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      await verifyCodeAndLogin(phoneNumber, verificationCode);
      // Navigation will happen automatically via AuthContext
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setVerificationCode('');
  };

  if (step === 'code') {
    return (
      <SafeAreaView style={styles.container}>
        <ImageBackground
          style={styles.backgroundImage}
          source={BackgroundImage}
        >
          <View style={styles.overlay} />
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image
                source={LogoImage}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Almost There!</Text>
            <Text style={styles.tagline}>Real connections await</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code we sent to {phoneNumber}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Verification Code</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                placeholderTextColor="#A0AEC0"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Verifying...' : 'Join the Movement'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Change Phone Number</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleSendCode}
              disabled={isLoading}
            >
              <Text style={styles.resendButtonText}>Resend Code</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        style={styles.backgroundImage}
        source={BackgroundImage}
      >
        <View style={styles.overlay} />
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={LogoImage}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Welcome to Linkup</Text>
          <Text style={styles.tagline}>Break free from endless scrolling</Text>
          <Text style={styles.subtitle}>
            Skip the DMs. Make real plans with real friends in real time.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+1 (555) 123-4567"
              keyboardType="phone-pad"
              autoFocus
              placeholderTextColor="#A0AEC0"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSendCode}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Sending...' : 'Start Connecting IRL'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF0', // Soft cream background
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 251, 235, 0.9)', // Soft warm overlay
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 120,
    height: 120,
    shadowColor: '#E0B4D6', // Soft lavender shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#4A5568', // Soft charcoal
  },
  tagline: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#D6A2E8', // Soft lavender
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#718096', // Muted blue-gray
    marginBottom: 48,
    lineHeight: 26,
    fontWeight: '400',
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#4A5568', // Soft charcoal
  },
  input: {
    borderWidth: 0,
    borderRadius: 20,
    padding: 20,
    fontSize: 18,
    backgroundColor: '#FEFCF7', // Soft cream white
    shadowColor: '#E2D1C3', // Soft beige shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    color: '#4A5568', // Soft charcoal text
    minHeight: 64,
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: 4,
    fontSize: 24,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#E6C7D8', // Soft dusty rose
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
    minHeight: 64,
    shadowColor: '#D6A2E8', // Soft lavender shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#4A5568', // Soft charcoal for better contrast
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#718096', // Muted blue-gray
    fontSize: 16,
    fontWeight: '500',
  },
  resendButton: {
    padding: 12,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#D6A2E8', // Soft lavender
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 14,
    textAlign: 'center',
    color: '#718096', // Muted blue-gray
    lineHeight: 20,
    fontWeight: '400',
  },
});
