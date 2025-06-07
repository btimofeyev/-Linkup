import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact } from '../types';
import { apiService } from '../services/apiService';

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
    loadContactsFromBackend();
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

  const loadContactsFromBackend = async () => {
    try {
      const response = await apiService.getContacts();
      if (response.success && response.data) {
        const backendContacts: Contact[] = response.data.contacts.map((contact: any) => ({
          id: contact.id,
          userId: contact.user_id,
          contactId: contact.contact_user_id || contact.id,
          name: contact.name,
          phoneNumber: contact.phone_number,
          isRegistered: contact.is_registered,
          createdAt: new Date(contact.created_at),
        }));
        
        // Update local storage with backend data
        setContacts(backendContacts);
        await AsyncStorage.setItem('contacts', JSON.stringify(backendContacts));
      }
    } catch (error) {
      console.error('Error loading contacts from backend:', error);
      // Don't fail silently - this is likely because user isn't authenticated yet
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

      // Sync contacts with backend
      try {
        const contactsForBackend = processedContacts.map(contact => ({
          name: contact.name,
          phoneNumber: contact.phoneNumber
        }));
        
        const syncResponse = await apiService.syncContacts(contactsForBackend);
        if (syncResponse.success && syncResponse.data) {
          // Update local contacts with backend response (registered status, etc.)
          const backendContacts = syncResponse.data.contacts || [];
          const updatedContacts = processedContacts.map(localContact => {
            const backendContact = backendContacts.find(
              (bc: any) => bc.phone_number === localContact.phoneNumber
            );
            return {
              ...localContact,
              isRegistered: !!backendContact?.is_registered,
              contactId: backendContact?.id || localContact.contactId
            };
          });
          setContacts(updatedContacts);
          await AsyncStorage.setItem('contacts', JSON.stringify(updatedContacts));
        } else {
          // Fallback to local contacts if backend sync fails
          setContacts(processedContacts);
          await AsyncStorage.setItem('contacts', JSON.stringify(processedContacts));
        }
      } catch (error) {
        console.error('Error syncing contacts with backend:', error);
        // Fallback to local contacts if backend sync fails
        setContacts(processedContacts);
        await AsyncStorage.setItem('contacts', JSON.stringify(processedContacts));
      }
    } catch (error) {
      console.error('Error syncing contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshContacts = async () => {
    if (hasPermission) {
      await syncContacts();
    } else {
      await loadContactsFromBackend();
    }
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