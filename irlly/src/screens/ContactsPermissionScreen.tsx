import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useContacts } from '../contexts/ContactsContext';

interface ContactsPermissionScreenProps {
  onPermissionGranted: () => void;
  onSkip: () => void;
}

export const ContactsPermissionScreen: React.FC<ContactsPermissionScreenProps> = ({
  onPermissionGranted,
  onSkip,
}) => {
  const { requestPermission } = useContacts();

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      onPermissionGranted();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>📱</Text>
        <Text style={styles.title}>Connect with Friends</Text>
        <Text style={styles.subtitle}>
          IRLly works better when you can see which of your contacts are also using the app.
          We'll only access your contacts to help you find friends.
        </Text>

        <View style={styles.benefits}>
          <View style={styles.benefit}>
            <Text style={styles.benefitEmoji}>👥</Text>
            <Text style={styles.benefitText}>Find friends already on IRLly</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitEmoji}>🔒</Text>
            <Text style={styles.benefitText}>Your contacts stay private</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitEmoji}>⚡</Text>
            <Text style={styles.benefitText}>Quickly create friend groups</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.allowButton} onPress={handleRequestPermission}>
          <Text style={styles.allowButtonText}>Allow Access</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          We never store your contacts on our servers or share them with anyone.
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
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
    marginBottom: 48,
  },
  benefits: {
    width: '100%',
    marginBottom: 48,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  benefitEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  benefitText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  allowButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  allowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    color: '#999',
    lineHeight: 18,
  },
});
