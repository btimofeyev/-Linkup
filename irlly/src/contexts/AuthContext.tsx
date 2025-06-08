import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { apiService } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  sendVerificationCode: (phoneNumber: string) => Promise<void>;
  verifyCodeAndLogin: (phoneNumber: string, code: string) => Promise<void>;
  checkUsernameAvailability: (username: string, phoneNumber: string) => Promise<{ available: boolean; message: string }>;
  sendVerificationForRegistration: (data: { username: string; phoneNumber: string; name: string; email?: string }) => Promise<void>;
  verifyAndCreateUser: (data: { username: string; phoneNumber: string; code: string; name: string; email?: string }) => Promise<void>;
  sendVerificationForLogin: (username: string) => Promise<{ phoneNumber: string }>;
  verifyAndLogin: (username: string, code: string) => Promise<void>;
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
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      if (userData && accessToken) {
        setUser(JSON.parse(userData));
        apiService.setAccessToken(accessToken);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationCode = async (phoneNumber: string) => {
    try {
      const response = await apiService.sendVerificationCode(phoneNumber);
      if (!response.success) {
        throw new Error(response.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw error;
    }
  };

  const verifyCodeAndLogin = async (phoneNumber: string, code: string) => {
    try {
      const response = await apiService.verifyCodeAndLogin(phoneNumber, code);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to verify code');
      }

      const { user, accessToken } = response.data;
      
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('accessToken', accessToken);
      
      apiService.setAccessToken(accessToken);
      setUser(user);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const checkUsernameAvailability = async (username: string, phoneNumber: string): Promise<{ available: boolean; message: string }> => {
    try {
      const response = await apiService.checkUsernameAvailability(username, phoneNumber);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to check availability');
      }
      
      return {
        available: response.data.available,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  };

  const sendVerificationForRegistration = async (data: { username: string; phoneNumber: string; name: string; email?: string }) => {
    try {
      const response = await apiService.sendVerificationForRegistration(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending verification for registration:', error);
      throw error;
    }
  };

  const verifyAndCreateUser = async (data: { username: string; phoneNumber: string; code: string; name: string; email?: string }) => {
    try {
      const response = await apiService.verifyAndCreateUser(data);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create account');
      }

      const { user, accessToken } = response.data;
      
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('accessToken', accessToken);
      
      apiService.setAccessToken(accessToken);
      setUser(user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const sendVerificationForLogin = async (username: string): Promise<{ phoneNumber: string }> => {
    try {
      const response = await apiService.sendVerificationForLogin(username);
      if (!response.success) {
        throw new Error(response.error || 'Failed to send verification code');
      }
      
      return {
        phoneNumber: response.data?.phoneNumber || ''
      };
    } catch (error) {
      console.error('Error sending verification for login:', error);
      throw error;
    }
  };

  const verifyAndLogin = async (username: string, code: string) => {
    try {
      const response = await apiService.verifyAndLogin(username, code);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to login');
      }

      const { user, accessToken } = response.data;
      
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('accessToken', accessToken);
      
      apiService.setAccessToken(accessToken);
      setUser(user);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear essential auth data from AsyncStorage
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('hasShownContactsScreen');
      
      apiService.setAccessToken('');
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    sendVerificationCode,
    verifyCodeAndLogin,
    checkUsernameAvailability,
    sendVerificationForRegistration,
    verifyAndCreateUser,
    sendVerificationForLogin,
    verifyAndLogin,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};