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
  const [preventAutoLogin, setPreventAutoLogin] = useState(false);

  // Development mode - bypass authentication
  const isDevelopment = process.env.NODE_ENV === 'development';
  const devUser = {
    id: 1,
    name: 'Development User',
    email: 'dev@example.com',
    role: 'admin', // Changed from 'caregiver' to 'admin'
    phone: '+1 (555) 123-4567',
    address: '123 Dev Street, Development City',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // In development mode, automatically log in with admin user
      if (isDevelopment && !token && !preventAutoLogin) {
        console.log('🔧 Development mode: Auto-login enabled');
        try {
          const response = await authService.loginDev();
          const { access_token, user: userData } = response;
          
          setUser(userData);
          setToken(access_token);
          localStorage.setItem('token', access_token);
          setLoading(false);
          return;
        } catch (error) {
          console.error('Development auto-login failed:', error);
          // Fallback to dev user if API fails
          setUser(devUser);
          setToken('dev-token');
          localStorage.setItem('token', 'dev-token');
        }
      }

      // In development mode with token, just set the dev user
      if (isDevelopment && token && !preventAutoLogin) {
        console.log('🔧 Development mode: Using dev user');
        setUser(devUser);
        setLoading(false);
        return;
      }

      // Only make real API calls in production
      if (token && !isDevelopment) {
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
  }, [token, isDevelopment, preventAutoLogin]);

  const login = async (email, password) => {
    // In development mode, get a proper JWT token
    if (isDevelopment) {
      console.log('🔧 Development mode: Getting JWT token for admin user');
      try {
        const response = await authService.loginDev();
        const { access_token, user: userData } = response;
        
        localStorage.setItem('token', access_token);
        setToken(access_token);
        setUser(userData);
        setPreventAutoLogin(false); // Reset flag on manual login
        toast.success('Development login successful!');
        return response;
      } catch (error) {
        console.error('Development login failed:', error);
        toast.error('Development login failed');
        throw error;
      }
    }

    try {
      const response = await authService.login(email, password);
      const { access_token, user: userData } = response;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      setPreventAutoLogin(false); // Reset flag on manual login
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
      setPreventAutoLogin(true); // Prevent auto-login after logout
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (profileData) => {
    // In development mode, just update the local user
    if (isDevelopment) {
      const updatedUser = { ...devUser, ...profileData };
      setUser(updatedUser);
      toast.success('Profile updated successfully! (Development mode)');
      return updatedUser;
    }

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
    // In development mode, just show success
    if (isDevelopment) {
      toast.success('Password changed successfully! (Development mode)');
      return;
    }

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
