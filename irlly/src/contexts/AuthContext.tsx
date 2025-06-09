import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  needsProfileSetup: boolean;
  supabaseUser: any; // Raw Supabase user for profile setup
  sendEmailOTP: (email: string) => Promise<void>;
  verifyEmailOTP: (email: string, code: string) => Promise<void>;
  completeProfileSetup: (username: string, name: string) => Promise<void>;
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
  const [supabaseUser, setSupabaseUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        // First, try to load from storage
        await loadUserFromStorage();
        
        // Then check current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && mounted) {
          console.log('Found existing session, checking profile...');
          await handleAuthenticatedUser(session.user);
        } else if (mounted) {
          console.log('No existing session found');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state change event:', event, 'Session exists:', !!session);
        
        if (!mounted) {
          console.log('AuthContext: Component unmounted, ignoring auth state change');
          return;
        }

        if (event === 'SIGNED_IN' && session) {
          console.log('AuthContext: SIGNED_IN event - checking profile for user:', session.user.id);
          console.log('AuthContext: User email:', session.user.email);
          await handleAuthenticatedUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthContext: SIGNED_OUT event');
          setUser(null);
          setNeedsProfileSetup(false);
          setSupabaseUser(null);
          setIsLoading(false);
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('session');
        } else {
          console.log('AuthContext: Other auth event:', event);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthenticatedUser = async (supabaseUserData: any) => {
    try {
      console.log('AuthContext: handleAuthenticatedUser called with user:', supabaseUserData.id, supabaseUserData.email);
      setSupabaseUser(supabaseUserData);
      
      // Check if user has a profile in our database
      console.log('AuthContext: Checking for existing profile in database...');
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUserData.id)
        .single();

      console.log('AuthContext: Profile check result:', { profile, error });

      if (error && error.code === 'PGRST116') {
        // User doesn't have a profile, needs setup
        console.log('User needs profile setup');
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
        const userData: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          username: profile.username,
          createdAt: new Date(profile.created_at)
        };
        
        setUser(userData);
        setNeedsProfileSetup(false);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        // Store session for persistence
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await AsyncStorage.setItem('session', JSON.stringify(session));
        }
      }
    } catch (error) {
      console.error('Error handling authenticated user:', error);
      setNeedsProfileSetup(true);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const sessionData = await AsyncStorage.getItem('session');
      
      console.log('Loading from storage:', { userData: !!userData, sessionData: !!sessionData });
      
      if (userData && sessionData) {
        const user = JSON.parse(userData);
        const session = JSON.parse(sessionData);
        
        // Set user data from storage
        setUser(user);
        
        // Try to restore Supabase session
        const { error } = await supabase.auth.setSession(session);
        if (error) {
          console.error('Error restoring session:', error);
          // Clear invalid session data
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('session');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      // Clear corrupted storage data
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('session');
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
      console.log('AuthContext: Starting email OTP verification');
      const response = await authService.verifyEmailOTP(email, code);
      console.log('AuthContext: OTP verification response:', response);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to verify code');
      }
      
      console.log('AuthContext: OTP verification successful, user:', response.data.user);
      console.log('AuthContext: Waiting for onAuthStateChange to handle user setup...');
      // User and session will be set automatically by onAuthStateChange
    } catch (error) {
      console.error('AuthContext: Error during verification:', error);
      throw error;
    }
  };

  const completeProfileSetup = async (username: string, name: string) => {
    try {
      if (!supabaseUser) {
        throw new Error('No authenticated user found');
      }

      // Create user profile in database
      const { data: profile, error } = await supabase
        .from('users')
        .insert({
          id: supabaseUser.id,
          email: supabaseUser.email,
          username: username.toLowerCase(),
          name: name.trim(),
          phone_number: null,
          avatar_url: null,
          is_verified: true
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Username is already taken. Please choose a different one.');
        }
        throw new Error('Failed to create profile. Please try again.');
      }

      // Update Supabase user metadata
      await supabase.auth.updateUser({
        data: {
          username: username.toLowerCase(),
          name: name.trim()
        }
      });

      // Set the user data
      const userData: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        username: profile.username,
        createdAt: new Date(profile.created_at)
      };
      
      setUser(userData);
      setNeedsProfileSetup(false);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Store session for persistence
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await AsyncStorage.setItem('session', JSON.stringify(session));
      }
    } catch (error) {
      console.error('Error completing profile setup:', error);
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
    needsProfileSetup,
    supabaseUser,
    sendEmailOTP,
    verifyEmailOTP,
    completeProfileSetup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};