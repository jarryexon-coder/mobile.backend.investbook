import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://investbook-production.up.railway.app/api';
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
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        console.log('✅ User session restored');
      } else {
        console.log('⚠️ No stored session found');
        // Clear any invalid state
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      console.error('Error loading user:', error);
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
        console.log(`🔑 Token stored: ${userToken.substring(0, 20)}...`);
        console.log(`👤 User stored: ${JSON.stringify(userData)}`);
        
        return { success: true, user: userData };
      }
      return { success: false, message: 'Invalid credentials' };
    } catch (error) {
      console.error('Login error:', error.response?.data);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/register`, {
        username,
        email,
        password
      });
      
      if (response.data.message) {
        return { success: true, message: response.data.message };
      }
      return { success: false, message: 'Registration failed' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      console.log('🔄 Logging out...');
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      
      delete axios.defaults.headers.common['Authorization'];
      
      setToken(null);
      setUser(null);
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
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
