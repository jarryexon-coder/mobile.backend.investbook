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

  // Add debug logs whenever token or user changes
  useEffect(() => {
    console.log('🔑 Current token:', token ? token.substring(0, 20) + '...' : 'No token');
    console.log('👤 Current user:', user ? { id: user.id, email: user.email, username: user.username } : 'No user');
  }, [token, user]);

  const loadUser = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      
      console.log('📦 Loading user from storage...');
      console.log('📦 Stored token exists:', !!storedToken);
      console.log('📦 Stored user data exists:', !!userData);
      
      if (storedToken && userData) {
        setToken(storedToken);
        setUser(JSON.parse(userData));
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        console.log('✅ User session restored');
        console.log('🔑 Token restored:', storedToken.substring(0, 20) + '...');
      } else {
        console.log('⚠️ No stored session found');
      }
    } catch (error) {
      console.error('Error loading user:', error);
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
        
        // Store token with the correct key name
        await AsyncStorage.setItem('userToken', userToken);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        // Verify storage
        const verifyToken = await AsyncStorage.getItem('userToken');
        console.log('✅ Token stored successfully, length:', verifyToken?.length);
        
        setToken(userToken);
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        
        console.log('✅ Login successful, token stored');
        console.log('🔑 Token stored:', userToken.substring(0, 20) + '...');
        console.log('👤 User stored:', { id: userData.id, email: userData.email, username: userData.username });
        
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
