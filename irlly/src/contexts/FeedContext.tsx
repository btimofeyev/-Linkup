import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { FeedItem } from '../types';
import { apiService } from '../services/apiService';
import { logger } from '../utils/logger';

interface FeedContextType {
  feedItems: FeedItem[];
  isLoading: boolean;
  loadFeed: () => Promise<void>;
  refreshFeed: () => Promise<void>;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
};

interface FeedProviderProps {
  children: ReactNode;
  isAuthenticated: boolean;
}

export const FeedProvider: React.FC<FeedProviderProps> = ({ children, isAuthenticated }) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Only load from backend - remove AsyncStorage dependency
      loadFeedFromBackend();
    } else {
      // Clear feed when user logs out
      setFeedItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Simple dependency - only on isAuthenticated boolean

  const loadFeedFromBackend = useCallback(async () => {
    if (isLoading) return; // Prevent multiple simultaneous calls
    
    try {
      setIsLoading(true);
      const response = await apiService.getFeed();
      if (response.success && response.data) {
        const feedArray = (response.data as any).feed;
        const backendFeed = Array.isArray(feedArray) ? feedArray : [];
        // Transform backend response to match frontend types
        const transformedFeed = backendFeed.map((item: any) => ({
          ...item,
          attendeeCount: item.attendee_count,
          rsvpStatus: item.rsvp_status
        }));
        setFeedItems(transformedFeed);
      } else {
        // Set empty feed if no data
        setFeedItems([]);
      }
    } catch (error) {
      logger.error('Error loading feed from backend:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependencies to prevent re-creation

  const loadFeed = useCallback(async () => {
    await loadFeedFromBackend();
  }, [loadFeedFromBackend]);

  const refreshFeed = useCallback(async () => {
    await loadFeedFromBackend();
  }, [loadFeedFromBackend]);

  const value: FeedContextType = {
    feedItems,
    isLoading,
    loadFeed,
    refreshFeed,
  };

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
};