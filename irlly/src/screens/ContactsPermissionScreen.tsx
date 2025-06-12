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
}

export const ContactsPermissionScreen: React.FC<ContactsPermissionScreenProps> = ({
  onPermissionGranted,
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
          Linkup works better when you can see which of your contacts are also using the app.
          We'll only access your contacts to help you find friends.
        </Text>

        <View style={styles.benefits}>
          <View style={styles.benefit}>
            <Text style={styles.benefitEmoji}>👥</Text>
            <Text style={styles.benefitText}>Find friends already on Linkup</Text>
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
          <Text style={styles.allowButtonText}>Continue</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          We only store contacts who are registered Linkup users to help you find friends. Your contacts are never shared with anyone.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
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
    color: '#2D3748',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4A5568',
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
    color: '#2D3748',
    flex: 1,
  },
  allowButton: {
    backgroundColor: '#FDB366',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    shadowColor: '#ED8936',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 64,
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    color: '#4A5568',
    lineHeight: 18,
  },
});
