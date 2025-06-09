import React, { useState, useEffect } from 'react';
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

interface EmailVerificationScreenProps {
  navigation: any;
}

const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [isLoading, setIsLoading] = useState(false);
  
  const { sendEmailOTP, verifyEmailOTP, isAuthenticated, needsProfileSetup } = useAuth();

  // Handle auth state changes to reset loading state
  useEffect(() => {
    if (isAuthenticated || needsProfileSetup) {
      logger.log('EmailVerificationScreen: Auth state changed - authenticated:', isAuthenticated, 'needsProfileSetup:', needsProfileSetup);
      setIsLoading(false);
    }
  }, [isAuthenticated, needsProfileSetup]);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await sendEmailOTP(email);
      setStep('code');
      Alert.alert('Success', 'Check your email for a 6-digit verification code');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      logger.log('EmailVerificationScreen: Starting verification for email:', email);
      await verifyEmailOTP(email, code);
      logger.log('EmailVerificationScreen: Verification successful, waiting for auth state change...');
      // Navigation will be handled by AuthContext onAuthStateChange
    } catch (error: any) {
      logger.error('EmailVerificationScreen: Verification failed:', error);
      Alert.alert('Error', error.message || 'Invalid verification code');
      setIsLoading(false);
    }
    // Don't set loading to false here - let auth state change handle it
  };

  const handleResendCode = async () => {
    try {
      await sendEmailOTP(email);
      Alert.alert('Success', 'New verification code sent to your email');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend code');
    }
  };

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
              <Text style={styles.title}>
                {step === 'email' ? 'Welcome to Linkup' : 'Enter Verification Code'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 'email' 
                  ? 'Enter your email to get started' 
                  : `We sent a 6-digit code to ${email}`
                }
              </Text>
            </View>

            <View style={styles.formContainer}>

              {step === 'email' ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleSendCode}
                    disabled={isLoading}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? 'Sending...' : 'Send Code'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#666"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleVerifyCode}
                    disabled={isLoading}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? 'Verifying...' : 'Verify Code'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.resendButton} onPress={handleResendCode}>
                    <Text style={styles.resendText}>Resend Code</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => setStep('email')}
                  >
                    <Text style={styles.backText}>Change Email</Text>
                  </TouchableOpacity>
                </>
              )}
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
    width: 120,
    height: 120,
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
    marginBottom: 20,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  formContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 10,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#000',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
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
  resendButton: {
    marginBottom: 10,
  },
  resendText: {
    color: '#007AFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  backButton: {
    marginTop: 10,
  },
  backText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default EmailVerificationScreen;