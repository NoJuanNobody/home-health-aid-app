import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Development mode - bypass authentication
  const isDevelopment = process.env.NODE_ENV === 'development';
  const devUser = {
    id: 1,
    name: 'Development User',
    email: 'dev@example.com',
    role: 'caregiver',
    phone: '+1 (555) 123-4567',
    address: '123 Dev Street, Development City',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // In development mode, automatically log in with dev user
      if (isDevelopment && !token) {
        console.log('🔧 Development mode: Auto-login enabled');
        setUser(devUser);
        setToken('dev-token');
        localStorage.setItem('token', 'dev-token');
        setLoading(false);
        return;
      }

      if (token) {
        try {
          const userData = await authService.getProfile();
          setUser(userData);
        } catch (error) {
          console.error('Failed to get user profile:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token, isDevelopment]);

  const login = async (email, password) => {
    // In development mode, accept any credentials
    if (isDevelopment) {
      console.log('🔧 Development mode: Bypassing authentication');
      localStorage.setItem('token', 'dev-token');
      setToken('dev-token');
      setUser(devUser);
      toast.success('Development login successful!');
      return { access_token: 'dev-token', user: devUser };
    }

    try {
      const response = await authService.login(email, password);
      const { access_token, user: userData } = response;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      
      toast.success('Login successful!');
      return response;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const { access_token, user: newUser } = response;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(newUser);
      
      toast.success('Registration successful!');
      return response;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (!isDevelopment) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      toast.success('Profile updated successfully!');
      return updatedUser;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
      throw error;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
