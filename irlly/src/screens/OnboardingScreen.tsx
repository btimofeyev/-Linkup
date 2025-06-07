import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export const OnboardingScreen: React.FC = () => {
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
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>📍</Text>
            <Text style={styles.logoTitle}>Linkup</Text>
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
              placeholderTextColor="#94A3B8"
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>📍</Text>
          <Text style={styles.logoTitle}>Linkup</Text>
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
            placeholderTextColor="#94A3B8"
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 60,
    marginBottom: 8,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#8B5CF6',
    letterSpacing: -1,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#0F172A',
  },
  tagline: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#8B5CF6',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#64748B',
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
    color: '#0F172A',
  },
  input: {
    borderWidth: 0,
    borderRadius: 20,
    padding: 20,
    fontSize: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    color: '#0F172A',
    minHeight: 64,
  },
  button: {
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
    minHeight: 64,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 14,
    textAlign: 'center',
    color: '#64748B',
    lineHeight: 20,
    fontWeight: '400',
  },
  codeInput: {
    // Add any specific styles for the code input if needed
  },
  backButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 64,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  resendButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    minHeight: 64,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  resendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
