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
  }, []);

  const loadCirclesFromStorage = async () => {
    try {
      const response = await apiService.getCircles();
      if (response.success && response.data) {
        setCircles(response.data.circles || []);
      }
    } catch (error) {
      console.error('Error loading circles:', error);
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
    const response = await apiService.createCircle({
      name,
      emoji,
      contactIds,
    });

    if (response.success && response.data) {
      const newCircle = response.data.circle;
      const updatedCircles = [...circles, newCircle];
      setCircles(updatedCircles);
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
    } else {
      throw new Error(response.error || 'Failed to update circle');
    }
  };

  const deleteCircle = async (id: string) => {
    const response = await apiService.deleteCircle(id);
    
    if (response.success) {
      const updatedCircles = circles.filter(circle => circle.id !== id);
      setCircles(updatedCircles);
    } else {
      throw new Error(response.error || 'Failed to delete circle');
    }
  };

  const addContactsToCircle = async (circleId: string, contactIds: string[]) => {
    const updatedCircles = circles.map(circle => {
      if (circle.id === circleId) {
        const newContactIds = [...new Set([...circle.contactIds, ...contactIds])];
        return { ...circle, contactIds: newContactIds };
      }
      return circle;
    });
    setCircles(updatedCircles);
    await saveCirclesToStorage(updatedCircles);
  };

  const removeContactFromCircle = async (circleId: string, contactId: string) => {
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
  };

  const refreshCircles = async () => {
    await loadCirclesFromStorage();
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