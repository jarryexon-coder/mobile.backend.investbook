import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      console.log('📦 Loading user from storage...');
      const storedToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      
      console.log(`📦 Stored token exists: ${!!storedToken}`);
      console.log(`📦 Stored user exists: ${!!userData}`);
      
      if (storedToken && userData) {
        console.log('📦 Found stored session, restoring...');
        setToken(storedToken);
        setUser(JSON.parse(userData));
        // Set the auth header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        console.log('✅ User session restored');
        console.log(`👤 User: ${JSON.parse(userData).username || JSON.parse(userData).email}`);
        console.log(`🔑 Token: ${storedToken.substring(0, 20)}...`);
      } else {
        console.log('⚠️ No stored session found');
        // Clear any invalid state
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      console.error('❌ Error loading user:', error);
      // Clear invalid state
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      // Validate input
      if (!email || !password) {
        return { success: false, message: 'Email and password are required' };
      }
      
      const response = await axios.post(`${API_URL}/login`, { email, password });
      
      console.log('📊 Login response:', {
        hasToken: !!response.data.token,
        hasUser: !!response.data.user,
        status: response.status
      });
      
      if (response.data.token) {
        const userToken = response.data.token;
        const userData = response.data.user;
        
        console.log('💾 Storing token and user data...');
        
        // Store both token and user data
        await AsyncStorage.setItem('userToken', userToken);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        // Verify storage worked
        const savedToken = await AsyncStorage.getItem('userToken');
        console.log(`✅ Token stored successfully, length: ${savedToken?.length || 0}`);
        
        // Update state
        setToken(userToken);
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        
        console.log('✅ Login successful, token stored');
        console.log(`🔑 Token: ${userToken.substring(0, 20)}...`);
        console.log(`👤 User: ${userData.username || userData.email}`);
        
        return { success: true, user: userData };
      }
      return { success: false, message: 'Invalid credentials - no token received' };
    } catch (error) {
      console.error('❌ Login error:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please check your credentials.'
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      console.log('📝 Registering new user:', email);
      
      const response = await axios.post(`${API_URL}/register`, {
        username,
        email,
        password
      });
      
      if (response.data.message || response.data.user) {
        console.log('✅ Registration successful!');
        // Auto-login after registration
        return await login(email, password);
      }
      return { success: false, message: 'Registration failed' };
    } catch (error) {
      console.error('❌ Registration error:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      console.log('🔄 Logging out...');
      
      // Clear storage
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      
      // Clear axios headers
      delete axios.defaults.headers.common['Authorization'];
      
      // Clear state
      setToken(null);
      setUser(null);
      
      console.log('✅ Logout successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Error during logout:', error);
      return { success: false, message: error.message };
    }
  };

  const updateUser = async (updates) => {
    if (!token) {
      return { success: false, message: 'Please sign in again.' };
    }

    try {
      const response = await axios.patch(`${API_URL}/profile`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUser = response.data.user;
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Unable to update your profile. Please try again.',
      };
    }
  };

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;

  // Verify token is still valid (can be called periodically)
  const verifyToken = async () => {
    if (!token) return false;
    try {
      const response = await axios.get(`${API_URL}/debug/token`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.status === 200;
    } catch (error) {
      console.log('⚠️ Token verification failed:', error.message);
      return false;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated,
    verifyToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
