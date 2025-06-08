import { Contact } from '../types';

// Test contacts that match the backend test users
export const mockContacts: Partial<Contact>[] = [
  {
    name: 'Test User 1',
    phoneNumber: '+1234567890'
  },
  {
    name: 'Test User 2', 
    phoneNumber: '+1234567891'
  },
  {
    name: 'Test User 3',
    phoneNumber: '+1234567892'
  },
  {
    name: 'John Doe (Not Registered)',
    phoneNumber: '+1555123456'
  },
  {
    name: 'Jane Smith (Not Registered)',
    phoneNumber: '+1555654321'
  }
];

export const getMockContacts = (): Partial<Contact>[] => {
  return mockContacts.map(contact => ({
    ...contact,
    id: `mock-${Date.now()}-${Math.random()}`,
    userId: 'current-user',
    contactId: `contact-${Date.now()}-${Math.random()}`,
    isRegistered: false, // Will be updated by backend sync
    createdAt: new Date()
  }));
};