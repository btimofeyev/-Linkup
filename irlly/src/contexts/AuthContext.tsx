import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  sendEmailOTP: (email: string) => Promise<void>;
  verifyEmailOTP: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserFromStorage();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || '',
            avatarUrl: session.user.user_metadata?.avatar_url
          };
          
          setUser(userData);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          await AsyncStorage.setItem('session', JSON.stringify(session));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('session');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const sessionData = await AsyncStorage.getItem('session');
      
      if (userData && sessionData) {
        setUser(JSON.parse(userData));
        // Restore Supabase session
        const session = JSON.parse(sessionData);
        await supabase.auth.setSession(session);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailOTP = async (email: string) => {
    try {
      const response = await authService.sendEmailOTP(email);
      if (!response.success) {
        throw new Error(response.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw error;
    }
  };

  const verifyEmailOTP = async (email: string, code: string) => {
    try {
      const response = await authService.verifyEmailOTP(email, code);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to verify code');
      }
      // User and session will be set automatically by onAuthStateChange
    } catch (error) {
      console.error('Error during verification:', error);
      throw error;
    }
  };


  const logout = async () => {
    try {
      await authService.signOut();
      // Auth state change will handle clearing storage
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    sendEmailOTP,
    verifyEmailOTP,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};