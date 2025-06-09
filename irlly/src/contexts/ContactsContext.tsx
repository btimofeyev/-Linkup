import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
    // Don't load from backend immediately - let the auth flow complete first
  }, []);

  const checkPermission = async () => {
    try {
      const { status } = await Contacts.getPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      
      // If we have permission, auto-sync contacts
      if (granted) {
        loadContactsFromBackend();
      }
    } catch (error) {
      logger.error('Error checking contacts permission:', error);
      setHasPermission(false);
    }
  };

  const loadContactsFromStorage = async () => {
    try {
      const storedContacts = await AsyncStorage.getItem('contacts');
      if (storedContacts) {
        const parsedContacts = JSON.parse(storedContacts);
        setContacts(parsedContacts);
      }
    } catch (error) {
      logger.error('Error loading contacts from storage:', error);
    }
  };

  const loadContactsFromBackend = useCallback(async () => {
    try {
      const response = await apiService.getContacts();
      if (response.success && response.data && (response.data as any).contacts) {
        const contactsArray = (response.data as any).contacts;
        const backendContacts: Contact[] = Array.isArray(contactsArray) ? contactsArray.map((contact: any) => ({
          id: contact.id,
          userId: contact.user_id,
          contactId: contact.contact_user_id || contact.id,
          name: contact.name,
          phoneNumber: contact.phone_number,
          username: contact.username, // Add username field
          isRegistered: contact.is_registered,
          createdAt: new Date(contact.created_at),
        })) : [];
        
        logger.log(`Contacts loaded from backend: ${backendContacts.length}`);
        logger.log('Backend registered contacts:', backendContacts.filter(c => c.isRegistered).length);
        logger.log('Backend username contacts:', backendContacts.filter(c => c.username).length);
        logger.log('Username contacts details:', backendContacts.filter(c => c.username).map(c => ({ name: c.name, username: c.username, isRegistered: c.isRegistered })));
        
        // Update local storage with backend data
        setContacts(backendContacts);
        await AsyncStorage.setItem('contacts', JSON.stringify(backendContacts));
      }
    } catch (error) {
      logger.error('Error loading contacts from backend:', error);
      // Don't fail silently - this is likely because user isn't authenticated yet
    }
  }, []);

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
      logger.error('Error requesting contacts permission:', error);
      return false;
    }
  };

  const syncContacts = async () => {
    if (!hasPermission) {
      logger.warn('No permission to access contacts');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });

      logger.log(`Total raw contacts from device: ${data.length}`);

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

      logger.log(`Filtered contacts (with name & phone): ${processedContacts.length}`);

      // Sync contacts with backend
      try {
        const contactsForBackend = processedContacts.map(contact => ({
          name: contact.name,
          phoneNumber: contact.phoneNumber || ''
        }));
        
        const syncResponse = await apiService.syncContacts(contactsForBackend);
        if (syncResponse.success && syncResponse.data && (syncResponse.data as any).contacts) {
          // Backend now returns ALL contacts (phone + username), so use them directly
          const contactsArray = (syncResponse.data as any).contacts;
          const allBackendContacts = Array.isArray(contactsArray) ? contactsArray : [];
          
          const allContacts: Contact[] = allBackendContacts.map((contact: any) => ({
            id: contact.id,
            userId: contact.user_id,
            contactId: contact.contact_user_id || contact.id,
            name: contact.name,
            phoneNumber: contact.phone_number,
            username: contact.username,
            isRegistered: contact.is_registered,
            createdAt: new Date(contact.created_at),
          }));
          
          setContacts(allContacts);
          await AsyncStorage.setItem('contacts', JSON.stringify(allContacts));
          logger.log(`Final synced contacts count: ${allContacts.length} (includes username-based contacts)`);
        } else {
          logger.error('Backend sync failed:', syncResponse.error);
          // Fallback to local contacts if backend sync fails
          setContacts(processedContacts);
          await AsyncStorage.setItem('contacts', JSON.stringify(processedContacts));
          logger.log(`Fallback contacts count: ${processedContacts.length}`);
        }
      } catch (error) {
        logger.error('Error syncing contacts with backend:', error);
        // Fallback to local contacts if backend sync fails
        setContacts(processedContacts);
        await AsyncStorage.setItem('contacts', JSON.stringify(processedContacts));
        logger.log(`Error fallback contacts count: ${processedContacts.length}`);
      }
    } catch (error) {
      logger.error('Error syncing contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshContacts = useCallback(async () => {
    if (hasPermission) {
      await syncContacts(); // Now returns ALL contacts including username-based ones
    } else {
      await loadContactsFromBackend();
    }
  }, [hasPermission, loadContactsFromBackend]);

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