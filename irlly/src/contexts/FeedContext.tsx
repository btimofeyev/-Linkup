import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FeedItem } from '../types';
import { apiService } from '../services/apiService';

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
  }, [isAuthenticated]);

  const loadFeedFromBackend = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getFeed();
      if (response.success && response.data) {
        const backendFeed = response.data.feed || [];
        setFeedItems(backendFeed);
      }
    } catch (error) {
      console.error('Error loading feed from backend:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFeed = async () => {
    await loadFeedFromBackend();
  };

  const refreshFeed = async () => {
    await loadFeedFromBackend();
  };

  const value: FeedContextType = {
    feedItems,
    isLoading,
    loadFeed,
    refreshFeed,
  };

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
};