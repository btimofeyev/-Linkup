import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { logger } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  needsProfileSetup: boolean;
  supabaseUser: any; // Raw Supabase user for profile setup
  sendEmailOTP: (email: string) => Promise<void>;
  verifyEmailOTP: (email: string, code: string) => Promise<void>;
  completeProfileSetup: (username: string, name: string) => Promise<void>;
  refreshUser: () => Promise<void>;
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
  const [isHandlingAuth, setIsHandlingAuth] = useState(false);
  const [lastHandledUserId, setLastHandledUserId] = useState<string | null>(null);
  const [isRestoringFromStorage, setIsRestoringFromStorage] = useState(false);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // Use refs to access current state in auth listener
  const hasLoadedFromStorageRef = useRef(hasLoadedFromStorage);
  const userRef = useRef(user);
  const isRestoringFromStorageRef = useRef(isRestoringFromStorage);

  // Update refs when state changes
  useEffect(() => {
    hasLoadedFromStorageRef.current = hasLoadedFromStorage;
  }, [hasLoadedFromStorage]);
  
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  
  useEffect(() => {
    isRestoringFromStorageRef.current = isRestoringFromStorage;
  }, [isRestoringFromStorage]);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        logger.log('AuthContext: Starting auth initialization...');
        
        // Add overall timeout to prevent the whole initialization from hanging
        const initPromise = (async () => {
          // First, try to load from storage
          setIsRestoringFromStorage(true);
          await loadUserFromStorage();
          setIsRestoringFromStorage(false);
          
          // Then check current session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session && mounted) {
            logger.log('AuthContext: Found existing session, checking profile...');
            await handleAuthenticatedUser(session.user);
          } else if (mounted) {
            logger.log('AuthContext: No existing session found');
            setIsLoading(false);
          }
        })();

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth initialization timeout')), 8000)
        );

        await Promise.race([initPromise, timeoutPromise]);
        
      } catch (error) {
        logger.error('AuthContext: Error initializing auth:', error);
        if (mounted) {
          if (error instanceof Error && error.message === 'Auth initialization timeout') {
            logger.log('AuthContext: Initialization timed out, forcing loading to false');
          }
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.log('AuthContext: Auth state change event:', event, 'Session exists:', !!session);
        
        if (!mounted) {
          logger.log('AuthContext: Component unmounted, ignoring auth state change');
          return;
        }

        if (isRestoringFromStorageRef.current) {
          logger.log('AuthContext: Ignoring auth state change during storage restoration');
          return;
        }

        if (event === 'SIGNED_OUT') {
          logger.log('AuthContext: SIGNED_OUT event');
          setUser(null);
          setNeedsProfileSetup(false);
          setSupabaseUser(null);
          setIsLoading(false);
          setIsHandlingAuth(false);
          setLastHandledUserId(null);
          setHasLoadedFromStorage(false);
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('session');
          return;
        }

        if (hasLoadedFromStorageRef.current && userRef.current) {
          logger.log('AuthContext: User already loaded from storage, ignoring auth state change', {
            hasLoadedFromStorage: hasLoadedFromStorageRef.current,
            hasUser: !!userRef.current,
            userId: userRef.current?.id
          });
          return;
        }

        if (event === 'SIGNED_IN' && session) {
          logger.log('AuthContext: SIGNED_IN event - checking profile for user:', session.user.id);
          logger.log('AuthContext: User email:', session.user.email);
          await handleAuthenticatedUser(session.user);
        } else {
          logger.log('AuthContext: Other auth event:', event);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthenticatedUser = async (supabaseUserData: any) => {
    // Prevent duplicate calls for the same user
    if (isHandlingAuth || lastHandledUserId === supabaseUserData.id) {
      logger.log('AuthContext: Already handling auth for this user, skipping duplicate call');
      return;
    }

    try {
      logger.log('AuthContext: handleAuthenticatedUser called with user:', supabaseUserData.id, supabaseUserData.email);
      setIsHandlingAuth(true);
      setLastHandledUserId(supabaseUserData.id);
      setSupabaseUser(supabaseUserData);
      
      // Check if user has a profile in our database with timeout
      logger.log('AuthContext: Checking for existing profile in database...');
      
      const profileCheckPromise = supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUserData.id)
        .single();

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile check timeout')), 5000)
      );

      const { data: profile, error } = await Promise.race([
        profileCheckPromise,
        timeoutPromise
      ]) as any;

      logger.log('AuthContext: Profile check result:', { profile, error });

      if (error && error.code === 'PGRST116') {
        // User doesn't have a profile, needs setup
        logger.log('AuthContext: User needs profile setup');
        setNeedsProfileSetup(true);
        setUser(null);
      } else if (error) {
        // Other error - log it but don't block
        logger.error('AuthContext: Profile check error:', error);
        if (error instanceof Error && error.message === 'Profile check timeout') {
          logger.log('AuthContext: Profile check timed out, assuming needs setup');
          setNeedsProfileSetup(true);
          setUser(null);
        } else {
          setNeedsProfileSetup(true);
          setUser(null);
        }
      } else if (profile) {
        // User has a complete profile
        logger.log('AuthContext: User has complete profile');
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
      } else {
        // No profile data returned
        logger.log('AuthContext: No profile data returned, needs setup');
        setNeedsProfileSetup(true);
        setUser(null);
      }
    } catch (error) {
      logger.error('AuthContext: Error handling authenticated user:', error);
      setNeedsProfileSetup(true);
      setUser(null);
    } finally {
      logger.log('AuthContext: Setting loading to false');
      setIsLoading(false);
      setIsHandlingAuth(false);
    }
  };

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const sessionData = await AsyncStorage.getItem('session');
      
      logger.log('AuthContext: Loading from storage:', { userData: !!userData, sessionData: !!sessionData });
      
      if (userData && sessionData) {
        const user = JSON.parse(userData);
        const session = JSON.parse(sessionData);
        
        logger.log('AuthContext: Found stored user data, restoring session...');
        
        // Set user data from storage immediately
        setUser(user);
        setNeedsProfileSetup(false);
        setHasLoadedFromStorage(true);
        logger.log('AuthContext: User restored from storage successfully', {
          userId: user.id,
          settingHasLoadedFromStorage: true
        });
        
        // Silently try to restore session in background, but don't block on it
        setTimeout(async () => {
          try {
            await supabase.auth.setSession(session);
            logger.log('AuthContext: Background session restore completed');
          } catch (error) {
            logger.log('AuthContext: Background session restore failed, but user remains logged in');
            // Clean up invalid session data
            await AsyncStorage.removeItem('session');
          }
        }, 100); // Small delay to avoid immediate auth state change
      } else {
        logger.log('AuthContext: No stored user data found');
      }
    } catch (error) {
      logger.error('AuthContext: Error loading user from storage:', error);
      // Clear corrupted storage data
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('session');
      setUser(null);
      setNeedsProfileSetup(false);
    }
  };

  const sendEmailOTP = async (email: string) => {
    try {
      const response = await authService.sendEmailOTP(email);
      if (!response.success) {
        throw new Error(response.error || 'Failed to send verification code');
      }
    } catch (error) {
      logger.error('Error sending verification code:', error);
      throw error;
    }
  };

  const verifyEmailOTP = async (email: string, code: string) => {
    try {
      logger.log('AuthContext: Starting email OTP verification');
      const response = await authService.verifyEmailOTP(email, code);
      logger.log('AuthContext: OTP verification response:', response);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to verify code');
      }
      
      logger.log('AuthContext: OTP verification successful, user:', response.data.user);
      logger.log('AuthContext: Waiting for onAuthStateChange to handle user setup...');
      // User and session will be set automatically by onAuthStateChange
    } catch (error) {
      logger.error('AuthContext: Error during verification:', error);
      throw error;
    }
  };

  const completeProfileSetup = async (username: string, name: string) => {
    try {
      if (!supabaseUser) {
        throw new Error('No authenticated user found');
      }

      logger.log('AuthContext: Creating profile for user:', {
        id: supabaseUser.id,
        email: supabaseUser.email,
        username: username.toLowerCase(),
        name: name.trim()
      });

      // Create user profile in database
      let profileResult = await supabase
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

      let profile = profileResult.data;
      let error = profileResult.error;

      logger.log('AuthContext: Profile creation result:', { profile, error });

      if (error) {
        logger.error('AuthContext: Profile creation error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        if (error.code === '23505') {
          if (error.message.includes('users_pkey')) {
            // User record already exists, try to update instead
            logger.log('AuthContext: User record exists, attempting to update instead...');
            const updateResult = await supabase
              .from('users')
              .update({
                email: supabaseUser.email,
                username: username.toLowerCase(),
                name: name.trim(),
                is_verified: true
              })
              .eq('id', supabaseUser.id)
              .select()
              .single();

            if (updateResult.error) {
              logger.error('AuthContext: Profile update error:', updateResult.error);
              if (updateResult.error.message.includes('username')) {
                throw new Error('Username is already taken. Please choose a different one.');
              }
              throw new Error(`Failed to update profile: ${updateResult.error.message}`);
            }
            
            profile = updateResult.data;
            error = null; // Clear the error since update succeeded
            logger.log('AuthContext: Profile updated successfully:', profile);
          } else {
            throw new Error('Username is already taken. Please choose a different one.');
          }
        } else {
          throw new Error(`Failed to create profile: ${error.message}`);
        }
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
      logger.error('Error completing profile setup:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      if (!supabaseUser) return;
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (!error && profile) {
        const userData: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          username: profile.username,
          createdAt: new Date(profile.created_at)
        };
        
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      logger.error('Error refreshing user data:', error);
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      // Auth state change will handle clearing storage
    } catch (error) {
      logger.error('Error during logout:', error);
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
    refreshUser,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};