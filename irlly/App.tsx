import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ContactsProvider } from './src/contexts/ContactsContext';
import { CirclesProvider } from './src/contexts/CirclesContext';
import { FeedProvider } from './src/contexts/FeedContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SplashScreen } from './src/components/SplashScreen';

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <ContactsProvider>
      <CirclesProvider>
        <FeedProvider isAuthenticated={isAuthenticated}>
          <AppNavigator />
          <StatusBar style="auto" />
        </FeedProvider>
      </CirclesProvider>
    </ContactsProvider>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}