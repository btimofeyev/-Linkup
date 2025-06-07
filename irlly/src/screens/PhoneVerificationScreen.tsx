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
        <View style={styles.content}>
          <Text style={styles.title}>Verify Your Phone</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code we sent to {phoneNumber}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={styles.input}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleVerifyCode}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Verifying...' : 'Verify Code'}
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
        <Text style={styles.title}>Welcome to IRLly</Text>
        <Text style={styles.subtitle}>
          Connect with friends and make spontaneous plans
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
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSendCode}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Sending...' : 'Send Verification Code'}
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
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 48,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 2,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
  resendButton: {
    padding: 8,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    lineHeight: 18,
  },
});