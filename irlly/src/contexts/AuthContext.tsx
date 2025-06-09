import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  needsProfileSetup: boolean;
  sendEmailOTP: (email: string) => Promise<void>;
  verifyEmailOTP: (email: string, code: string) => Promise<void>;
  completeProfileSetup: () => Promise<void>;
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
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  useEffect(() => {
    loadUserFromStorage();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          console.log('SIGNED_IN event - checking profile for user:', session.user.id);
          
          // Check if user has a profile in our database
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          console.log('Profile check result:', { profile, error });

          if (error && error.code === 'PGRST116') {
            // User doesn't have a profile, needs setup
            console.log('User needs profile setup - setting needsProfileSetup to true');
            setNeedsProfileSetup(true);
            setUser(null);
          } else if (error) {
            // Other error
            console.log('Profile check error:', error);
            setNeedsProfileSetup(true);
            setUser(null);
          } else if (profile) {
            // User has a complete profile
            console.log('User has complete profile');
            const userData = {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              username: profile.username,
              avatarUrl: profile.avatar_url
            };
            
            setUser(userData);
            setNeedsProfileSetup(false);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
          }
          
          // Always set loading to false after auth check
          setIsLoading(false);
          
          await AsyncStorage.setItem('session', JSON.stringify(session));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setNeedsProfileSetup(false);
          setIsLoading(false);
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
      
      console.log('Loading from storage:', { userData: !!userData, sessionData: !!sessionData });
      
      if (userData && sessionData) {
        setUser(JSON.parse(userData));
        // Restore Supabase session
        const session = JSON.parse(sessionData);
        await supabase.auth.setSession(session);
      } else {
        // No stored session, set loading to false
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
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


  const completeProfileSetup = async () => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch updated user profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        const userData = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          username: profile.username,
          avatarUrl: profile.avatar_url
        };
        
        setUser(userData);
        setNeedsProfileSetup(false);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error completing profile setup:', error);
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
    needsProfileSetup,
    sendEmailOTP,
    verifyEmailOTP,
    completeProfileSetup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};