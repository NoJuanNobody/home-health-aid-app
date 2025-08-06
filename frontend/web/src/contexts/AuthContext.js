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
  
  // Available development users
  const devUsers = {
    admin: {
      id: 1,
      name: 'Admin User',
      email: 'admin@homehealth.com',
      username: 'admin',
      role: 'admin',
      phone: '+1 (555) 123-4567',
      address: '123 Admin Street, Admin City',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    manager: {
      id: 2,
      name: 'Sarah Johnson',
      email: 'manager@homehealth.com',
      username: 'manager',
      role: 'manager',
      phone: '+1 (555) 234-5678',
      address: '456 Manager Ave, Manager City',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    caregiver1: {
      id: 3,
      name: 'Maria Garcia',
      email: 'caregiver1@homehealth.com',
      username: 'caregiver1',
      role: 'caregiver',
      phone: '+1 (555) 345-6789',
      address: '789 Caregiver St, Caregiver City',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    caregiver2: {
      id: 4,
      name: 'John Smith',
      email: 'caregiver2@homehealth.com',
      username: 'caregiver2',
      role: 'caregiver',
      phone: '+1 (555) 456-7890',
      address: '321 Caregiver Rd, Caregiver City',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // In development mode, only auto-login if no token exists and auto-login is not prevented
      if (isDevelopment && !token && !preventAutoLogin) {
        console.log('🔧 Development mode: Auto-login enabled');
        try {
          const response = await authService.loginDev();
          const { access_token, user: userData } = response;
          
          // Update with our development admin user info
          const updatedUserData = {
            ...userData,
            name: devUsers.admin.name,
            email: devUsers.admin.email,
            role: devUsers.admin.role,
            phone: devUsers.admin.phone,
            address: devUsers.admin.address
          };
          
          setUser(updatedUserData);
          setToken(access_token);
          localStorage.setItem('token', access_token);
          localStorage.setItem('devUser', JSON.stringify(updatedUserData));
          setLoading(false);
          return;
        } catch (error) {
          console.error('Development auto-login failed:', error);
          // Fallback to admin user if API fails
          setUser(devUsers.admin);
          setToken('dev-token');
          localStorage.setItem('token', 'dev-token');
        }
      }

      // In development mode with existing token, try to restore user state
      if (isDevelopment && token && !preventAutoLogin) {
        console.log('🔧 Development mode: Restoring user state');
        // Try to get user from localStorage or default to admin
        const savedUser = localStorage.getItem('devUser');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            
            // If we have a real JWT token, verify it's still valid
            if (token !== 'dev-token') {
              try {
                const userData = await authService.getProfile();
                // Update with our development user info
                const updatedUserData = {
                  ...userData,
                  name: parsedUser.name,
                  email: parsedUser.email,
                  role: parsedUser.role,
                  phone: parsedUser.phone,
                  address: parsedUser.address
                };
                setUser(updatedUserData);
              } catch (error) {
                console.error('Token validation failed, falling back to saved user');
              }
            }
          } catch (e) {
            setUser(devUsers.admin);
          }
        } else {
          setUser(devUsers.admin);
        }
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
      localStorage.removeItem('devUser'); // Clear saved user state
      setToken(null);
      setUser(null);
      setPreventAutoLogin(true); // Prevent auto-login after logout
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (profileData) => {
    // In development mode, just update the local user
    if (isDevelopment) {
      const updatedUser = { ...user, ...profileData };
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

  // Development user switching functionality
  const switchToUser = async (userKey) => {
    if (!isDevelopment) {
      toast.error('User switching is only available in development mode');
      return;
    }

    const selectedUser = devUsers[userKey];
    if (!selectedUser) {
      toast.error('User not found');
      return;
    }

    console.log('🔧 Switching to user:', selectedUser.name, selectedUser.role);
    
    try {
      // Get a proper JWT token for the selected user
      const response = await authService.loginDevUser(selectedUser.email);
      const { access_token, user: userData } = response;
      
      // Update the user data with our development user info
      const updatedUserData = {
        ...userData,
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        phone: selectedUser.phone,
        address: selectedUser.address
      };
      
      setUser(updatedUserData);
      setToken(access_token);
      localStorage.setItem('token', access_token);
      localStorage.setItem('devUser', JSON.stringify(updatedUserData)); // Save user state
      setPreventAutoLogin(true); // Prevent auto-login after switching
      toast.success(`Switched to ${selectedUser.name} (${selectedUser.role})`);
      
      // Force page reload to refresh all data with new user context
      console.log('🔄 Reloading page to refresh data for new user...');
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Small delay to show the success toast
    } catch (error) {
      console.error('Failed to get JWT token for user switch:', error);
      toast.error('Failed to switch user. Please try again.');
    }
  };

  const getAvailableUsers = () => {
    if (!isDevelopment) return [];
    return Object.entries(devUsers).map(([key, user]) => ({
      key,
      name: user.name,
      email: user.email,
      role: user.role
    }));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    // Development mode functions
    switchToUser,
    getAvailableUsers,
    isDevelopment,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
