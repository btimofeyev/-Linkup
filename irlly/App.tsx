import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { ContactsProvider } from './src/contexts/ContactsContext';
import { CirclesProvider } from './src/contexts/CirclesContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ContactsProvider>
        <CirclesProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </CirclesProvider>
      </ContactsProvider>
    </AuthProvider>
  );
}
