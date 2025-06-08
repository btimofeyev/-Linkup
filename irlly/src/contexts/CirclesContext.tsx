import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Circle } from '../types';
import { apiService } from '../services/apiService';

interface CirclesContextType {
  circles: Circle[];
  isLoading: boolean;
  createCircle: (name: string, emoji?: string, contactIds?: string[]) => Promise<Circle>;
  updateCircle: (id: string, updates: Partial<Circle>) => Promise<void>;
  deleteCircle: (id: string) => Promise<void>;
  addContactsToCircle: (circleId: string, contactIds: string[]) => Promise<void>;
  removeContactFromCircle: (circleId: string, contactId: string) => Promise<void>;
  refreshCircles: () => Promise<void>;
}

const CirclesContext = createContext<CirclesContextType | undefined>(undefined);

export const useCircles = () => {
  const context = useContext(CirclesContext);
  if (!context) {
    throw new Error('useCircles must be used within a CirclesProvider');
  }
  return context;
};

interface CirclesProviderProps {
  children: ReactNode;
}

export const CirclesProvider: React.FC<CirclesProviderProps> = ({ children }) => {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCirclesFromStorage();
    // Load from backend after component mounts
    setTimeout(() => {
      loadCirclesFromBackend();
    }, 1000);
  }, []);

  const loadCirclesFromStorage = async () => {
    try {
      const storedCircles = await AsyncStorage.getItem('circles');
      if (storedCircles) {
        const parsedCircles = JSON.parse(storedCircles);
        console.log('Loaded circles from storage:', parsedCircles.length);
        setCircles(parsedCircles);
      }
    } catch (error) {
      console.error('Error loading circles from storage:', error);
    }
  };

  const loadCirclesFromBackend = async () => {
    try {
      console.log('Loading circles from backend...');
      const response = await apiService.getCircles();
      if (response.success && response.data) {
        const backendCircles: Circle[] = response.data.circles.map((circle: any) => ({
          id: circle.id,
          userId: circle.user_id,
          name: circle.name,
          emoji: circle.emoji,
          contactIds: circle.members?.map((member: any) => member.id) || [],
          createdAt: new Date(circle.created_at),
        }));
        
        console.log('Loaded circles from backend:', backendCircles.length);
        setCircles(backendCircles);
        await AsyncStorage.setItem('circles', JSON.stringify(backendCircles));
      }
    } catch (error) {
      console.error('Error loading circles from backend:', error);
    }
  };

  const saveCirclesToStorage = async (updatedCircles: Circle[]) => {
    try {
      await AsyncStorage.setItem('circles', JSON.stringify(updatedCircles));
    } catch (error) {
      console.error('Error saving circles to storage:', error);
    }
  };

  const createCircle = async (
    name: string,
    emoji?: string,
    contactIds: string[] = []
  ): Promise<Circle> => {
    console.log('Creating circle:', { name, emoji, contactIds });
    
    const response = await apiService.createCircle({
      name,
      emoji,
      contactIds,
    });

    if (response.success && response.data) {
      const newCircle: Circle = {
        id: response.data.circle.id,
        userId: response.data.circle.user_id,
        name: response.data.circle.name,
        emoji: response.data.circle.emoji,
        contactIds: contactIds, // Use the passed contactIds
        createdAt: new Date(response.data.circle.created_at),
      };
      
      const updatedCircles = [...circles, newCircle];
      setCircles(updatedCircles);
      await saveCirclesToStorage(updatedCircles);
      
      console.log('Circle created successfully:', newCircle);
      return newCircle;
    }

    throw new Error(response.error || 'Failed to create circle');
  };

  const updateCircle = async (id: string, updates: Partial<Circle>) => {
    const response = await apiService.updateCircle(id, {
      name: updates.name,
      emoji: updates.emoji,
    });

    if (response.success) {
      const updatedCircles = circles.map(circle =>
        circle.id === id ? { ...circle, ...updates } : circle
      );
      setCircles(updatedCircles);
      await saveCirclesToStorage(updatedCircles);
    } else {
      throw new Error(response.error || 'Failed to update circle');
    }
  };

  const deleteCircle = async (id: string) => {
    const response = await apiService.deleteCircle(id);
    
    if (response.success) {
      const updatedCircles = circles.filter(circle => circle.id !== id);
      setCircles(updatedCircles);
      await saveCirclesToStorage(updatedCircles);
    } else {
      throw new Error(response.error || 'Failed to delete circle');
    }
  };

  const addContactsToCircle = async (circleId: string, contactIds: string[]) => {
    try {
      // Call backend API
      const response = await apiService.addContactsToCircle(circleId, contactIds);
      
      if (response.success) {
        // Update local state
        const updatedCircles = circles.map(circle => {
          if (circle.id === circleId) {
            const newContactIds = [...new Set([...circle.contactIds, ...contactIds])];
            return { ...circle, contactIds: newContactIds };
          }
          return circle;
        });
        setCircles(updatedCircles);
        await saveCirclesToStorage(updatedCircles);
      } else {
        throw new Error(response.error || 'Failed to add contacts to circle');
      }
    } catch (error) {
      console.error('Error adding contacts to circle:', error);
      // Fallback to local update if backend fails
      const updatedCircles = circles.map(circle => {
        if (circle.id === circleId) {
          const newContactIds = [...new Set([...circle.contactIds, ...contactIds])];
          return { ...circle, contactIds: newContactIds };
        }
        return circle;
      });
      setCircles(updatedCircles);
      await saveCirclesToStorage(updatedCircles);
    }
  };

  const removeContactFromCircle = async (circleId: string, contactId: string) => {
    try {
      // Call backend API
      const response = await apiService.removeContactFromCircle(circleId, contactId);
      
      if (response.success) {
        // Update local state
        const updatedCircles = circles.map(circle => {
          if (circle.id === circleId) {
            return {
              ...circle,
              contactIds: circle.contactIds.filter(id => id !== contactId),
            };
          }
          return circle;
        });
        setCircles(updatedCircles);
        await saveCirclesToStorage(updatedCircles);
      } else {
        throw new Error(response.error || 'Failed to remove contact from circle');
      }
    } catch (error) {
      console.error('Error removing contact from circle:', error);
      // Fallback to local update if backend fails
      const updatedCircles = circles.map(circle => {
        if (circle.id === circleId) {
          return {
            ...circle,
            contactIds: circle.contactIds.filter(id => id !== contactId),
          };
        }
        return circle;
      });
      setCircles(updatedCircles);
      await saveCirclesToStorage(updatedCircles);
    }
  };

  const refreshCircles = async () => {
    await loadCirclesFromBackend();
  };

  const value: CirclesContextType = {
    circles,
    isLoading,
    createCircle,
    updateCircle,
    deleteCircle,
    addContactsToCircle,
    removeContactFromCircle,
    refreshCircles,
  };

  return <CirclesContext.Provider value={value}>{children}</CirclesContext.Provider>;
};