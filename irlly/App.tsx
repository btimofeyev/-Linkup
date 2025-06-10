import 'react-native-reanimated';
import 'react-native-gesture-handler';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ContactsProvider } from './src/contexts/ContactsContext';
import { CirclesProvider } from './src/contexts/CirclesContext';
import { FeedProvider } from './src/contexts/FeedContext';
import { AppNavigator } from './src/navigation/AppNavigator';

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <ContactsProvider>
      <CirclesProvider>
        <FeedProvider isAuthenticated={isAuthenticated}>
          <AppNavigator />
        </FeedProvider>
      </CirclesProvider>
    </ContactsProvider>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}