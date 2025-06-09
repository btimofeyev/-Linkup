import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../contexts/AuthContext';
import { useContacts } from '../contexts/ContactsContext';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import { OnboardingProfileScreen } from '../screens/OnboardingProfileScreen';
import { ContactsPermissionScreen } from '../screens/ContactsPermissionScreen';
import { FeedScreen } from '../screens/FeedScreen';
import { CreatePinScreen } from '../screens/CreatePinScreen';
import { ScheduleMeetupScreen } from '../screens/ScheduleMeetupScreen';
import { CirclesScreen } from '../screens/CirclesScreen';
import { ContactsManagementScreen } from '../screens/ContactsManagementScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabIcon = ({ focused, title }: { focused: boolean; title: string }) => (
  <Text style={{ color: focused ? '#007AFF' : '#666', fontSize: 24 }}>
    {title === 'Feed' ? '🏠' : title === 'Pin' ? '📍' : title === 'Plan' ? '📅' : title === 'Circles' ? '👥' : '👥'}
  </Text>
);

const CirclesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CirclesMain" component={CirclesScreen} />
    <Stack.Screen name="ContactsManagement" component={ContactsManagementScreen} />
  </Stack.Navigator>
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
      component={CirclesStack}
    />
  </Tab.Navigator>
);

const AuthenticatedStack = () => {
  const { hasPermission } = useContacts();
  const [hasShownContactsScreen, setHasShownContactsScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContactsScreenState = async () => {
      try {
        const hasShown = await AsyncStorage.getItem('hasShownContactsScreen');
        if (hasShown === 'true') {
          setHasShownContactsScreen(true);
        }
      } catch (error) {
        console.error('Error loading contacts screen state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContactsScreenState();
  }, []);

  const handleContactsScreenCompleted = async () => {
    try {
      await AsyncStorage.setItem('hasShownContactsScreen', 'true');
      setHasShownContactsScreen(true);
    } catch (error) {
      console.error('Error saving contacts screen state:', error);
      setHasShownContactsScreen(true);
    }
  };

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  // Check if we should show contacts permission screen
  const shouldShowContactsPermission = !hasPermission && !hasShownContactsScreen;

  if (shouldShowContactsPermission) {
    return (
      <ContactsPermissionScreen
        onPermissionGranted={() => {
          handleContactsScreenCompleted();
        }}
        onSkip={() => {
          handleContactsScreenCompleted();
        }}
      />
    );
  }

  return <MainTabs />;
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
  </Stack.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, needsProfileSetup } = useAuth();

  console.log('AppNavigator state:', { isAuthenticated, isLoading, needsProfileSetup });

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : needsProfileSetup ? (
        <OnboardingProfileScreen />
      ) : (
        <AuthenticatedStack />
      )}
    </NavigationContainer>
  );
};