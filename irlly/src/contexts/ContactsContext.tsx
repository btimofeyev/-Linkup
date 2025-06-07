import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact } from '../types';

interface ContactsContextType {
  contacts: Contact[];
  isLoading: boolean;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  syncContacts: () => Promise<void>;
  refreshContacts: () => Promise<void>;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export const useContacts = () => {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
};

interface ContactsProviderProps {
  children: ReactNode;
}

export const ContactsProvider: React.FC<ContactsProviderProps> = ({ children }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkPermission();
    loadContactsFromStorage();
  }, []);

  const checkPermission = async () => {
    const { status } = await Contacts.getPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const loadContactsFromStorage = async () => {
    try {
      const storedContacts = await AsyncStorage.getItem('contacts');
      if (storedContacts) {
        setContacts(JSON.parse(storedContacts));
      }
    } catch (error) {
      console.error('Error loading contacts from storage:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      
      if (granted) {
        await syncContacts();
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      return false;
    }
  };

  const syncContacts = async () => {
    if (!hasPermission) {
      console.warn('No permission to access contacts');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });

      const processedContacts: Contact[] = data
        .filter(contact => 
          contact.name && 
          contact.phoneNumbers && 
          contact.phoneNumbers.length > 0
        )
        .map(contact => ({
          id: contact.id || Date.now().toString(),
          userId: 'current-user', // TODO: Replace with actual user ID
          contactId: contact.id || Date.now().toString(),
          name: contact.name || 'Unknown',
          phoneNumber: contact.phoneNumbers![0].number || '',
          isRegistered: false, // TODO: Check against backend
          createdAt: new Date(),
        }));

      setContacts(processedContacts);
      await AsyncStorage.setItem('contacts', JSON.stringify(processedContacts));
    } catch (error) {
      console.error('Error syncing contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshContacts = async () => {
    await syncContacts();
  };

  const value: ContactsContextType = {
    contacts,
    isLoading,
    hasPermission,
    requestPermission,
    syncContacts,
    refreshContacts,
  };

  return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>;
};