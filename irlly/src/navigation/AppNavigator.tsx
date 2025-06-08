import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { useContacts } from '../contexts/ContactsContext';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PhoneVerificationScreen } from '../screens/PhoneVerificationScreen';
import { ContactsPermissionScreen } from '../screens/ContactsPermissionScreen';
import { FeedScreen } from '../screens/FeedScreen';
import { CreatePinScreen } from '../screens/CreatePinScreen';
import { ScheduleMeetupScreen } from '../screens/ScheduleMeetupScreen';
import { CirclesScreen } from '../screens/CirclesScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabIcon = ({ focused, title }: { focused: boolean; title: string }) => (
  <Text style={{ color: focused ? '#007AFF' : '#666', fontSize: 24 }}>
    {title === 'Feed' ? '🏠' : title === 'Pin' ? '📍' : title === 'Plan' ? '📅' : '👥'}
  </Text>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused }) => (
        <TabIcon focused={focused} title={route.name} />
      ),
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: '#666',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Feed" component={FeedScreen} />
    <Tab.Screen 
      name="Pin" 
      component={CreatePinScreen}
      options={{ tabBarLabel: 'Drop Pin' }}
    />
    <Tab.Screen 
      name="Plan" 
      component={ScheduleMeetupScreen}
      options={{ tabBarLabel: 'Plan' }}
    />
    <Tab.Screen 
      name="Circles" 
      component={CirclesScreen}
    />
  </Tab.Navigator>
);

const AuthenticatedStack = () => {
  const { hasPermission } = useContacts();
  const [hasShownContactsScreen, setHasShownContactsScreen] = useState(false);

  // Check if we should show contacts permission screen
  const shouldShowContactsPermission = !hasPermission && !hasShownContactsScreen;

  if (shouldShowContactsPermission) {
    return (
      <ContactsPermissionScreen
        onPermissionGranted={() => {
          console.log('Contacts permission granted');
          setHasShownContactsScreen(true);
        }}
        onSkip={() => {
          console.log('Contacts permission skipped');
          setHasShownContactsScreen(true);
        }}
      />
    );
  }

  return <MainTabs />;
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
  </Stack.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AuthenticatedStack /> : <AuthStack />}
    </NavigationContainer>
  );
};