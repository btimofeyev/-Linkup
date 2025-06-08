import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Circle } from '../types';
import { apiService } from '../services/apiService';
import { useAuth } from './AuthContext';

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
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      // Only load from backend - remove AsyncStorage dependency
      loadCirclesFromBackend();
    } else {
      // Clear circles when user logs out
      setCircles([]);
    }
  }, [isAuthenticated]);

  const loadCirclesFromBackend = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCircles();
      if (response.success && response.data && (response.data as any).circles) {
        const circlesData = (response.data as any).circles;
        const backendCircles: Circle[] = circlesData.map((circle: any) => ({
          id: circle.id,
          userId: circle.user_id,
          name: circle.name,
          emoji: circle.emoji,
          // Fix: Access the nested contact data correctly
          contactIds: circle.circle_members?.map((member: any) => member.contact?.id) || [],
          createdAt: new Date(circle.created_at),
        }));
        
        setCircles(backendCircles);
      }
    } catch (error) {
      console.error('Error loading circles from backend:', error);
    } finally {
      setIsLoading(false);
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

    if (response.success && response.data && (response.data as any).circle) {
      const circleData = (response.data as any).circle;
      const newCircle: Circle = {
        id: circleData.id,
        userId: circleData.user_id,
        name: circleData.name,
        emoji: circleData.emoji,
        contactIds: contactIds, // Use the passed contactIds
        createdAt: new Date(circleData.created_at),
      };
      
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
      } else {
        throw new Error(response.error || 'Failed to add contacts to circle');
      }
    } catch (error) {
      console.error('Error adding contacts to circle:', error);
      throw error;
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
      } else {
        throw new Error(response.error || 'Failed to remove contact from circle');
      }
    } catch (error) {
      console.error('Error removing contact from circle:', error);
      throw error;
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